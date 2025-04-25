import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  jest,
} from 'bun:test';
import path from 'node:path';
import extendRequestContext from '@/utils/extend-request-context';
import responseAction from '.';
import { getConstants } from '@/constants';
import { boldLog } from '@/utils/log/log-color';
import { normalizeHTML } from '@/helpers';
import transferStoreService from '@/utils/transfer-store-service';
import * as actions from '../../__fixtures__/actions';

const FIXTURES = path.join(import.meta.dir, '..', '..', '__fixtures__');
const PAGE = 'http://locahost/es/somepage';
let logMock: ReturnType<typeof spyOn>;

describe('utils', () => {
  beforeEach(() => {
    logMock = spyOn(console, 'log');
    globalThis.mockConstants = {
      ...getConstants(),
      BUILD_DIR: FIXTURES,
      MODULES: {
        actions,
      } as any,
    };
  });
  afterEach(() => {
    logMock.mockRestore();
    globalThis.mockConstants = undefined;
  });
  describe('response-action', () => {
    it('should add the correct param', async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a1_1',
          },
          body: JSON.stringify({
            args: [
              {
                foo: 'bar',
              },
            ],
          }),
        }),
      });
      const reqContent = await transferStoreService(req);

      const res = await responseAction(req, reqContent);
      const resBody = await res.json();

      expect(resBody).toEqual([]);
      expect(req.store.get('__params:a1_1')).toEqual([{ foo: 'bar' }]);
    });

    it('should add the correct param when using form-data', async () => {
      const formData = new FormData();
      formData.append('foo', 'bar');

      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'multipart/form-data',
            'x-action': 'a1_1',
          },
          body: formData,
        }),
      });

      req.formData = async () => formData;
      const reqContent = await transferStoreService(req);

      const res = await responseAction(req, reqContent);

      expect(req.store.get('__params:a1_1')).toEqual([
        {
          isTrusted: true,
          bubbles: false,
          cancelBubble: false,
          cancelable: false,
          composed: false,
          currentTarget: {
            action: 'http://locahost/es/somepage',
            autocomplete: 'on',
            enctype: 'multipart/form-data',
            encoding: 'multipart/form-data',
            method: 'post',
            elements: {},
            reset: expect.any(Function),
          },
          defaultPrevented: true,
          eventPhase: 0,
          formData,
          returnValue: true,
          srcElement: null,
          target: {
            action: 'http://locahost/es/somepage',
            autocomplete: 'on',
            enctype: 'multipart/form-data',
            encoding: 'multipart/form-data',
            method: 'post',
            elements: {},
            reset: expect.any(Function),
          },
          timeStamp: 0,
          type: 'formdata',
        },
      ]);
      expect(res.headers.get('x-reset')).toBeEmpty();
    });

    it('should add the "x-reset" header when using e.target.reset() in form-data', async () => {
      const formData = new FormData();
      formData.append('foo', 'bar');

      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'multipart/form-data',
            'x-action': 'a1_3', // a1_3 simulates a form reset
          },
          body: formData,
        }),
      });

      req.formData = async () => formData;
      const reqContent = await transferStoreService(req);
      const res = await responseAction(req, reqContent);

      expect(res.headers.get('x-reset')).toBe('1');
    });

    it('should form-data work with ?_aid instead of x-action to work without JS', async () => {
      const formData = new FormData();
      formData.append('foo', 'bar');

      const req = extendRequestContext({
        originalRequest: new Request(PAGE + '?_aid=a1_1', {
          method: 'POST',
          headers: {
            'content-type': 'multipart/form-data',
          },
          body: formData,
        }),
      });

      req.formData = async () => formData;

      const reqContent = await transferStoreService(req);
      const res = await responseAction(req, reqContent);

      expect(req.store.get('__params:a1_1')).toEqual([
        {
          isTrusted: true,
          bubbles: false,
          cancelBubble: false,
          cancelable: false,
          composed: false,
          currentTarget: {
            action: 'http://locahost/es/somepage?_aid=a1_1',
            autocomplete: 'on',
            enctype: 'multipart/form-data',
            encoding: 'multipart/form-data',
            method: 'post',
            elements: {},
            reset: expect.any(Function),
          },
          defaultPrevented: true,
          eventPhase: 0,
          formData,
          returnValue: true,
          srcElement: null,
          target: {
            action: 'http://locahost/es/somepage?_aid=a1_1',
            autocomplete: 'on',
            enctype: 'multipart/form-data',
            encoding: 'multipart/form-data',
            method: 'post',
            elements: {},
            reset: expect.any(Function),
          },
          timeStamp: 0,
          type: 'formdata',
        },
      ]);
      expect(res.headers.get('x-reset')).toBeEmpty();
    });

    it('should add the correct param when using web component event', async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a1_1',
          },
          body: JSON.stringify({
            args: [
              {
                isTrusted: true,
                bubbles: false,
                cancelBubble: false,
                cancelable: false,
                composed: false,
                currentTarget: null,
                defaultPrevented: true,
                eventPhase: 0,
                _wc: true,
                detail: [
                  {
                    foo: 'bar',
                  },
                  'bar',
                ],
              },
            ],
          }),
        }),
      });

      const reqContent = await transferStoreService(req);
      await responseAction(req, reqContent);

      expect(req.store.get('__params:a1_1')).toEqual([{ foo: 'bar' }, 'bar']);
    });

    it('should return as props the action dependencies', async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a1_1',
            'x-actions': JSON.stringify([[['onClick', 'a1_2']]]),
          },
          body: JSON.stringify({
            args: [
              {
                foo: 'bar',
              },
            ],
          }),
        }),
      });

      const reqContent = await transferStoreService(req);
      const res = await responseAction(req, reqContent);
      const resBody = await res.json();

      expect(resBody).toEqual([]);
      expect(req.store.get('__params:a1_1')).toEqual([{ foo: 'bar' }]);
      expect(logMock).toHaveBeenCalledWith('a1_1', {
        onClick: expect.any(Function),
      });
      expect(await logMock.mock.calls[0][1].onClick()).toBe('a1_2');
    });

    it('should return as props the action dependencies from another file', async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a1_1',
            'x-actions': JSON.stringify([[['onClick', 'a2_1']]]),
          },
          body: JSON.stringify({
            args: [
              {
                foo: 'bar',
              },
            ],
          }),
        }),
      });

      const reqContent = await transferStoreService(req);
      const res = await responseAction(req, reqContent);
      const resBody = await res.json();

      expect(resBody).toEqual([]);
      expect(req.store.get('__params:a1_1')).toEqual([{ foo: 'bar' }]);
      expect(logMock).toHaveBeenCalledWith('a1_1', {
        onClick: expect.any(Function),
      });
      expect(await logMock.mock.calls[0][1].onClick()).toBe('a2_1');
    });

    it('should work with nested action dependencies', async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a1_1',
            'x-actions': JSON.stringify([
              [['onClick', 'a2_1']],
              [['onAction', 'a2_2']],
            ]),
          },
          body: JSON.stringify({
            args: [
              {
                foo: 'bar',
              },
            ],
          }),
        }),
      });

      const reqContent = await transferStoreService(req);
      const res = await responseAction(req, reqContent);
      const resBody = await res.json();

      expect(resBody).toEqual([]);
      expect(req.store.get('__params:a1_1')).toEqual([{ foo: 'bar' }]);
      expect(logMock).toHaveBeenCalledWith('a1_1', {
        onClick: expect.any(Function),
      });
      // "foo" is added by a2_2 fixture
      expect(await logMock.mock.calls[0][1].onClick()).toBe('a2_1-a2_2-foo');
    });

    it('should add req._p wrapper function to handle async calls inside actions', async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a1_1',
          },
          body: JSON.stringify({
            args: [],
          }),
        }),
      });

      const reqContent = await transferStoreService(req);
      await responseAction(req, reqContent);

      // @ts-ignore
      expect(req._p).toBeTypeOf('function');
    });

    it('should req._waitActionCallPromises work for nested actions calls', async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a3_1',
            'x-actions': JSON.stringify([
              [['onAction2', 'a3_2']],
              [['onAction3', 'a3_3']],
            ]),
          },
          body: JSON.stringify({
            args: [],
          }),
        }),
      });

      const reqContent = await transferStoreService(req);
      await responseAction(req, reqContent);

      const logs = logMock.mock.calls.toString();

      expect(logs).toBe(
        normalizeHTML(`
          a3_1 before calling nested action,
            a3_2 before calling nested action,
              processing a3_3,
            a3_2 after calling nested action,
          a3_1 after calling nested action
        `),
      );
    });

    it('should req._waitActionCallPromises work for nested actions calls with await', async () => {
      const withAwait = true;
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a3_1',
            'x-actions': JSON.stringify([
              [['onAction2', 'a3_2']],
              [['onAction3', 'a3_3']],
            ]),
          },
          body: JSON.stringify({
            args: [withAwait],
          }),
        }),
      });

      const reqContent = await transferStoreService(req);
      await responseAction(req, reqContent);

      const logs = logMock.mock.calls.toString();

      expect(logs).toBe(
        normalizeHTML(`
          a3_1 before calling nested action,
            a3_2 before calling nested action,
              processing a3_3,
            a3_2 after calling nested action,
          a3_1 after calling nested action
        `),
      );
    });

    it('should return the response of the second action when the second one returns a Response', async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a3_4',
            'x-actions': JSON.stringify([[['onAction5', 'a3_5']]]),
          },
          body: JSON.stringify({
            args: [],
          }),
        }),
      });

      const reqContent = await transferStoreService(req);
      const res = await responseAction(req, reqContent);

      expect(await res.text()).toBe('a3_5');
    });

    it('should return the response of the second action with await call when the second one returns a Response', async () => {
      const withAwait = true;
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a3_4',
            'x-actions': JSON.stringify([[['onAction5', 'a3_5']]]),
          },
          body: JSON.stringify({
            args: [withAwait],
          }),
        }),
      });

      const reqContent = await transferStoreService(req);
      const res = await responseAction(req, reqContent);

      expect(await res.text()).toBe('a3_5');
    });

    it('should be possible to return an error from the nested action and be caught by the parent action', async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a3_6',
            'x-actions': JSON.stringify([[['onAction7', 'a3_7']]]),
          },
          body: JSON.stringify({
            args: [],
          }),
        }),
      });

      const reqContent = await transferStoreService(req);
      const res = await responseAction(req, reqContent);
      const resBody = await res.text();

      expect(resBody).toBe('a3_7 error');
    });

    it('should be possible to return an error from the nested action with await call and be caught by the parent action', async () => {
      const withAwait = true;
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a3_6',
            'x-actions': JSON.stringify([[['onAction7', 'a3_7']]]),
          },
          body: JSON.stringify({
            args: [withAwait],
          }),
        }),
      });

      const reqContent = await transferStoreService(req);
      const res = await responseAction(req, reqContent);
      const resBody = await res.text();

      expect(resBody).toBe('a3_7 error');
    });

    it('should transfer headers from page SYNC responseHeaders from /somepage', async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a1_1',
          },
          body: JSON.stringify({ args: [] }),
        }),
        route: {
          // Good to know: the pages/somepage.tsx fixture adds
          // "x-test" header via responseHeaders
          filePath: path.join(FIXTURES, 'pages', '/somepage.tsx'),
        } as any,
      });

      const reqContent = await transferStoreService(req);
      const res = await responseAction(req, reqContent);

      expect(res.headers.get('x-test')).toBe('test');
    });

    it('should transfer headers from page ASYNC responseHeaders from home', async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a1_1',
          },
          body: JSON.stringify({ args: [] }),
        }),
        route: {
          // Good to know: the pages/somepage.tsx fixture adds
          // "x-test" header via responseHeaders
          filePath: path.join(FIXTURES, 'pages', '/index.tsx'),
        } as any,
      });

      const reqContent = await transferStoreService(req);
      const res = await responseAction(req, reqContent);

      expect(res.headers.get('x-test')).toBe('success');
    });

    it('should log an error if the action does not exist and return a 404 response', async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a1_non-existing-action',
          },
          body: JSON.stringify({ args: [] }),
        }),
      });

      const reqContent = await transferStoreService(req);
      const res = await responseAction(req, reqContent);
      const logMessage = logMock.mock.calls.toString();

      expect(logMock).toHaveBeenCalled();
      expect(logMessage).toContain(
        'The action a1_non-existing-action was not found',
      );
      expect(logMessage).toContain(
        "Don't worry, it's not your fault. Probably a bug in Brisa.",
      );

      expect(res.status).toBe(404);
      expect(res.headers.get('content-type')).toBe('application/json');
    });

    it('should register the dependencies into dependencies store correctly', async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-action': 'a1_1',
            'x-actions': JSON.stringify([[['onClick', 'a1_2']]]),
          },
          body: JSON.stringify({
            args: [],
          }),
        }),
      });

      const reqContent = await transferStoreService(req);
      await responseAction(req, reqContent);

      expect(req.store.get(Symbol.for('DEPENDENCIES'))).toEqual([
        [['onClick', 'a1_2']],
      ]);
    });
  });
});
