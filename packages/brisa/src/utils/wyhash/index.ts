type Input = string | ArrayBufferView | ArrayBuffer | SharedArrayBuffer;
type Seed = number | bigint | undefined;

/**
 * Hashes the input using the wyhash algorithm.
 *
 * It is an alternative to the `Bun.hash` function to be used in environments where `Bun` is not available.
 */
export function hash(input: Input = '', seed: Seed = 0) {
  if (typeof Bun !== 'undefined') return Bun.hash(input, seed);

  return wyhash(input, seed);
}

export function wyhash(input: Input = '', seed: Seed = 0): bigint | number {
  const { ptr, size } =
    typeof input === 'string' ? allocString(input, false) : allocBuffer(input);
  return BigInt.asUintN(64, exports.wyhash(ptr, size, BigInt(seed)));
}

// Source: https://github.com/oven-sh/bun/blob/4304368fc00e4c46066c506dc50f37eaccab4f15/packages/bun-polyfills/lib/zighash/index.mjs
const wasmBase64 =
  'AGFzbQEAAAABTwtgBH9/f38Bf2AFf39/f38AYAF/AX9gA39/fgF+YAN/f38AYAJ/fwF/YAJ+fgF+YAR/f35+AGADf39/AX9gBn9/f39/fwF/YAV/fn5+fgADFBMCAwQFBQUCAwYHCAgDAAIJAQoIBAUBcAEEBAUDAQARBgkBfwFBgIDAAAsHbgoGbWVtb3J5AgAFYWxsb2MAAAZ3eWhhc2gAAQdhZGxlcjMyAAMFY3JjMzIABApjaXR5aGFzaDMyAAUKY2l0eWhhc2g2NAAHCm11cm11cjMydjMACgptdXJtdXIzMnYyAAsKbXVybXVyNjR2MgAMCQkBAEEBCwMNDxAKtjITQQEBfgJAIAANAEF/DwsCQEEAKQOQgMCAACIBpyAAQQBBACABQiCIpygCABGAgICAAAAiAEUNACAADwsDfwAMAAsL/QUFAn8BfgF/AX4CfyOAgICAAEHwAGsiAySAgICAACADQeAAaiACQq/I9cXHrIe7oH+FQgBC29HQhZra34FnQgAQkYCAgAAgA0HoAGopAwAgAykDYIUgAoUhAgJAAkACQAJAAkAgAUEQSw0AIAFBA00NASAANQAAQiCGIAAgAUEBdkH8////B3EiBGo1AACEIQUgACABQXxqIgZqNQAAQiCGIAAgBiAEa2o1AACEIQcMBAtBACEEIAFBME8NAUEAIQYMAgtCACEHAkAgAQ0AQgAhBQwDCyAAIAFBAXZqMQAAQgiGIAAxAABCEIaEIAEgAGpBf2oxAACEIQUMAgtBACEGIAIhBSACIQcCQANAIAZBMGoiCCABTw0BIANBwABqIAAgBmoiBikACCAHhUIAIAYpAABC29HQhZra34FnhUIAEJGAgIAAIANBMGogBkEYaikAACAFhUIAIAZBEGopAABC442j5Inemt6Of4VCABCRgICAACADQSBqIAZBKGopAAAgAoVCACAGQSBqKQAAQsOZ3anHudnM2ACFQgAQkYCAgAAgA0HAAGpBCGopAwAgAykDQIUhByADQSBqQQhqKQMAIAMpAyCFIQIgA0EwakEIaikDACADKQMwhSEFIAghBgwACwsgBSAChSAHhSECCyAAIAZqIQkgASAGayEIAkADQCAEQRBqIgYgCE8NASADQdAAaiAJIARqIgRBCGopAAAgAoVCACAEKQAAQtvR0IWa2t+BZ4VCABCRgICAACADQdAAakEIaikDACADKQNQhSECIAYhBAwACwsgASAAaiIEQXhqKQAAIQcgBEFwaikAACEFCyADQRBqIAVC29HQhZra34FnhUIAIAcgAoVCABCRgICAACADIANBEGpBCGopAwBC29HQhZra34FnhUIAIAGtIAMpAxCFQq/I9cXHrIe7oH+FQgAQkYCAgABBkIDAgAAgACABEIKAgIAAIANBCGopAwAhAiADKQMAIQUgA0HwAGokgICAgAAgAiAFhQs4AQF/AkAgAkEAIAIbIgNFDQAgACgCACABQarVqtV6IAIbIANBAEEAIAAoAgQoAggRgYCAgAAACwujBgEGfwJAAkAgAUEBRw0AIAAtAABBAWoiAiEDDAELAkACQCABQRBJDQBBACEEIAAhBUEAIQJBASEDDAELQQAhBSABIQQgACEGQQEhAgJAA0AgBEUNASAEQX9qIQQgAiAGLQAAaiICIAVqIQUgBkEBaiEGDAALCyACQY+AfGogAiACQfD/A0sbIQMgBUHx/wNwIQIMAQsDQAJAAkAgBEGwK2oiByABSw0AQQAhBgNAIAZBsCtGDQIgAyAFIAZqIgQtAABqIgMgAmogAyAEQQFqLQAAaiICaiACIARBAmotAABqIgJqIAIgBEEDai0AAGoiAmogAiAEQQRqLQAAaiICaiACIARBBWotAABqIgJqIAIgBEEGai0AAGoiAmogAiAEQQdqLQAAaiICaiACIARBCGotAABqIgJqIAIgBEEJai0AAGoiAmogAiAEQQpqLQAAaiICaiACIARBC2otAABqIgJqIAIgBEEMai0AAGoiAmogAiAEQQ1qLQAAaiICaiACIARBDmotAABqIgJqIAIgBEEPai0AAGoiA2ohAiAGQRBqIQYMAAsLIAQgAU8NAgNAAkAgBEEQaiIGIAFNDQACQANAIAQgAU8NASADIAAgBGotAABqIgMgAmohAiAEQQFqIQQMAAsLIAJB8f8DcCECIANB8f8DcCEDDAQLIAMgACAEaiIELQAAaiIDIAJqIAMgBEEBai0AAGoiAmogAiAEQQJqLQAAaiICaiACIARBA2otAABqIgJqIAIgBEEEai0AAGoiAmogAiAEQQVqLQAAaiICaiACIARBBmotAABqIgJqIAIgBEEHai0AAGoiAmogAiAEQQhqLQAAaiICaiACIARBCWotAABq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';
const wasmBinary = Buffer.from(wasmBase64, 'base64');

const { instance } = await WebAssembly.instantiate(wasmBinary, {
  env: {
    print(x: any) {
      console.log(x);
    },
  },
});

const exports = (instance as any).exports;
const encoder = new TextEncoder();

function allocBuffer(
  buf: ArrayBufferView | ArrayBuffer | SharedArrayBuffer,
  nullTerminate = false,
) {
  const size = buf.byteLength + +nullTerminate;

  if (size === 0) return { ptr: -1, size: 0 };

  const ptr = exports.alloc(size);

  if (ptr === -1) throw new Error('WASM memory allocation failed');

  const u8heap = new Uint8Array((exports.memory as any).buffer);
  u8heap.set(new Uint8Array(ArrayBuffer.isView(buf) ? buf.buffer : buf), ptr);

  if (nullTerminate) u8heap[ptr + buf.byteLength] = 0;

  return { ptr, size };
}

function allocString(str: string, nullTerminate = true) {
  const strbuf = encoder.encode(str);
  return allocBuffer(strbuf, nullTerminate);
}
