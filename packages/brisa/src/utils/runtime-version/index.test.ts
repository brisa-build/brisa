import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import runtimeVersion from '.';

describe('runtimeVersion', () => {
  beforeEach(() => {
    // @ts-ignore
    globalThis.Deno = {
      version: { deno: '1.0.0' },
    };
  });

  afterEach(() => {
    // @ts-ignore
    delete globalThis.Deno;
  });

  it('should return the correct runtime version', () => {
    expect(runtimeVersion('node')).toBe(`Node.js ${process.version}`);
    // @ts-ignore
    expect(runtimeVersion('deno')).toBe(`Deno ${Deno.version.deno}`);
    expect(runtimeVersion('bun')).toBe(`Bun.js ${Bun.version}`);
  });
});
