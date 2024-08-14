import process from 'node:process';
import os from 'node:os';
import tty from 'node:tty';

function getForceColorDefinition() {
  const { env } = process;
  if (!env.FORCE_COLOR) return;
  if (env.FORCE_COLOR === 'true' || env.FORCE_COLOR.length === 0) return true;
  if (env.FORCE_COLOR === 'false') return false;
  return Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3) > 0;
}

export default function isANSIColorsSupported() {
  const { env } = process;
  const hasForceColor = getForceColorDefinition();

  if (hasForceColor !== undefined) return hasForceColor;
  if (!tty.isatty(1) && !tty.isatty(2)) return false;
  if (process.platform === 'win32') {
    const osRelease = os.release().split('.');
    return Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586;
  }

  return env.TERM !== 'dumb';
}

// Similar than Bun.enableANSIColors but also available in Node.js
export const enableANSIColors = isANSIColorsSupported();
