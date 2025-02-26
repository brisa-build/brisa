import { describe, expect, it, spyOn } from 'bun:test';
import fs from 'node:fs/promises';
import libs from './libs.json';
import brisaTailwindcss from '.';

describe('brisa-tailwindcss', () => {
  it('should return the correct name', () => {
    const integration = brisaTailwindcss();
    expect(integration.name).toBe('brisa-tailwindcss');
  });

  it('should return transpileCSS function', () => {
    const integration = brisaTailwindcss();
    expect(integration.transpileCSS).toBeInstanceOf(Function);
  });

  it('should return default CSS content', () => {
    const integration = brisaTailwindcss();
    expect(integration.defaultCSS.content).toContain(
      '@import "tailwindcss/theme" layer(theme);',
    );
    expect(integration.defaultCSS.content).toContain(
      '@import "tailwindcss/preflight" layer(base);',
    );
    expect(integration.defaultCSS.content).toContain(
      '@import "tailwindcss/utilities" layer(utilities);',
    );
  });

  it('should transpile CSS', async () => {
    const cssCode = `
        @import "tailwindcss/theme" layer(theme);
        @import "tailwindcss/preflight" layer(base);
        @import "tailwindcss/utilities" layer(utilities);

        :root {
          --color: red;
        }
      `;
    const integration = brisaTailwindcss();
    const transpiledCSS = await integration.transpileCSS(
      'out/index.css',
      cssCode,
    );
    expect(transpiledCSS).toContain('@layer base');
  });

  it('should add :host to all :root selectors', async () => {
    const cssCode = `
        @tailwind base; 
        @tailwind components; 
        @tailwind utilities;

        :root {
          --color: red;
        }
      `;
    const integration = brisaTailwindcss();
    const transpiledCSS = await integration.transpileCSS(
      'out/index.css',
      cssCode,
    );
    expect(transpiledCSS).toContain(':host');
  });

  it('should not import tailwindcss when @tailwind is not present', async () => {
    const cssCode = `
        body {
          color: red;
        }
      `;
    const integration = brisaTailwindcss();
    const transpiledCSS = await integration.transpileCSS(
      'out/index.css',
      cssCode,
    );

    expect(transpiledCSS).not.toContain('@layer base');
  });

  it('should call Bun.$ to install tailwindcss inside the build folder #637', async () => {
    const integration = brisaTailwindcss();
    const mockLog = spyOn(console, 'log');
    const mockCp = spyOn(fs, 'cp').mockResolvedValue();
    const mockExists = spyOn(fs, 'exists').mockResolvedValue(true);

    await integration.afterBuild({
      BUILD_DIR: import.meta.dirname,
      LOG_PREFIX: { INFO: 'INFO', WAIT: 'WAIT', TICK: 'TICK' },
    });

    expect(mockLog.mock.calls[0][0]).toBe('INFO');
    expect(mockLog.mock.calls[1]).toEqual([
      'WAIT',
      ' Embedding TailwindCSS in the build folder...',
    ]);
    expect(mockCp).toHaveBeenCalledTimes(libs.length);
    for (const lib of libs) {
      expect(mockCp).toHaveBeenCalledWith(
        expect.stringContaining(lib),
        expect.stringContaining(lib),
        { recursive: true },
      );
    }
    expect(mockLog.mock.calls[2][0]).toBe('INFO');
    expect(mockLog.mock.calls[2][1]).toBe('TICK');
    expect(mockLog.mock.calls[2][2]).toContain('TailwindCSS embedded in');
    mockLog.mockRestore();
    mockCp.mockRestore();
    mockExists.mockRestore();
  });

  it('should not embed tailwindcss when embedded is false', async () => {
    const integration = brisaTailwindcss({ embedded: false });
    const mockLog = spyOn(console, 'log');
    const mockCp = spyOn(fs, 'cp').mockResolvedValue();
    const mockExists = spyOn(fs, 'exists').mockResolvedValue(true);

    await integration.afterBuild({
      BUILD_DIR: import.meta.dirname,
      LOG_PREFIX: { INFO: 'INFO', WAIT: 'WAIT', TICK: 'TICK' },
    });

    expect(mockLog).not.toHaveBeenCalled();
    expect(mockCp).not.toHaveBeenCalled();
    expect(mockExists).not.toHaveBeenCalled();
    mockLog.mockRestore();
    mockCp.mockRestore();
    mockExists.mockRestore();
  });
});
