import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  jest,
} from "bun:test";
import path from "node:path";
import extendRequestContext from "@/utils/extend-request-context";
import responseAction from ".";
import { getConstants } from "@/constants";
import { ENCRYPT_NONTEXT_PREFIX, encrypt } from "@/utils/crypto";
import { boldLog } from "@/utils/log/log-color";
import { normalizeQuotes } from "@/helpers";

const FIXTURES = path.join(import.meta.dir, "..", "..", "__fixtures__");
const PAGE = "http://locahost/es/somepage";
let logMock: ReturnType<typeof spyOn>;

describe("utils", () => {
  beforeEach(() => {
    logMock = spyOn(console, "log");
    globalThis.mockConstants = {
      ...getConstants(),
      BUILD_DIR: FIXTURES,
    };
  });
  afterEach(() => {
    logMock.mockRestore();
    globalThis.mockConstants = undefined;
  });
  describe("response-action", () => {
    it("should add the correct param", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
          },
          body: JSON.stringify({
            args: [
              {
                foo: "bar",
              },
            ],
          }),
        }),
      });

      const res = await responseAction(req);
      const resBody = await res.json();

      expect(resBody).toEqual([]);
      expect(req.store.get("__params:a1_1")).toEqual([{ foo: "bar" }]);
    });

    it('should be possible to access to store variables from "x-s" store body', async () => {
      const xs = [["foo", "bar"]];
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
          },
          body: JSON.stringify({
            "x-s": xs,
            args: [
              {
                foo: "bar",
              },
            ],
          }),
        }),
      });

      const res = await responseAction(req);
      const resBody = await res.json();

      expect(req.store.get("foo")).toBe("bar");
      expect(resBody).toEqual(xs);
    });

    it('should remove the field "x-s" from form-data (Brisa internal field)', async () => {
      const formData = new FormData();
      formData.append("foo", "bar");
      formData.append("x-s", '[["foo", "bar"]]');

      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "multipart/form-data",
            "x-action": "a1_1",
          },
          body: formData,
        }),
      });

      req.formData = async () => formData;

      await responseAction(req);

      expect(formData.get("x-s")).toBeNull();
      expect(req.store.get("foo")).toBe("bar");
    });

    it("should add the correct param when using form-data", async () => {
      const formData = new FormData();
      formData.append("foo", "bar");

      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "multipart/form-data",
            "x-action": "a1_1",
          },
          body: formData,
        }),
      });

      req.formData = async () => formData;

      const res = await responseAction(req);

      expect(req.store.get("__params:a1_1")).toEqual([
        {
          isTrusted: true,
          bubbles: false,
          cancelBubble: false,
          cancelable: false,
          composed: false,
          currentTarget: {
            action: "http://locahost/es/somepage",
            autocomplete: "on",
            enctype: "multipart/form-data",
            encoding: "multipart/form-data",
            method: "post",
            elements: {},
            reset: expect.any(Function),
          },
          defaultPrevented: true,
          eventPhase: 0,
          formData,
          returnValue: true,
          srcElement: null,
          target: {
            action: "http://locahost/es/somepage",
            autocomplete: "on",
            enctype: "multipart/form-data",
            encoding: "multipart/form-data",
            method: "post",
            elements: {},
            reset: expect.any(Function),
          },
          timeStamp: 0,
          type: "formdata",
        },
      ]);
      expect(res.headers.get("x-reset")).toBeEmpty();
    });

    it('should add the "x-reset" header when using e.target.reset() in form-data', async () => {
      const formData = new FormData();
      formData.append("foo", "bar");

      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "multipart/form-data",
            "x-action": "a1_3", // a1_3 simulates a form reset
          },
          body: formData,
        }),
      });

      req.formData = async () => formData;

      const res = await responseAction(req);

      expect(res.headers.get("x-reset")).toBe("1");
    });

    it('should form-data work with "x-s" store appended to the form-data"', async () => {
      const formData = new FormData();
      formData.append("foo", "bar");
      formData.append("x-s", JSON.stringify([["foo", "bar"]]));

      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "multipart/form-data",
            "x-action": "a1_1",
          },
          body: formData,
        }),
      });

      req.formData = async () => formData;

      const res = await responseAction(req);

      expect(req.store.get("foo")).toBe("bar");
      expect(res.headers.get("x-reset")).toBeEmpty();
    });

    it("should form-data work with ?_aid instead of x-action to work without JS", async () => {
      const formData = new FormData();
      formData.append("foo", "bar");

      const req = extendRequestContext({
        originalRequest: new Request(PAGE + "?_aid=a1_1", {
          method: "POST",
          headers: {
            "content-type": "multipart/form-data",
          },
          body: formData,
        }),
      });

      req.formData = async () => formData;

      const res = await responseAction(req);

      expect(req.store.get("__params:a1_1")).toEqual([
        {
          isTrusted: true,
          bubbles: false,
          cancelBubble: false,
          cancelable: false,
          composed: false,
          currentTarget: {
            action: "http://locahost/es/somepage?_aid=a1_1",
            autocomplete: "on",
            enctype: "multipart/form-data",
            encoding: "multipart/form-data",
            method: "post",
            elements: {},
            reset: expect.any(Function),
          },
          defaultPrevented: true,
          eventPhase: 0,
          formData,
          returnValue: true,
          srcElement: null,
          target: {
            action: "http://locahost/es/somepage?_aid=a1_1",
            autocomplete: "on",
            enctype: "multipart/form-data",
            encoding: "multipart/form-data",
            method: "post",
            elements: {},
            reset: expect.any(Function),
          },
          timeStamp: 0,
          type: "formdata",
        },
      ]);
      expect(res.headers.get("x-reset")).toBeEmpty();
    });

    it("should add the correct param when using web component event", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
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
                    foo: "bar",
                  },
                  "bar",
                ],
              },
            ],
          }),
        }),
      });

      await responseAction(req);

      expect(req.store.get("__params:a1_1")).toEqual([{ foo: "bar" }, "bar"]);
    });

    it("should return as props the action dependencies", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
            "x-actions": "[[['onClick', 'a1_2']]]",
          },
          body: JSON.stringify({
            args: [
              {
                foo: "bar",
              },
            ],
          }),
        }),
      });

      const res = await responseAction(req);
      const resBody = await res.json();

      expect(resBody).toEqual([]);
      expect(req.store.get("__params:a1_1")).toEqual([{ foo: "bar" }]);
      expect(logMock).toHaveBeenCalledWith("a1_1", {
        onClick: expect.any(Function),
      });
      expect(await logMock.mock.calls[0][1].onClick()).toBe("a1_2");
    });

    it("should return as props the action dependencies from another file", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
            "x-actions": "[[['onClick', 'a2_1']]]",
          },
          body: JSON.stringify({
            args: [
              {
                foo: "bar",
              },
            ],
          }),
        }),
      });

      const res = await responseAction(req);
      const resBody = await res.json();

      expect(resBody).toEqual([]);
      expect(req.store.get("__params:a1_1")).toEqual([{ foo: "bar" }]);
      expect(logMock).toHaveBeenCalledWith("a1_1", {
        onClick: expect.any(Function),
      });
      expect(await logMock.mock.calls[0][1].onClick()).toBe("a2_1");
    });

    it("should work with nested action dependencies", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
            "x-actions": "[[['onClick', 'a2_1']], [['onAction', 'a2_2']]]",
          },
          body: JSON.stringify({
            args: [
              {
                foo: "bar",
              },
            ],
          }),
        }),
      });

      const res = await responseAction(req);
      const resBody = await res.json();

      expect(resBody).toEqual([]);
      expect(req.store.get("__params:a1_1")).toEqual([{ foo: "bar" }]);
      expect(logMock).toHaveBeenCalledWith("a1_1", {
        onClick: expect.any(Function),
      });
      // "foo" is added by a2_2 fixture
      expect(await logMock.mock.calls[0][1].onClick()).toBe("a2_1-a2_2-foo");
    });

    it("should add req._p wrapper function to handle async calls inside actions", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
          },
          body: JSON.stringify({
            args: [],
          }),
        }),
      });

      await responseAction(req);

      // @ts-ignore
      expect(req._p).toBeTypeOf("function");
    });

    it("should req._waitActionCallPromises work for nested actions calls", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a3_1",
            "x-actions": "[[['onAction2', 'a3_2']], [['onAction3', 'a3_3']]]",
          },
          body: JSON.stringify({
            args: [],
          }),
        }),
      });

      await responseAction(req);

      const logs = logMock.mock.calls.toString();

      expect(logs).toBe(
        normalizeQuotes(`
          a3_1 before calling nested action,
            a3_2 before calling nested action,
              processing a3_3,
            a3_2 after calling nested action,
          a3_1 after calling nested action
        `),
      );
    });

    it("should req._waitActionCallPromises work for nested actions calls with await", async () => {
      const withAwait = true;
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a3_1",
            "x-actions": "[[['onAction2', 'a3_2']], [['onAction3', 'a3_3']]]",
          },
          body: JSON.stringify({
            args: [withAwait],
          }),
        }),
      });

      await responseAction(req);

      const logs = logMock.mock.calls.toString();

      expect(logs).toBe(
        normalizeQuotes(`
          a3_1 before calling nested action,
            a3_2 before calling nested action,
              processing a3_3,
            a3_2 after calling nested action,
          a3_1 after calling nested action
        `),
      );
    });

    it("should req._originalActionId be accessible inside actions", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a3_4",
            "x-actions": "[[['onAction5', 'a3_5']]]",
          },
          body: JSON.stringify({
            args: [],
          }),
        }),
      });

      await responseAction(req);

      const logs = logMock.mock.calls.toString();

      expect(logs).toBe(
        "a3_4 is original action?,true,a3_5 is original action?,false",
      );
    });

    it("should return the response of the second action when the second one returns a Response", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a3_4",
            "x-actions": "[[['onAction5', 'a3_5']]]",
          },
          body: JSON.stringify({
            args: [],
          }),
        }),
      });

      const res = await responseAction(req);

      expect(await res.text()).toBe("a3_5");
    });

    it("should return the response of the second action with await call when the second one returns a Response", async () => {
      const withAwait = true;
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a3_4",
            "x-actions": "[[['onAction5', 'a3_5']]]",
          },
          body: JSON.stringify({
            args: [withAwait],
          }),
        }),
      });

      const res = await responseAction(req);

      expect(await res.text()).toBe("a3_5");
    });

    it("should be possible to return an error from the nested action and be caught by the parent action", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a3_6",
            "x-actions": "[[['onAction7', 'a3_7']]]",
          },
          body: JSON.stringify({
            args: [],
          }),
        }),
      });

      const res = await responseAction(req);
      const resBody = await res.text();

      expect(resBody).toBe("a3_7 error");
    });

    it("should be possible to return an error from the nested action with await call and be caught by the parent action", async () => {
      const withAwait = true;
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a3_6",
            "x-actions": "[[['onAction7', 'a3_7']]]",
          },
          body: JSON.stringify({
            args: [withAwait],
          }),
        }),
      });

      const res = await responseAction(req);
      const resBody = await res.text();

      expect(resBody).toBe("a3_7 error");
    });

    it('should decrypt the store variables from "x-s" store that starts with ENCRYPT_PREFIX', async () => {
      const xs = [["sensitive-data", encrypt("foo")]];
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
          },
          body: JSON.stringify({
            "x-s": xs,
            args: [
              {
                foo: "bar",
              },
            ],
          }),
        }),
      });

      const res = await responseAction(req);
      const resBody = await res.json();

      expect(req.store.get("sensitive-data")).toBe("foo");
      expect(resBody).toEqual(xs);
    });

    it('should decrypt the store variables from "x-s" body that starts with ENCRYPT_NONTEXT_PREFIX', async () => {
      const xs = [["sensitive-data", encrypt({ foo: "bar" })]];
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
          },
          body: JSON.stringify({
            "x-s": xs,
            args: [],
          }),
        }),
      });

      const res = await responseAction(req);
      const resBody = await res.json();

      expect(req.store.get("sensitive-data")).toEqual({ foo: "bar" });
      expect(resBody).toEqual(xs);
    });

    it("should emojis work inside store", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
          },
          body: JSON.stringify({
            "x-s": [["sensitive-data", "👍"]],
            args: [],
          }),
        }),
      });

      const res = await responseAction(req);
      const resBody = await res.json();

      expect(req.store.get("sensitive-data")).toBe("👍");
      expect(resBody).toEqual([["sensitive-data", "👍"]]);
    });

    it('should log an error if the decryption fails from "x-s" store body', async () => {
      const xs = [
        ["sensitive-data", ENCRYPT_NONTEXT_PREFIX + "invalid-encrypted-data"],
      ];
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
          },
          body: JSON.stringify({
            "x-s": xs,
            args: [
              {
                foo: "bar",
              },
            ],
          }),
        }),
      });

      const res = await responseAction(req);
      const resBody = await res.json();
      const { LOG_PREFIX } = getConstants();

      expect(logMock).toHaveBeenCalledTimes(7);
      expect(logMock.mock.calls[0]).toEqual([LOG_PREFIX.ERROR, "Ops! Error:"]);
      expect(logMock.mock.calls[1]).toEqual([
        LOG_PREFIX.ERROR,
        "--------------------------",
      ]);
      expect(logMock.mock.calls[2]).toEqual([
        LOG_PREFIX.ERROR,
        boldLog(
          'Error transferring client "sensitive-data" store to server store',
        ),
      ]);
      expect(logMock.mock.calls[3]).toEqual([
        LOG_PREFIX.ERROR,
        "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object.",
      ]);
      expect(logMock.mock.calls[4]).toEqual([
        LOG_PREFIX.ERROR,
        "--------------------------",
      ]);

      expect(resBody).toEqual([
        [
          "__BRISA_ERRORS__",
          [
            {
              title:
                'Error transferring client "sensitive-data" store to server store',
              details: [
                "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object.",
              ],
              docTitle: "Documentation about store.transferToClient",
              docLink:
                "https://brisa.build/api-reference/components/request-context#transfertoclient",
            },
          ],
        ],
      ]);
    });

    it("should transfer headers from page SYNC responseHeaders from /somepage", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
          },
          body: JSON.stringify({ args: [] }),
        }),
        route: {
          // Good to know: the pages/somepage.tsx fixture adds
          // "x-test" header via responseHeaders
          filePath: path.join(FIXTURES, "pages", "/somepage.tsx"),
        } as any,
      });

      const res = await responseAction(req);

      expect(res.headers.get("x-test")).toBe("test");
    });

    it("should transfer headers from page ASYNC responseHeaders from home", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
          },
          body: JSON.stringify({ args: [] }),
        }),
        route: {
          // Good to know: the pages/somepage.tsx fixture adds
          // "x-test" header via responseHeaders
          filePath: path.join(FIXTURES, "pages", "/index.tsx"),
        } as any,
      });

      const res = await responseAction(req);

      expect(res.headers.get("x-test")).toBe("success");
    });

    it("should log an error if the action does not exist and return a 404 response", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_non-existing-action",
          },
          body: JSON.stringify({ args: [] }),
        }),
      });

      const res = await responseAction(req);
      const logMessage = logMock.mock.calls.toString();

      expect(logMock).toHaveBeenCalled();
      expect(logMessage).toContain(
        "The action a1_non-existing-action was not found",
      );
      expect(logMessage).toContain(
        "Don't worry, it's not your fault. Probably a bug in Brisa.",
      );

      expect(res.status).toBe(404);
      expect(res.headers.get("content-type")).toBe("application/json");
    });

    it("should register the dependencies into dependencies store correctly", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
            "x-actions": "[[['onClick', 'a1_2']]]",
          },
          body: JSON.stringify({
            args: [],
          }),
        }),
      });

      await responseAction(req);

      expect(req.store.get(Symbol.for("DEPENDENCIES"))).toEqual([
        [["onClick", "a1_2"]],
      ]);
    });
  });
});
