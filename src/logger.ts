export function pad(text: string | number, length: number, char = '0') {
  let newText = text.toString();

  while (`${newText}`.length < length) {
    newText = `${char}${newText}`;
  }

  return newText;
}

export function timestamp() {
  const date = new Date();
  return `${date.getFullYear()}-${pad(date.getMonth(), 2)}-${pad(date.getDate(), 2)} ${pad(date.getHours(), 2)}:${pad(
    date.getMinutes(),
    2,
  )}:${pad(date.getSeconds(), 2)}`;
}

export function debug(...args: unknown[]) {
  console.debug(`[${timestamp()}]`, ...args);
}

export function error(...args: unknown[]) {
  console.error(`[${timestamp()}] [ERR]`, ...args);
}
