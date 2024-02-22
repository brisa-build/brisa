import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import path from "node:path";
import extendRequestContext from "@/utils/extend-request-context";
import responseAction from ".";

const FIXTURES = path.join(import.meta.dir, "..", "..", "__fixtures__");
const PAGE = "http://locahost/es/somepage";

describe("utils", () => {
  beforeEach(() => {
    globalThis.mockConstants = {
      BUILD_DIR: FIXTURES,
    };
  });
  afterEach(() => {
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

      await responseAction(req);

      expect(req.store.get("_action_params")).toEqual([{ foo: "bar" }]);
    });

    it("should add the correct param when using form-data", async () => {
      const action = "a1_1";

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

      expect(req.store.get("_action_params")).toEqual([
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
      const action = "a1_1";

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
              _custom: true,
              detail: {
                foo: "bar",
              },
            },
          ]),
        }),
      });

      await responseAction(req);

      expect(req.store.get("_action_params")).toEqual([{ foo: "bar" }]);
    });
  });
});
