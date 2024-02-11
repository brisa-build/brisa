import { describe, it, expect } from "bun:test";
import rerenderInAction, { PREFIX_MESSAGE, SUFFIX_MESSAGE } from ".";

describe("utils", () => {
  describe("rerender-in-action", () => {
    it("should throw the correct error", () => {
      try {
        rerenderInAction();
      } catch (error: any) {
        expect(error.name).toBe("rerender");
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({ type: "component", mode: "reactivity" }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
      }
    });

    it("should throw the correct error with type='component' and mode='reactivity'", () => {
      try {
        rerenderInAction({ type: "component", mode: "reactivity" });
      } catch (error: any) {
        expect(error.name).toBe("rerender");
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({ type: "component", mode: "reactivity" }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
      }
    });

    it("should throw the correct error with type='page' and mode='transition'", () => {
      try {
        rerenderInAction({ type: "page", mode: "transition" });
      } catch (error: any) {
        expect(error.name).toBe("rerender");
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({ type: "page", mode: "transition" }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
      }
    });

    it("should throw the correct error with type='page' and mode='reactivity'", () => {
      try {
        rerenderInAction({ type: "page" });
      } catch (error: any) {
        expect(error.name).toBe("rerender");
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({ type: "page", mode: "reactivity" }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
      }
    });

    it("should throw the correct error with type='component' and mode='transition'", () => {
      try {
        rerenderInAction({ mode: "transition" });
      } catch (error: any) {
        expect(error.name).toBe("rerender");
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({ type: "component", mode: "transition" }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
      }
    });
  });
});
