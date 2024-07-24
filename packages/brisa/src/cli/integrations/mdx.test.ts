import { expect, describe, it, spyOn, beforeEach, afterEach, jest } from 'bun:test';
import path from 'node:path';
import fs from 'node:fs';
import integrateMDX from '@/cli/integrations/mdx';
import { getConstants } from '@/constants';
import { normalizeQuotes } from '@/helpers';

const constants = getConstants();
const ROOT_DIR = path.join(import.meta.dir, 'out');

describe('integrateMDX', () => {
  beforeEach(() => {
    fs.mkdirSync(ROOT_DIR);
    globalThis.mockConstants = {
      ...constants,
      ROOT_DIR,
    };
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
    jest.restoreAllMocks();
    fs.rmdirSync(ROOT_DIR, { recursive: true });
  });

  it('should create a default brisa.config.ts', () => {
    const fsWriteFileSync = spyOn(fs, 'writeFileSync');
    const fsExistsSync = spyOn(fs, 'existsSync').mockReturnValue(false);
    const consoleLog = spyOn(console, 'log');

    integrateMDX();

    expect(fsExistsSync).toHaveBeenCalledWith(path.join(ROOT_DIR, 'brisa.config.ts'));
    expect(fsWriteFileSync.mock.calls[0][0]).toContain('brisa.config.ts');
    expect(normalizeQuotes(fsWriteFileSync.mock.calls[0][1] as string)).toBe(
      normalizeQuotes(`import mdx from '@mdx-js/esbuild';
    import type { Configuration } from "brisa";
    import type { BunPlugin } from 'bun';
    
    const mdxPlugin = mdx({ jsxImportSource: "brisa" }) as unknown as BunPlugin;
    
    export default {
      extendPlugins: (brisaPlugins) => [mdxPlugin, ...brisaPlugins],
    } satisfies Configuration;
    `),
    );
    expect(consoleLog).not.toHaveBeenCalled();
  });

  it('should not create a default brisa.config.ts if it already exists', () => {
    const fsWriteFileSync = spyOn(fs, 'writeFileSync');
    const fsExistsSync = spyOn(fs, 'existsSync').mockReturnValue(true);
    const consoleLog = spyOn(console, 'log');

    integrateMDX();

    expect(fsExistsSync).toHaveBeenCalledWith(path.join(ROOT_DIR, 'brisa.config.ts'));
    expect(fsWriteFileSync).not.toHaveBeenCalled();
    expect(consoleLog).toHaveBeenCalledWith('TODO: Integrate MDX into existing brisa.config.ts');
  });
});
