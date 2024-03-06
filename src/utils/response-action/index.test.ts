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

const FIXTURES = path.join(import.meta.dir, "..", "..", "__fixtures__");
const PAGE = "http://locahost/es/somepage";
let logMock: ReturnType<typeof spyOn>;

describe("utils", () => {
  beforeEach(() => {
    logMock = spyOn(console, "log");
    globalThis.mockConstants = {
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

      expect(res.headers.get("x-s")).toEqual("[]");
      expect(req.store.get("__params:a1_1")).toEqual([{ foo: "bar" }]);
    });

    it('should be possible to access to store variables from "x-s" header', async () => {
      const req = extendRequestContext({
        originalRequest: new Request(PAGE, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-action": "a1_1",
            "x-s": JSON.stringify([["foo", "bar"]]),
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
      expect(res.headers.get("x-s")).toEqual('[["foo","bar"]]');
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

      await responseAction(req);

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
          },
          timeStamp: 0,
          type: "formdata",
        },
      ]);
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

      expect(res.headers.get("x-s")).toEqual("[]");
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

      expect(res.headers.get("x-s")).toEqual("[]");
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

      expect(res.headers.get("x-s")).toEqual("[]");
      expect(req.store.get("__params:a1_1")).toEqual([{ foo: "bar" }]);
      expect(logMock).toHaveBeenCalledWith("a1_1", {
        onClick: expect.any(Function),
      });
      // "foo" is added by a2_2 fixture
      expect(await logMock.mock.calls[0][1].onClick()).toBe("a2_1-a2_2-foo");
    });
  });
});
