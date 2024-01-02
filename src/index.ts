import { useCallback, useEffect, useState } from 'react';

import { decodeErr, encodeErr, isErr } from './error';
import { debug } from './logger';
import type { AsyncHandler, EventHandler, OutgoingMessageBody, PendingPromise, PostMessageBody, UseIFrameOptions } from './types';

/**
 * Random ID generator for async IPC messages.
 * TODO: Should this be more intelligent? Given the range,
 * I can't imagine short-form async messages would overlap.
 */
export function generateId() {
  return Math.floor(Math.random() * 1000000) + 1;
}

export const promises: Record<string, PendingPromise> = {};
export const handlers: Record<string, AsyncHandler> = {};
export const events: Record<string, EventHandler> = {};

export function useIFrame({
  mode,
  id,
  remote = '*',
  timeout = 15000,
  maxHandshakeAttempts = 10,
  debug: shouldDebug = false,
  ...props
}: UseIFrameOptions) {
  // Whether or not this instance of the hook is the host.
  const isHost = mode === 'host';

  // Whether or not we're connected to the remote.
  const [connected, setConnected] = useState(false);

  // Handler for any messages coming in.
  const messageHandler = useCallback(async ({ origin, source, data }: MessageEvent) => {
    if (!data?.id || !data?.type || !data?.payload) {
      return;
    } else if (data.id !== id) {
      return;
    }

    const { type, payload } = data as OutgoingMessageBody;

    if (type === '_async_response') {
      if (typeof payload?.asyncId !== 'number' || typeof payload?.payload === 'undefined') {
        return;
      }

      const { asyncId, payload: asyncPayload } = payload;
      const promise = promises[`${asyncId}`];

      shouldDebug && debug(mode, 'processing incoming async response', asyncPayload);

      if (!!promise) {
        shouldDebug && debug(mode, 'found promise for async response');

        clearTimeout(promise.timeout);

        if (isErr(asyncPayload)) {
          promise.reject(decodeErr(asyncPayload));
        } else {
          promise.resolve(asyncPayload);
        }

        removePromise(asyncId);
      } else {
        shouldDebug && debug(mode, 'no promise found for async response', asyncId);
      }
    } else if (type === '_async_request') {
      if (typeof payload?.asyncId !== 'number' || !payload?.type || !payload?.payload) {
        return;
      }

      const { asyncId, payload: asyncPayload } = payload;
      const handler = handlers[payload.type];

      shouldDebug && debug(mode, 'processing incoming async request', payload);

      if (!!handler) {
        try {
          const response = await handler(asyncPayload);

          post({
            type: '_async_response',
            payload: {
              asyncId,
              payload: response,
            },
          });
        } catch (e) {
          post({
            type: '_async_response',
            payload: {
              asyncId,
              payload: encodeErr(e as Error),
            },
          });
        }
      }
    } else {
      const eventHandler = events[type];

      if (!eventHandler) {
        return;
      }

      shouldDebug && debug(mode, 'processing incoming sync event', type, payload);

      eventHandler(payload);
    }
  }, []);

  // Ensure the global message handler is registered and listening.
  useEffect(() => {
    window.addEventListener('message', messageHandler);

    return () => window.removeEventListener('message', messageHandler);
  }, [messageHandler]);

  // Raw function for sending synchronous messages.
  function post<Payload = any>(rawPayload: PostMessageBody<Payload>) {
    const target = isHost ? props.frame?.current?.contentWindow : window.parent;

    if (!target) {
      throw new Error('No target window found.');
    }

    const payload: OutgoingMessageBody = {
      ...rawPayload,
      id,
    };

    shouldDebug && debug(mode, 'sending raw message', payload);

    target.postMessage(payload, {
      targetOrigin: isHost ? remote : '*',
    });
  }

  // Handles asynchronous requests between host and client.
  async function send<Payload = any, Response = any>(type: string, payload?: Payload, overrideTimeout?: number) {
    const promise = new Promise<Response>((resolve, reject) => {
      const asyncId = generateId();

      const interval = setTimeout(() => {
        const promise = promises[asyncId];

        if (!!promise) {
          promise.reject(new Error('Request timed out.'));
        }

        removePromise(asyncId);
      }, overrideTimeout ?? timeout);

      promises[asyncId] = {
        resolve,
        reject,
        timeout: interval,
      };

      post({
        type: '_async_request',
        payload: {
          asyncId,
          type: type,
          payload: payload ?? {},
        },
      });
    });

    return promise;
  }

  function removePromise(asyncId: string | number) {
    shouldDebug && debug(mode, 'removing promise', asyncId);
    delete promises[asyncId];
  }

  // Handle the handshake between host and client so we know when things are ready.
  async function attemptHandshake(attempt = 0) {
    try {
      const success = await send('_handshake_request', {}, 500);

      if (success !== true) {
        throw new Error('Invalid handshake response.');
      } else {
        setConnected(true);
      }
    } catch {
      if (attempt >= maxHandshakeAttempts) {
        throw new Error('Max handshake attempts exceeded.');
      }

      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 250);
      });

      return attemptHandshake(attempt + 1);
    }
  }

  // Allow registering (and unregistering) handlers for async requests.
  function handle<Payload = any>(type: string, handler: AsyncHandler<Payload>) {
    handlers[type] = handler;

    return () => {
      delete handlers[type];
    };
  }

  // Allow registering and emitting of synchronous events.
  function listen<Payload = any>(type: string, handler: EventHandler<Payload>) {
    events[type] = handler;

    return () => {
      delete events[type];
    };
  }

  function emit<Payload = any>(type: string, payload: Payload) {
    return post<Payload>({
      type,
      payload,
    });
  }

  // On initial render, attempt to handshake with the remote.
  useEffect(() => {
    if (mode === 'host') {
      attemptHandshake();
    } else {
      handle('_handshake_request', () => true);
    }
  }, []);

  return { connected, post, send, handle, listen, emit };
}
