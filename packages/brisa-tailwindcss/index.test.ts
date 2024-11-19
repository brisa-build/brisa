import { describe, expect, it, spyOn, mock } from 'bun:test';
import packageJSON from './package.json';
import brisaTailwindcss from '.';

const TAILWIND_VERSION = packageJSON.devDependencies.tailwindcss;

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
    const shellMock = mock();
    const mockLog = spyOn(console, 'log');

    function shellContent(strings: string[], dir: string, version: string) {
      const res =
        strings[0] + dir + strings[1] + version + strings[2] + version;
      shellMock(res);
      return { quiet: async () => {}, toString: () => res };
    }

    spyOn(Bun, '$').mockImplementation(shellContent as any);

    await integration.afterBuild({
      BUILD_DIR: import.meta.dirname,
      LOG_PREFIX: { INFO: 'INFO', WAIT: 'WAIT', TICK: 'TICK' },
    });

    expect(mockLog.mock.calls[0][0]).toBe('INFO');
    expect(mockLog.mock.calls[1]).toEqual([
      'WAIT',
      ' Embedding TailwindCSS in the build folder...',
    ]);
    expect(shellMock.mock.calls[0][0]).toBe(
      `cd ${import.meta.dirname} && bun i tailwindcss@${TAILWIND_VERSION} @tailwindcss/postcss@${TAILWIND_VERSION}`,
    );
    expect(mockLog.mock.calls[2][0]).toBe('INFO');
    expect(mockLog.mock.calls[2][1]).toBe('TICK');
    expect(mockLog.mock.calls[2][2]).toContain('TailwindCSS embedded in');
  });
});
