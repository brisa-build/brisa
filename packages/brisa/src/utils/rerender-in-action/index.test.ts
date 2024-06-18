import { describe, it, expect } from "bun:test";
import rerenderInAction, { PREFIX_MESSAGE, SUFFIX_MESSAGE } from ".";

const PROPS_SYMBOL = Symbol.for("props");

describe("utils", () => {
  describe("rerender-in-action", () => {
    it("should throw the correct error", () => {
      try {
        rerenderInAction();
      } catch (error: any) {
        expect(error.name).toBe("rerender");
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({
            type: "currentComponent",
            renderMode: "reactivity",
          }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
      }
    });

    it("should throw the correct error with type='targetComponent' and renderMode='reactivity'", () => {
      try {
        rerenderInAction({ type: "targetComponent", renderMode: "reactivity" });
      } catch (error: any) {
        expect(error.name).toBe("rerender");
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({ type: "targetComponent", renderMode: "reactivity" }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
        expect(error[PROPS_SYMBOL]).toEqual({});
      }
    });

    it("should throw the correct error with type='currentComponent' and renderMode='reactivity'", () => {
      try {
        rerenderInAction({
          type: "currentComponent",
          renderMode: "reactivity",
        });
      } catch (error: any) {
        expect(error.name).toBe("rerender");
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({
            type: "currentComponent",
            renderMode: "reactivity",
          }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
        expect(error[PROPS_SYMBOL]).toEqual({});
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
        expect(error[PROPS_SYMBOL]).toBeUndefined();
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
        expect(error[PROPS_SYMBOL]).toBeUndefined();
      }
    });

    it("should throw the correct error with type='currentComponent' and renderMode='transition'", () => {
      try {
        rerenderInAction({ renderMode: "transition" });
      } catch (error: any) {
        expect(error.name).toBe("rerender");
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({
            type: "currentComponent",
            renderMode: "transition",
          }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
        expect(error[PROPS_SYMBOL]).toEqual({});
      }
    });

    it("should throw the correct error with type='targetComponent' and renderMode='transition'", () => {
      try {
        rerenderInAction({ type: "targetComponent", renderMode: "transition" });
      } catch (error: any) {
        expect(error.name).toBe("rerender");
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({ type: "targetComponent", renderMode: "transition" }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
        expect(error[PROPS_SYMBOL]).toEqual({});
      }
    });

    it("should throw the correct error with props", () => {
      try {
        rerenderInAction({ props: { foo: "bar" } });
      } catch (error: any) {
        expect(error.name).toBe("rerender");
        expect(error.message).toContain(PREFIX_MESSAGE);
        expect(error.message).toContain(
          JSON.stringify({
            type: "currentComponent",
            renderMode: "reactivity",
          }),
        );
        expect(error.message).toContain(SUFFIX_MESSAGE);
        expect(error[PROPS_SYMBOL]).toEqual({ foo: "bar" });
      }
    });
  });
});
