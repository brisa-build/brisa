import { describe, expect, it } from "bun:test";
import isAnAction from ".";

describe("utils", () => {
  describe("is-an-action", () => {
    it("should return true if the action is an action", () => {
      const action = () => {};
      action.actionId = "1";
      expect(isAnAction(action)).toBe(true);
    });

    it("should return false if the action is not an action", () => {
      const action = () => {};
      expect(isAnAction(action)).toBe(false);
    });
  });
});
