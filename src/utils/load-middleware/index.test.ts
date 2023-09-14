import { describe, it, expect, afterEach } from "bun:test";
import loadMiddleware from ".";
import path from "node:path";

const all = Promise.all;
const join = path.join;

describe("utils", () => {
  afterEach(() => {
    Promise.all = all;
    path.join = join;
  });

  describe("LoadLayout", () => {
    it("should return null if there is not a custom middleware", async () => {
      const middleware = await loadMiddleware();
      expect(middleware).toBeNull();
    });

    it('should return custom middleware if "middleware.ts" exists', async () => {
      Promise.all = async () => [true];
      path.join = () => import.meta.dir + "/../__fixtures__/middleware.ts";

      const middleware = await loadMiddleware();
      expect(middleware).toBeFunction();
    });
  });
});
