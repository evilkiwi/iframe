import { useState } from 'react';

import { useIFrame } from '../../../src';
import { rand } from './helpers';

export function IFrame() {
  const [randomTip, setRandomTip] = useState('');
  const [result, setResult] = useState('');
  const [err, setErr] = useState('');

  const id = window.location.hash.substr(1);

  const { send, handle, post } = useIFrame({
    mode: 'client',
    id: `iframe-${id}`,
    remote: 'http://localhost:5173',
    debug: true,
  });

  handle<{ tip: string }>('random-tip', async ({ tip }) => {
    setRandomTip(tip);
  });

  async function asyncHandler() {
    try {
      const fetch = await send<any, string>('async', {
        dummy: 'lol 123',
      });
      console.log(fetch);

      setResult(fetch);
    } catch (e) {
      throw new Error(`Async fetch failed! ${e}`);
    }
  }

  async function error() {
    try {
      await send('err');
    } catch (e) {
      setErr(`${e}`);
    }
  }

  function sync() {
    post({
      type: 'dummy',
      payload: rand(1, 100000),
    });
  }

  return (
    <>
      <h1>Child Content</h1>
      <p>Async result: {result}</p>
      <p>Error result: {err}</p>
      <button onClick={() => asyncHandler()}>Click for Async</button>
      <button onClick={() => sync()}>Click for Sync</button>
      <button onClick={() => error()}>Click for Error</button>
      {randomTip.length > 0 && <p>{randomTip}</p>}
    </>
  );
}
