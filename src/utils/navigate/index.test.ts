import { describe, expect, it, spyOn } from "bun:test";
import navigate from ".";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

describe("utils", () => {
  describe("navigate", () => {
    it("should throw a navigation", () => {
      expect(() => navigate("/some")).toThrow("/some");
    });

    it("should throw a navigation in client-side and change the location.assign", () => {
      GlobalRegistrator.register();
      const mockEventListener = spyOn(window, "addEventListener");
      const mockLocationAssign = spyOn(location, "assign");
      expect(() => navigate("https://test.com/some")).toThrow(
        "https://test.com/some",
      );
      expect(mockLocationAssign).toHaveBeenCalledWith("https://test.com/some");
      expect(mockEventListener).toHaveBeenCalled();
      GlobalRegistrator.unregister();
    });
  });
});
