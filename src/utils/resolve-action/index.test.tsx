import { describe, it, expect } from "bun:test";
import resolveAction from ".";
import extendRequestContext from "../extend-request-context";

describe("utils", () => {
  describe("resolve-action", () => {
    it("should return a response with NotFoundError redirect", async () => {
      const error = new Error("Not found");
      error.name = "NotFoundError";

      const req = extendRequestContext({
        originalRequest: new Request("http://localhost"),
      });
      const response = resolveAction({ req, error, component: <div /> });

      expect(await response.text()).toBe(
        '{"action":"navigate","params":["http://localhost/?_not-found=1"]}',
      );
    });

    it("should redirect to an specific url", async () => {
      const redirectError = new Error("/some-url");
      redirectError.name = "redirect";

      const req = extendRequestContext({
        originalRequest: new Request("http://localhost"),
      });

      const response = resolveAction({
        req,
        error: redirectError,
        component: <div />,
      });

      expect(await response.text()).toBe(
        '{"action":"navigate","params":["/some-url"]}',
      );
    });
  });
});
