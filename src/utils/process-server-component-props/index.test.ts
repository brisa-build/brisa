import { describe, it, expect } from "bun:test";
import processServerComponentProps from ".";

describe("utils", () => {
  describe("processServerComponentProps", () => {
    it("should process nested action props", () => {
      const onClick = () => {};
      const props = {
        onClick,
        "data-action-onclick": "1",
      };
      const result = processServerComponentProps(props);
      expect(result).toEqual({ onClick });
      expect(result.onClick).toHaveProperty("actionId", "1");
    });
  });
});
