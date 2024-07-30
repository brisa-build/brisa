import {
  describe,
  it,
  expect,
  mock,
  beforeEach,
  afterEach,
  spyOn,
} from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import build from './build';
import { getConstants } from '@/constants';
import type { Configuration } from '@/types';

const defaultResult = {
  success: true,
  pagesSize: {
    '/pages/index.js': 100,
  },
} as const;

const resultWithdDynamicRoute = {
  success: true,
  pagesSize: {
    '/pages/index.js': 100,
    '/pages/user/[username].js': 0,
  },
} as const;

const mockCompileAll = mock(async () => defaultResult);
const mockTable = mock((v: any) => null);
const mockGenerateStaticExport = mock(async () => [
  new Map<string, string[]>(),
]);
const mockLog = mock((...logs: string[]) => {});
const green = (text: string) =>
  Bun.enableANSIColors ? `\x1b[32m${text}\x1b[0m` : text;

describe('cli', () => {
  describe('build', () => {
    beforeEach(() => {
      spyOn(process, 'exit').mockImplementation(() => null as never);
      spyOn(console, 'log').mockImplementation((...logs) => mockLog(...logs));
      mock.module('@/utils/compile-all', () => ({
        default: async () => (await mockCompileAll()) || defaultResult,
      }));
      mock.module('./build-utils', () => ({
        logTable: (v: any) => mockTable(v),
        generateStaticExport: async () =>
          (await mockGenerateStaticExport()) || [new Map<string, string[]>()],
      }));
    });

    afterEach(() => {
      mockCompileAll.mockRestore();
      mockGenerateStaticExport.mockRestore();
      mockTable.mockRestore();
      mockLog.mockRestore();
      mock.restore();
      globalThis.mockConstants = undefined;
    });

    it('should remove the build directory if it exists', async () => {
      spyOn(fs, 'existsSync').mockImplementationOnce((v) => true);
      spyOn(fs, 'rmSync').mockImplementationOnce((v) => null);

      await build();
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.rmSync).toHaveBeenCalled();
    });

    it('should NOT remove the build directory if does not exist', async () => {
      spyOn(fs, 'existsSync').mockImplementationOnce((v) => false);
      spyOn(fs, 'rmSync').mockImplementationOnce((v) => null);

      await build();
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.rmSync).not.toHaveBeenCalled();
    });

    it('should copy the prebuild directory to the build directory', async () => {
      const { ROOT_DIR, BUILD_DIR, LOG_PREFIX } = getConstants();
      const originPrebuildPath = path.join(ROOT_DIR, 'prebuild');
      const finalPrebuildPath = path.join(BUILD_DIR, 'prebuild');

      spyOn(fs, 'existsSync').mockImplementation((v) =>
        (v as string).includes('prebuild'),
      );
      spyOn(fs, 'cpSync').mockImplementationOnce(() => null);

      await build();
      const logs = mockLog.mock.calls.flat().join('');

      // It's important the order of logs, prebuild should be necessary
      // before the build because it needs to find the correct path
      // during the build
      expect(logs).toContain(
        `Copied prebuild folder inside build${LOG_PREFIX.INFO}${LOG_PREFIX.TICK}Compiled successfully!`,
      );
      expect(fs.existsSync).toHaveBeenCalledTimes(2);
      expect(fs.cpSync).toHaveBeenCalledWith(
        originPrebuildPath,
        finalPrebuildPath,
        {
          recursive: true,
        },
      );
    });

    it('should call compileAll if no "output" field is defined in the configuration', async () => {
      await build();
      expect(mockCompileAll).toHaveBeenCalled();
      expect(mockGenerateStaticExport).not.toHaveBeenCalled();
    });

    it('should not call generateStaticExport in development when is static export', async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        IS_PRODUCTION: false,
        IS_STATIC_EXPORT: true,
        CONFIG: {
          output: 'static',
        },
      };
      await build();
      expect(mockCompileAll).toHaveBeenCalled();
      expect(mockGenerateStaticExport).not.toHaveBeenCalled();
    });

    it('should call generateStaticExport in production when is static export', async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        IS_PRODUCTION: true,
        IS_STATIC_EXPORT: true,
        CONFIG: {
          output: 'static',
        },
      };
      await build();
      expect(mockCompileAll).toHaveBeenCalled();
      expect(mockGenerateStaticExport).toHaveBeenCalled();
    });

    it('should log the table with the generated static export pages', async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        IS_PRODUCTION: true,
        IS_STATIC_EXPORT: true,
        CONFIG: {
          output: 'static',
        },
      };

      await build();
      const logs = mockLog.mock.calls.flat().toString();
      expect(mockTable).toHaveBeenCalledWith([
        {
          'JS client (gz)': green('100 B'),
          Route: '○ /pages/index',
        },
      ]);
      expect(logs).toContain('Generated static pages successfully!');
      expect(logs).not.toContain('Ω (i18n) prerendered for each locale');
    });

    it('should log "Ω (i18n) prerendered for each locale" if i18n is enabled', async () => {
      const constants = getConstants() ?? {};

      globalThis.mockConstants = {
        ...constants,
        IS_PRODUCTION: true,
        IS_STATIC_EXPORT: true,
        CONFIG: {
          output: 'static',
        },
        I18N_CONFIG: {
          ...constants?.I18N_CONFIG,
          locales: ['en', 'pt'],
        },
      };

      await build();
      const logs = mockLog.mock.calls.flat().toString();
      expect(mockTable).toHaveBeenCalledWith([
        {
          'JS client (gz)': green('100 B'),
          Route: '○ /pages/index',
        },
      ]);
      expect(logs).toContain('Generated static pages successfully!');
      expect(logs).toContain('Ω  (i18n) prerendered for each locale');
    });

    it('should log prerendered dynamic routes with output="static"', async () => {
      mockCompileAll.mockImplementationOnce(
        async () => resultWithdDynamicRoute,
      );
      mockGenerateStaticExport.mockImplementationOnce(async () => {
        const map = new Map<string, string[]>();
        map.set('/pages/user/[username].js', [
          '/user/john.html',
          '/user/jane.html',
        ]);
        return [map];
      });

      const constants = getConstants() ?? {};

      globalThis.mockConstants = {
        ...constants,
        IS_PRODUCTION: true,
        IS_STATIC_EXPORT: true,
        CONFIG: {
          output: 'static',
        },
      };

      await build();
      const logs = mockLog.mock.calls.flat().toString();
      expect(mockTable.mock.calls.flat()[0]).toEqual([
        {
          'JS client (gz)': green('100 B'),
          Route: '○ /pages/index',
        },
        {
          'JS client (gz)': green('0 B'),
          Route: '○ /pages/user/[username]',
        },
        {
          'JS client (gz)': green('0 B'),
          Route: '| ○ /user/john',
        },
        {
          'JS client (gz)': green('0 B'),
          Route: '| ○ /user/jane',
        },
      ]);
      expect(logs).toContain('Generated static pages successfully!');
    });

    it('should call outputAdapter if defined in the configuration (PROD)', async () => {
      const mockAdapter = mock((v: any) => v);
      const config = {
        output: 'static',
        outputAdapter: {
          name: 'my-adapter',
          adapt: mockAdapter,
        },
      } as Configuration;

      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        IS_PRODUCTION: true,
        CONFIG: config,
      };

      await build();
      const logs = mockLog.mock.calls.flat().toString();
      expect(logs).toContain('Adapting output to my-adapter...');
      expect(mockAdapter).toHaveBeenCalledWith(config);
    });

    it('should NOT call outputAdapter if defined in the configuration in development', async () => {
      const mockAdapter = mock((v: any) => v);
      const config = {
        output: 'static',
        outputAdapter: {
          name: 'my-adapter',
          adapt: mockAdapter,
        },
      } as Configuration;

      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        IS_PRODUCTION: false,
        CONFIG: config,
      };

      await build();
      const logs = mockLog.mock.calls.flat().toString();
      expect(logs).not.toContain('Adapting output to my-adapter...');
      expect(mockAdapter).not.toHaveBeenCalled();
    });
  });
});
