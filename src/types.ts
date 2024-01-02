import type { RefObject } from 'react';

export interface UseIFrameOptions {
  /**
   * Whether or not this instance of the hook is the host.
   * i.e. for an embedded iFrame page, this is `client`.
   */
  mode: 'host' | 'client';

  /**
   * A unique ID that both host & client share, allowing multiple channels/iFrames for communication.
   */
  id: string | number;

  /**
   * The iFrame ref to use for communication and enforcing security.
   */
  frame?: RefObject<HTMLIFrameElement>;

  /**
   * Only applies to Host mode. The URL of the remote iFrame being loaded.
   * This is required to enforce cross-origin safety.
   */
  remote?: string;

  /**
   * Timeout for any asynchronous messages between the host and client.
   * Defaults to `15000` (15 seconds). This also applies to the initial
   * handshake.
   */
  timeout?: number;

  /**
   * Total amount of attempts to make for handshake once the iFrame is loaded.
   * Defaults to `10`.
   */
  maxHandshakeAttempts?: number;

  /**
   * Whether to output debug messages to the console. Can be toggled at any time.
   * Defaults to `false`.
   */
  debug?: boolean;
}

export interface OutgoingMessageBody {
  id: string | number;
  type: string;
  payload: any;
}

export interface PostMessageBody<Payload = any> {
  type: string;
  payload: Payload;
}

export type AsyncHandler<Payload = any> = (payload: Payload) => Promise<unknown> | unknown | void;

export type EventHandler<Payload = any> = (payload: Payload) => void;

export interface PendingPromise {
  resolve: (value?: any) => void;
  reject: (reason: Error) => void;
  timeout: number;
}
