import { describe, it, expect, mock, afterEach, spyOn } from 'bun:test';
import { logTable, logError, logBuildError } from './log-build';
import { getConstants } from '@/constants';
import extendRequestContext from '@/utils/extend-request-context';
import type { RequestContext } from '@/types';
import { getTransferedServerStoreToClient } from '@/utils/transfer-store-service';

describe('utils', () => {
  describe('logTable', () => {
    afterEach(() => {
      mock.restore();
    });

    it('should log a table', () => {
      const mockLog = mock((f, s) => (s ? `${f} ${s}` : f));

      spyOn(console, 'log').mockImplementation((f, s) => mockLog(f, s));

      const info = getConstants().LOG_PREFIX.INFO;
      const data = [
        { name: 'John', age: '23' },
        { name: 'Jane', age: '42' },
      ];

      const expected =
        `${info}\n` +
        [' name | age', ' -------------', ' John | 23 ', ' Jane | 42 ']
          .map((t) => info + t)
          .join('\n');

      logTable(data);

      const output = mockLog.mock.results.map((t) => t.value).join('\n');

      expect(output).toBe(expected);
    });
  });

  describe('logError', () => {
    it('should log an error', () => {
      const req = extendRequestContext({
        originalRequest: new Request('http://localhost'),
      });
      const mockLog = mock((f, s) => (s ? `${f} ${s}` : f));

      spyOn(console, 'log').mockImplementation((f, s) => mockLog(f, s));

      const messages = ['Error message 1', 'Error message 2'];
      const docTitle = 'Footer message';
      const docLink = 'https://example.com';
      const stack = 'Error stack';

      logError({ messages, docTitle, docLink, req, stack });

      const output = mockLog.mock.results.map((t) => t.value).join('\n');
      const store = getTransferedServerStoreToClient(req);

      expect(output).toContain('Error message 1');
      expect(output).toContain('Error message 2');
      expect(output).toContain('Footer message');
      expect(output).toContain('https://example.com');
      expect(output).toContain('Error stack');
      expect(store.get('__BRISA_ERRORS__')).toHaveLength(1);
      expect(store.get('__BRISA_ERRORS__')[0].title).toBe('Error message 1');
    });
  });

  describe('logBuildError', () => {
    it('should log a build error', () => {
      const mockLog = mock((f, s) => (s ? `${f} ${s}` : f));

      spyOn(console, 'log').mockImplementation((f, s) => mockLog(f, s));

      const logs = [{ message: 'Error message 1' }, { message: 'Error message 2' }];

      logBuildError('Failed to compile', logs as (BuildMessage | ResolveMessage)[]);

      const output = mockLog.mock.results.map((t) => t.value).join('\n');

      expect(output).toContain('Failed to compile');
      expect(output).toContain('Error message 1');
      expect(output).toContain('Error message 2');
    });

    it('should improve the JSX runtime error with a better message', () => {
      const mockLog = mock((f, s) => (s ? `${f} ${s}` : f));

      spyOn(console, 'log').mockImplementation((f, s) => mockLog(f, s));

      const logs = [{ message: 'Could not resolve: "react/jsx-dev-runtime".' }];

      logBuildError('Failed to compile', logs as (BuildMessage | ResolveMessage)[]);

      const output = mockLog.mock.results.map((t) => t.value).join('\n');

      expect(output).toContain('Failed to compile');
      expect(output).toContain('Could not resolve: "react/jsx-dev-runtime".');
      expect(output).toContain(
        "Verify inside tsconfig.json the 'jsx' option set to 'react-jsx' and the 'jsxImportSource' option set to 'brisa'",
      );
    });

    it('should notify the level, message, name, and position of the error', () => {
      const mockLog = mock((f, s) => (s ? `${f} ${s}` : f));

      spyOn(console, 'log').mockImplementation((f, s) => mockLog(f, s));

      const logs = [
        {
          level: 'error',
          message: 'Error message 1',
          name: 'Error name 1',
          position: {
            line: 1,
            column: 2,
          },
        },
        {
          level: 'error',
          message: 'Error message 2',
          name: 'Error name 2',
          position: {
            line: 3,
            column: 4,
          },
        },
      ];

      logBuildError('Failed to compile', logs as (BuildMessage | ResolveMessage)[]);

      const output = mockLog.mock.results.map((t) => t.value).join('\n');

      expect(output).toContain('Failed to compile');
      expect(output).toContain('Error message 1');
      expect(output).toContain('Error name 1');
      expect(output).toContain('line');
      expect(output).toContain('1');
      expect(output).toContain('column');
      expect(output).toContain('2');
      expect(output).toContain('Error message 2');
      expect(output).toContain('Error name 2');
      expect(output).toContain('line');
      expect(output).toContain('3');
      expect(output).toContain('column');
      expect(output).toContain('4');
    });

    it('should display a specific MDX error when a file with .mdx format has an error', () => {
      const mockLog = mock((f, s) => (s ? `${f} ${s}` : f));

      spyOn(console, 'log').mockImplementation((f, s) => mockLog(f, s));

      const logs = [
        {
          level: 'error',
          message: 'mdx',
          name: 'Error name 1',
          position: {
            line: 1,
            column: 2,
          },
        },
      ];

      logBuildError('Failed to compile', logs as (BuildMessage | ResolveMessage)[]);

      const output = mockLog.mock.results.map((t) => t.value).join('\n');

      expect(output).toContain('Failed to compile');
      expect(output).toContain('Integrate MDX with the following command:');
      expect(output).toContain('> bunx brisa add mdx');
    });
  });
});
