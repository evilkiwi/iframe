export const errPrefix = '_ekIFrameError:';

export function encodeErr(e: Error) {
  return `${errPrefix}${e.message}`;
}

export function decodeErr(str: string) {
  return new Error(str.replace(errPrefix, ''));
}

export function isErr(str: string) {
  return typeof str === 'string' && str.startsWith(errPrefix);
}
