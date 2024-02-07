import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import path from "node:path";
import extendRequestContext from "@/utils/extend-request-context";
import responseAction from ".";

const FIXTURES = path.join(import.meta.dir, "..", "..", "__fixtures__");

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
      const action = "a1_1";

      const req = extendRequestContext({
        originalRequest: new Request(`http://locahost/_action/${action}`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
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
        originalRequest: new Request(`http://locahost/_action/${action}`, {
          method: "POST",
          headers: {
            "content-type": "multipart/form-data",
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
          currentTarget: null,
          defaultPrevented: true,
          eventPhase: 0,
          formData,
          returnValue: true,
          srcElement: null,
          target: {
            action: "http://locahost/_action/a1_1",
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
        originalRequest: new Request(`http://locahost/_action/${action}`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
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
