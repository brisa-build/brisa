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
          JSON.stringify({ type: "component", renderMode: "reactivity" }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
      }
    });

    it("should throw the correct error with type='component' and renderMode='reactivity'", () => {
      try {
        rerenderInAction({ type: "component", renderMode: "reactivity" });
      } catch (error: any) {
        expect(error.name).toBe("rerender");
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({ type: "component", renderMode: "reactivity" }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
      }
    });

    it("should throw the correct error with type='page' and renderMode='transition'", () => {
      try {
        rerenderInAction({ type: "page", renderMode: "transition" });
      } catch (error: any) {
        expect(error.name).toBe("rerender");
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({ type: "page", renderMode: "transition" }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
      }
    });

    it("should throw the correct error with type='page' and renderMode='reactivity'", () => {
      try {
        rerenderInAction({ type: "page" });
      } catch (error: any) {
        expect(error.name).toBe("rerender");
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({ type: "page", renderMode: "reactivity" }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
      }
    });

    it("should throw the correct error with type='component' and renderMode='transition'", () => {
      try {
        rerenderInAction({ renderMode: "transition" });
      } catch (error: any) {
        expect(error.name).toBe("rerender");
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({ type: "component", renderMode: "transition" }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
      }
    });
  });
});
