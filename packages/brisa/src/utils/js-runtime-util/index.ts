import type { InternalConstants } from '../../types';

export function runtimeVersion(jsRuntime: InternalConstants['JS_RUNTIME']) {
  if (jsRuntime === 'node') {
    return `Node.js ${process.version}`;
  }
  if (jsRuntime === 'deno') {
    // @ts-ignore
    return `Deno ${Deno.version.deno}`;
  }

  return `Bun.js ${Bun.version}`;
}

export function getRuntime() {
  if (typeof Bun !== 'undefined') {
    return 'bun';
  }

  // @ts-ignore
  if (typeof Deno !== 'undefined') {
    return 'deno';
  }

  return 'node';
}
