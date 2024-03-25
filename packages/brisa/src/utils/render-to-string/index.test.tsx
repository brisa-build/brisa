import { describe, it, expect, beforeEach, spyOn, afterEach } from "bun:test";
import renderToString from ".";

let mockLog: ReturnType<typeof spyOn>;

describe("utils", () => {
  describe("renderToString", () => {
    beforeEach(() => {
      mockLog = spyOn(console, "error");
    });
    afterEach(() => {
      mockLog.mockRestore();
    });
    // This test is to verify that is well connected to the render-to-readable-stream,
    // all the other tests are already covered in the render-to-readable-stream
    it("should render to string correctly", async () => {
      const element = <div>test</div>;
      const result = await renderToString(element);
      expect(result).toBe("<div>test</div>");

      // Verify page error logs are not logged in this case
      expect(mockLog).not.toHaveBeenCalled();
    });
  });
});
