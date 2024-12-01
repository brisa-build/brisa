import type { InternalConstants } from '../../types';

export default function runtimeVersion(
  jsRuntime: InternalConstants['JS_RUNTIME'],
) {
  if (jsRuntime === 'node') {
    return `Node.js ${process.version}`;
  }
  if (jsRuntime === 'deno') {
    // @ts-ignore
    return `Deno ${Deno.version.deno}`;
  }

  return `Bun.js ${Bun.version}`;
}
