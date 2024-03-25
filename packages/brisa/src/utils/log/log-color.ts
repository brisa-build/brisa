export const greenLog = (text: string) =>
  Bun.enableANSIColors ? `\x1b[32m${text}\x1b[0m` : text;

export const yellowLog = (text: string) =>
  Bun.enableANSIColors ? `\x1b[33m${text}\x1b[0m` : text;

export const redLog = (text: string) =>
  Bun.enableANSIColors ? `\x1b[31m${text}\x1b[0m` : text;

export const blueLog = (text: string) =>
  Bun.enableANSIColors ? `\x1b[34m${text}\x1b[0m` : text;

export const cyanLog = (text: string) =>
  Bun.enableANSIColors ? `\x1b[36m${text}\x1b[0m` : text;
