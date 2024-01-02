import { useRef, useState } from 'react';

import { useIFrame } from '../../../src';

let interval1: number | undefined;
let interval2: number | undefined;

export function IFrame() {
  const iFrame1Ref = useRef<HTMLIFrameElement>(null);
  const iFrame2Ref = useRef<HTMLIFrameElement>(null);

  const [loadingRandom1, setLoadingRandom1] = useState(false);
  const [loadingRandom2, setLoadingRandom2] = useState(false);
  const [lastDummy1, setLastDummy1] = useState('');
  const [lastDummy2, setLastDummy2] = useState('');
  const [countdown1, setCountdown1] = useState(0);
  const [countdown2, setCountdown2] = useState(0);

  const {
    connected: connected1,
    handle: handle1,
    listen: listen1,
    send: send1,
  } = useIFrame({
    mode: 'host',
    id: 'iframe-1',
    frame: iFrame1Ref,
    remote: 'http://localhost:5174',
    timeout: 15000,
    debug: true,
  });

  const {
    connected: connected2,
    handle: handle2,
    listen: listen2,
    send: send2,
  } = useIFrame({
    mode: 'host',
    id: 'iframe-2',
    frame: iFrame2Ref,
    remote: 'http://localhost:5174',
    timeout: 15000,
    debug: true,
  });

  async function random1() {
    setLoadingRandom1(true);

    await send1('random-tip', {
      tip: 'Penguins are cool 1',
    });

    setLoadingRandom1(false);
  }

  async function random2() {
    setLoadingRandom2(true);

    await send2('random-tip', {
      tip: 'Penguins are cool 2',
    });

    setLoadingRandom2(false);
  }

  listen1('dummy', num => {
    setLastDummy1(`${num}`);
  });

  listen2('dummy', num => {
    setLastDummy2(`${num}`);
  });

  handle1('err', async () => {
    throw new Error('Some random error');
  });

  handle2('err', async () => {
    throw new Error('Some random error');
  });

  handle1<{ dummy: string }>('async', async payload => {
    setLastDummy1(payload.dummy);
    setCountdown1(5);

    return new Promise<string>(resolve => {
      interval1 = setInterval(() => {
        setCountdown1(countdown1 - 1);

        if (countdown1 === 0) {
          clearInterval(interval1);
          resolve('Hello world!');
        }
      }, 1000);
    });
  });

  handle2<{ dummy: string }>('async', async payload => {
    setLastDummy2(payload.dummy);
    setCountdown2(5);

    return new Promise<string>(resolve => {
      interval2 = setInterval(() => {
        setCountdown2(countdown2 - 1);

        if (countdown2 === 0) {
          clearInterval(interval2);
          resolve('Hello world!');
        }
      }, 1000);
    });
  });

  return (
    <>
      <div className="col">
        <h1>Parent Content 1 ({connected1 ? 'Connected!' : 'Disconnected'})</h1>
        <p>Last dummy text: {lastDummy1}</p>
        <div className="button">
          <button
            disabled={loadingRandom1}
            onClick={e => {
              e.preventDefault();
              random1();
            }}
          >
            Trigger Random Tip
          </button>
        </div>
        <iframe src="http://localhost:5174#1" ref={iFrame1Ref} sandbox="allow-scripts allow-same-origin" />
        {countdown1 > 0 && <p>Waiting to response... {countdown1}s</p>}
      </div>
      <div className="col">
        <h1>Parent Content 2 ({connected2 ? 'Connected!' : 'Disconnected'})</h1>
        <p>Last dummy text: {lastDummy2}</p>
        <div className="button">
          <button
            disabled={loadingRandom2}
            onClick={e => {
              e.preventDefault();
              random2();
            }}
          >
            Trigger Random Tip
          </button>
        </div>
        <iframe src="http://localhost:5174#2" ref={iFrame2Ref} sandbox="allow-scripts allow-same-origin" />
        {countdown2 > 0 && <p>Waiting to response... {countdown2}s</p>}
      </div>
    </>
  );
}
