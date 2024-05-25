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

const FIXTURES = path.join(import.meta.dir, "..", "..", "__fixtures__");
const PAGE = "http://locahost/es/somepage";
let logMock: ReturnType<typeof spyOn>;

function stringify(value: any) {
  return encodeURIComponent(JSON.stringify(value));
}

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
          body: JSON.stringify([
            {
              foo: "bar",
            },
          ]),
        }),
      });

      const res = await responseAction(req);

      expect(res.headers.get("x-s")).toEqual(stringify([]));
      expect(req.store.get("__params:a1_1")).toEqual([{ foo: "bar" }]);
    });

    it('should be possible to access to store variables from "x-s" header', async () => {
      const xs = stringify([["foo", "bar"]]);
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
            "x-s": xs,
          },
          body: JSON.stringify([
            {
              foo: "bar",
            },
          ]),
        }),
      });

      const res = await responseAction(req);

      expect(req.store.get("foo")).toBe("bar");
      expect(res.headers.get("x-s")).toEqual(xs);
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
          body: JSON.stringify([
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
              detail: {
                foo: "bar",
              },
            },
          ]),
        }),
      });

      await responseAction(req);

      expect(req.store.get("__params:a1_1")).toEqual([{ foo: "bar" }]);
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
          body: JSON.stringify([
            {
              foo: "bar",
            },
          ]),
        }),
      });

      const res = await responseAction(req);

      expect(res.headers.get("x-s")).toEqual(stringify([]));
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
          body: JSON.stringify([
            {
              foo: "bar",
            },
          ]),
        }),
      });

      const res = await responseAction(req);

      expect(res.headers.get("x-s")).toEqual(stringify([]));
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
          body: JSON.stringify([
            {
              foo: "bar",
            },
          ]),
        }),
      });

      const res = await responseAction(req);

      expect(res.headers.get("x-s")).toEqual(stringify([]));
      expect(req.store.get("__params:a1_1")).toEqual([{ foo: "bar" }]);
      expect(logMock).toHaveBeenCalledWith("a1_1", {
        onClick: expect.any(Function),
      });
      // "foo" is added by a2_2 fixture
      expect(await logMock.mock.calls[0][1].onClick()).toBe("a2_1-a2_2-foo");
    });

    it('should decrypt the store variables from "x-s" header that starts with ENCRYPT_PREFIX', async () => {
      const xs = stringify([["sensitive-data", encrypt("foo")]]);
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
            "x-s": xs,
          },
          body: JSON.stringify([
            {
              foo: "bar",
            },
          ]),
        }),
      });

      const res = await responseAction(req);

      expect(req.store.get("sensitive-data")).toBe("foo");
      expect(res.headers.get("x-s")).toEqual(xs);
    });

    it('should decrypt the store variables from "x-s" header that starts with ENCRYPT_NONTEXT_PREFIX', async () => {
      const xs = stringify([["sensitive-data", encrypt({ foo: "bar" })]]);
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
            "x-s": xs,
          },
          body: JSON.stringify([
            {
              foo: "bar",
            },
          ]),
        }),
      });

      const res = await responseAction(req);

      expect(req.store.get("sensitive-data")).toEqual({ foo: "bar" });
      expect(res.headers.get("x-s")).toEqual(xs);
    });

    it('should emojis work inside "x-s" header', async () => {
      const xs = stringify([["sensitive-data", "👍"]]);
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
            "x-s": xs,
          },
          body: JSON.stringify([
            {
              foo: "bar",
            },
          ]),
        }),
      });

      const res = await responseAction(req);

      expect(req.store.get("sensitive-data")).toBe("👍");
      expect(res.headers.get("x-s")).toEqual(xs);
    });

    it('should log an error if the decryption fails from "x-s" header', async () => {
      const xs = JSON.stringify([
        ["sensitive-data", ENCRYPT_NONTEXT_PREFIX + "invalid-encrypted-data"],
      ]);
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
            "x-s": xs,
          },
          body: JSON.stringify([
            {
              foo: "bar",
            },
          ]),
        }),
      });

      const res = await responseAction(req);
      const { LOG_PREFIX } = getConstants();

      expect(logMock).toHaveBeenCalledTimes(7);
      expect(logMock.mock.calls[0]).toEqual([LOG_PREFIX.ERROR, "Ops! Error:"]);
      expect(logMock.mock.calls[1]).toEqual([
        LOG_PREFIX.ERROR,
        "--------------------------",
      ]);
      expect(logMock.mock.calls[2]).toEqual([
        LOG_PREFIX.ERROR,
        'Error transferring client "sensitive-data" store to server store',
      ]);
      expect(logMock.mock.calls[3]).toEqual([
        LOG_PREFIX.ERROR,
        "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object.",
      ]);
      expect(logMock.mock.calls[4]).toEqual([
        LOG_PREFIX.ERROR,
        "--------------------------",
      ]);

      expect(res.headers.get("x-s")).toBe(
        stringify([
          ["sensitive-data", null],
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
        ]),
      );
    });

    it("should transfer headers from page SYNC responseHeaders from /somepage", async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
          },
          body: JSON.stringify([]),
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
          body: JSON.stringify([]),
        }),
        route: {
          // Good to know: the pages/somepage.tsx fixture adds
          // "x-test" header via responseHeaders
          filePath: path.join(FIXTURES, "pages", "/index.tsx"),
        } as any,
      });

      const res = await responseAction(req);

      expect(res.headers.get("x-test")).toBe("test");
    });
  });
});
