import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  spyOn,
  type Mock,
} from 'bun:test';
import path from 'node:path';
import getWebComponentsList, {
  formatWCSelector,
  getWebComponentListFromFilePaths,
} from '.';
import { getConstants } from '@/constants';
import { boldLog } from '@/utils/log/log-color';

const fixturesDir = path.join(import.meta.dir, '..', '..', '__fixtures__');
const reservedNamesDir = path.join(fixturesDir, 'reserved-names');
const { LOG_PREFIX } = getConstants();
let mockConsoleLog: Mock<typeof console.log>;

describe('utils', () => {
  beforeEach(() => {
    mockConsoleLog = spyOn(console, 'log');
  });
  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  describe('getWebComponentsList', () => {
    it('should return a list of web components', async () => {
      const result = await getWebComponentsList(fixturesDir);

      expect(result).toEqual({
        'custom-counter': path.join(
          fixturesDir,
          'web-components',
          'custom-counter.tsx',
        ),
        'custom-slot': path.join(
          fixturesDir,
          'web-components',
          'custom-slot.tsx',
        ),
        'native-some-example': path.join(
          fixturesDir,
          'web-components',
          '_native',
          'some-example.tsx',
        ),
        'web-component': path.join(
          fixturesDir,
          'web-components',
          'web-component.tsx',
        ),
        'with-context': path.join(
          fixturesDir,
          'web-components',
          'with-context.tsx',
        ),
        'with-link': path.join(fixturesDir, 'web-components', 'with-link.tsx'),
      });
    });

    it('should return a list of web components with integrations', async () => {
      const integrationsPath = path.join(
        fixturesDir,
        'web-components',
        '_integrations.tsx',
      );
      const result = await getWebComponentsList(fixturesDir, integrationsPath);

      expect(result).toEqual({
        'custom-counter': path.join(
          fixturesDir,
          'web-components',
          'custom-counter.tsx',
        ),
        'custom-slot': path.join(
          fixturesDir,
          'web-components',
          'custom-slot.tsx',
        ),
        'foo-component': path.join(fixturesDir, 'lib', 'foo.tsx'),
        'native-some-example': path.join(
          fixturesDir,
          'web-components',
          '_native',
          'some-example.tsx',
        ),
        'web-component': path.join(
          fixturesDir,
          'web-components',
          'web-component.tsx',
        ),
        'with-context': path.join(
          fixturesDir,
          'web-components',
          'with-context.tsx',
        ),
        'with-link': path.join(fixturesDir, 'web-components', 'with-link.tsx'),
      });
    });

    it('should return a list of web components without integrations because the integrationsPath does not have an export default', async () => {
      const integrationsPath = path.join(
        fixturesDir,
        'web-components',
        '_integrations2.tsx',
      );
      const result = await getWebComponentsList(fixturesDir, integrationsPath);

      expect(result).toEqual({
        'custom-counter': path.join(
          fixturesDir,
          'web-components',
          'custom-counter.tsx',
        ),
        'custom-slot': path.join(
          fixturesDir,
          'web-components',
          'custom-slot.tsx',
        ),
        'native-some-example': path.join(
          fixturesDir,
          'web-components',
          '_native',
          'some-example.tsx',
        ),
        'web-component': path.join(
          fixturesDir,
          'web-components',
          'web-component.tsx',
        ),
        'with-context': path.join(
          fixturesDir,
          'web-components',
          'with-context.tsx',
        ),
        'with-link': path.join(fixturesDir, 'web-components', 'with-link.tsx'),
      });
    });

    it('should return a list of web components with an integration of a direct import', async () => {
      const integrationsPath = path.join(
        fixturesDir,
        'web-components',
        '_integrations3.tsx',
      );
      const result = await getWebComponentsList(fixturesDir, integrationsPath);

      expect(result).toEqual({
        'custom-counter': path.join(
          fixturesDir,
          'web-components',
          'custom-counter.tsx',
        ),
        'custom-slot': path.join(
          fixturesDir,
          'web-components',
          'custom-slot.tsx',
        ),
        'emoji-picker':
          '{"client":"' +
          path.join(fixturesDir, 'lib', 'emoji-picker.tsx') +
          '"}',
        'native-some-example': path.join(
          fixturesDir,
          'web-components',
          '_native',
          'some-example.tsx',
        ),
        'web-component': path.join(
          fixturesDir,
          'web-components',
          'web-component.tsx',
        ),
        'with-context': path.join(
          fixturesDir,
          'web-components',
          'with-context.tsx',
        ),
        'with-link': path.join(fixturesDir, 'web-components', 'with-link.tsx'),
      });
    });

    it('should return a list of web components with an integration of multi direct imports', async () => {
      const integrationsPath = path.join(
        fixturesDir,
        'web-components',
        '_integrations4.tsx',
      );

      const result = await getWebComponentsList(fixturesDir, integrationsPath);

      expect(result).toEqual({
        'custom-counter': path.join(
          fixturesDir,
          'web-components',
          'custom-counter.tsx',
        ),
        'custom-slot': path.join(
          fixturesDir,
          'web-components',
          'custom-slot.tsx',
        ),
        'some-lib':
          '{"client":"' + path.join(fixturesDir, 'lib', 'some-lib.js') + '"}',
        'different-name':
          '{"client":"' + path.join(fixturesDir, 'lib', 'some-lib.js') + '"}',
        'different-name-string-path':
          '{"client":"' + path.join(fixturesDir, 'lib', 'some-lib.js') + '"}',
        'native-some-example': path.join(
          fixturesDir,
          'web-components',
          '_native',
          'some-example.tsx',
        ),
        'web-component': path.join(
          fixturesDir,
          'web-components',
          'web-component.tsx',
        ),
        'with-context': path.join(
          fixturesDir,
          'web-components',
          'with-context.tsx',
        ),
        'with-link': path.join(fixturesDir, 'web-components', 'with-link.tsx'),
      });
    });

    it('should log warning when a native library has different selector name', async () => {
      const integrationsPath = path.join(
        fixturesDir,
        'web-components',
        '_integrations4.tsx',
      );

      await getWebComponentsList(fixturesDir, integrationsPath);

      expect(mockConsoleLog.mock.calls.flat().join('\n')).toContain(
        'The selector "different-name" from _integrations file looks that is defined inside the library with a different selector name.',
      );
      expect(mockConsoleLog.mock.calls.flat().join('\n')).toContain(
        'The selector "different-name-string-path" from _integrations file looks that is defined inside the library with a different selector name.',
      );
    });

    it('should alert if there is a web component with the same name, taking one the first one', async () => {
      await getWebComponentsList(fixturesDir);

      expect(mockConsoleLog.mock.calls[0]).toEqual([
        LOG_PREFIX.ERROR,
        'Ops! Error:',
      ]);
      expect(mockConsoleLog.mock.calls[1]).toEqual([
        LOG_PREFIX.ERROR,
        '--------------------------',
      ]);
      expect(mockConsoleLog.mock.calls[2]).toEqual([
        LOG_PREFIX.ERROR,
        boldLog(
          'You have more than one web-component with the same name: "web-component"',
        ),
      ]);
      expect(mockConsoleLog.mock.calls[3]).toEqual([
        LOG_PREFIX.ERROR,
        'Please, rename one of them to avoid conflicts.',
      ]);
      expect(mockConsoleLog.mock.calls[4]).toEqual([
        LOG_PREFIX.ERROR,
        '--------------------------',
      ]);
    });

    it('should alert if there is a web component with the same name as a reserved name', async () => {
      await getWebComponentsList(reservedNamesDir);

      expect(mockConsoleLog.mock.calls[0]).toEqual([
        LOG_PREFIX.ERROR,
        'Ops! Error:',
      ]);
      expect(mockConsoleLog.mock.calls[1]).toEqual([
        LOG_PREFIX.ERROR,
        '--------------------------',
      ]);
      expect(mockConsoleLog.mock.calls[2]).toEqual([
        LOG_PREFIX.ERROR,
        boldLog(`You can't use the reserved name "context-provider"`),
      ]);
      expect(mockConsoleLog.mock.calls[3]).toEqual([
        LOG_PREFIX.ERROR,
        'Please, rename it to avoid conflicts.',
      ]);
      expect(mockConsoleLog.mock.calls[4]).toEqual([
        LOG_PREFIX.ERROR,
        '--------------------------',
      ]);
    });
  });

  describe('formatWCSelector', () => {
    it('should return a kebab-case string (Mac/Linux)', () => {
      const result = formatWCSelector('/custom-counter');
      expect(result).toEqual('custom-counter');
    });

    it('should return a kebab-case string (Windows)', () => {
      const result = formatWCSelector('\\custom-counter');
      expect(result).toEqual('custom-counter');
    });

    it('should return a kebab-case string with folder separators (Mac/Linux)', () => {
      const result = formatWCSelector('/custom/counter');
      expect(result).toEqual('custom-counter');
    });

    it('should return a kebab-case string with folder separators (Windows)', () => {
      const result = formatWCSelector('\\custom\\counter');
      expect(result).toEqual('custom-counter');
    });

    it('should return a kebab-case string with folder separators (Mac/Linux)', () => {
      const result = formatWCSelector('//custom//counter');
      expect(result).toEqual('custom-counter');
    });

    it('should return a kebab-case string with repeated folder separators (Windows)', () => {
      const result = formatWCSelector('\\\\custom\\\\counter');
      expect(result).toEqual('custom-counter');
    });

    it('should return a kebab-case string with mixing folder separators', () => {
      const result = formatWCSelector('\\\\//custom\\\\//counter');
      expect(result).toEqual('custom-counter');
    });
  });

  describe('getWebComponentListFromFilePaths', () => {
    it('should return a list of web components from file paths', () => {
      const filePaths = [
        path.join(fixturesDir, 'web-components', 'custom-counter.tsx'),
        path.join(fixturesDir, 'web-components', 'custom-slot.tsx'),
        path.join(fixturesDir, 'web-components', '_native', 'some-example.tsx'),
        path.join(fixturesDir, 'web-components', 'web', 'component.tsx'),
        path.join(fixturesDir, 'web-components', 'with-context.tsx'),
        path.join(fixturesDir, 'web-components', 'with-link.tsx'),
      ];
      const result = getWebComponentListFromFilePaths(filePaths);

      expect(result).toEqual({
        'custom-counter': path.join(
          fixturesDir,
          'web-components',
          'custom-counter.tsx',
        ),
        'custom-slot': path.join(
          fixturesDir,
          'web-components',
          'custom-slot.tsx',
        ),
        'native-some-example': path.join(
          fixturesDir,
          'web-components',
          '_native',
          'some-example.tsx',
        ),
        'web-component': path.join(
          fixturesDir,
          'web-components',
          'web',
          'component.tsx',
        ),
        'with-context': path.join(
          fixturesDir,
          'web-components',
          'with-context.tsx',
        ),
        'with-link': path.join(fixturesDir, 'web-components', 'with-link.tsx'),
      });
    });
    it('should take only the filename when is not inside the web-components folder', () => {
      const filePaths = [
        path.join(fixturesDir, 'custom-counter.tsx'),
        path.join(fixturesDir, 'custom-slot.tsx'),
        path.join(fixturesDir, '_native', 'some-example.tsx'),
        path.join(fixturesDir, 'web', 'component.tsx'),
        path.join(fixturesDir, 'with-context.tsx'),
        path.join(fixturesDir, 'with-link.tsx'),
      ];
      const result = getWebComponentListFromFilePaths(filePaths);

      expect(result).toEqual({
        'custom-counter': path.join(fixturesDir, 'custom-counter.tsx'),
        'custom-slot': path.join(fixturesDir, 'custom-slot.tsx'),
        'some-example': path.join(fixturesDir, '_native', 'some-example.tsx'),
        component: path.join(fixturesDir, 'web', 'component.tsx'),
        'with-context': path.join(fixturesDir, 'with-context.tsx'),
        'with-link': path.join(fixturesDir, 'with-link.tsx'),
      });
    });

    it('should alert if there is a web component with the same name, taking one the first one', () => {
      const filePaths = [
        path.join(fixturesDir, 'web-components', 'web-component.tsx'),
        path.join(fixturesDir, 'web-components', 'web-component.tsx'),
      ];
      getWebComponentListFromFilePaths(filePaths);

      expect(mockConsoleLog.mock.calls[0]).toEqual([
        LOG_PREFIX.ERROR,
        'Ops! Error:',
      ]);
      expect(mockConsoleLog.mock.calls[1]).toEqual([
        LOG_PREFIX.ERROR,
        '--------------------------',
      ]);
      expect(mockConsoleLog.mock.calls[2]).toEqual([
        LOG_PREFIX.ERROR,
        boldLog(
          'You have more than one web-component with the same name: "web-component"',
        ),
      ]);
      expect(mockConsoleLog.mock.calls[3]).toEqual([
        LOG_PREFIX.ERROR,
        'Please, rename one of them to avoid conflicts.',
      ]);
      expect(mockConsoleLog.mock.calls[4]).toEqual([
        LOG_PREFIX.ERROR,
        '--------------------------',
      ]);
    });

    it('should alert if there is a web component with the same name as a reserved name', () => {
      const filePaths = [path.join(reservedNamesDir, 'context-provider.tsx')];
      getWebComponentListFromFilePaths(filePaths);

      expect(mockConsoleLog.mock.calls[0]).toEqual([
        LOG_PREFIX.ERROR,
        'Ops! Error:',
      ]);
      expect(mockConsoleLog.mock.calls[1]).toEqual([
        LOG_PREFIX.ERROR,
        '--------------------------',
      ]);
      expect(mockConsoleLog.mock.calls[2]).toEqual([
        LOG_PREFIX.ERROR,
        boldLog(`You can't use the reserved name "context-provider"`),
      ]);
      expect(mockConsoleLog.mock.calls[3]).toEqual([
        LOG_PREFIX.ERROR,
        'Please, rename it to avoid conflicts.',
      ]);
      expect(mockConsoleLog.mock.calls[4]).toEqual([
        LOG_PREFIX.ERROR,
        '--------------------------',
      ]);
    });

    it('should alert a web component without the kebab-case', () => {
      const filePaths = [path.join(fixturesDir, 'web', 'component.tsx')];

      getWebComponentListFromFilePaths(filePaths);

      expect(mockConsoleLog.mock.calls[0]).toEqual([
        LOG_PREFIX.ERROR,
        'Ops! Error:',
      ]);

      expect(mockConsoleLog.mock.calls[1]).toEqual([
        LOG_PREFIX.ERROR,
        '--------------------------',
      ]);

      expect(mockConsoleLog.mock.calls[2]).toEqual([
        LOG_PREFIX.ERROR,
        boldLog('You have a web component without kebab-case: "component"'),
      ]);

      expect(mockConsoleLog.mock.calls[3]).toEqual([
        LOG_PREFIX.ERROR,
        'Please, rename it to avoid conflicts with the rest of HTML elements.',
      ]);

      expect(mockConsoleLog.mock.calls[4]).toEqual([
        LOG_PREFIX.ERROR,
        '--------------------------',
      ]);
    });
  });
});
