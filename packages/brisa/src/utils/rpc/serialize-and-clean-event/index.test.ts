import { stringifyAndCleanEvent } from "@/utils/rpc/serialize-and-clean-event";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";

describe("RPC", () => {
  beforeEach(() => {
    GlobalRegistrator.register();
  });
  afterEach(() => {
    if (typeof window === "undefined") return;
    GlobalRegistrator.unregister();
  });
  describe("stringifyAndCleanEvent", () => {
    it("should stringify correctly an event", () => {
      const dataToSerialize = { args: [new Event("click")] };
      const result = JSON.parse(stringifyAndCleanEvent(dataToSerialize));
      expect(result).toEqual({
        args: [
          {
            defaultPrevented: false,
            eventPhase: 0,
            timeStamp: expect.any(Number),
            NONE: 0,
            CAPTURING_PHASE: 1,
            AT_TARGET: 2,
            BUBBLING_PHASE: 3,
            type: "click",
            bubbles: false,
            cancelable: false,
            composed: false,
          },
        ],
      });
    });

    it("should add _wc property to CustomEvent", () => {
      const customEvent = new CustomEvent("custom");
      const dataToSerialize = { args: [customEvent] };
      const result = JSON.parse(stringifyAndCleanEvent(dataToSerialize));
      expect(result.args[0]._wc).toBeTrue();
    });

    it("should remove null/undefined/empty string values from the event", () => {
      const customEvent = new CustomEvent("custom", {
        detail: {
          foo: null,
          bar: undefined,
          baz: "",
          another: "value",
        },
      });

      const dataToSerialize = { args: [customEvent] };
      const result = JSON.parse(stringifyAndCleanEvent(dataToSerialize));
      expect(result).toEqual({
        args: [
          {
            AT_TARGET: 2,
            BUBBLING_PHASE: 3,
            CAPTURING_PHASE: 1,
            NONE: 0,
            _wc: true,
            detail: {
              another: "value",
            },
            eventPhase: 0,
            defaultPrevented: false,
            timeStamp: expect.any(Number),
            type: "custom",
            bubbles: false,
            cancelable: false,
            composed: false,
          },
        ],
      });
    });

    it("should remove Window instances from the event", () => {
      const customEvent = new CustomEvent("custom", {
        detail: {
          foo: new Window(), // workaround to create a Window instance on happy-dom
        },
      });

      const dataToSerialize = { args: [customEvent] };
      const result = JSON.parse(stringifyAndCleanEvent(dataToSerialize));
      expect(result).toEqual({
        args: [
          {
            AT_TARGET: 2,
            BUBBLING_PHASE: 3,
            CAPTURING_PHASE: 1,
            NONE: 0,
            _wc: true,
            detail: {},
            eventPhase: 0,
            defaultPrevented: false,
            timeStamp: expect.any(Number),
            type: "custom",
            bubbles: false,
            cancelable: false,
            composed: false,
          },
        ],
      });
    });

    it("should remove Node instances from the event", () => {
      const customEvent = new CustomEvent("custom", {
        detail: {
          foo: document.createElement("div"),
          bar: document.createElement("span"),
        },
      });

      const dataToSerialize = { args: [customEvent] };
      const result = JSON.parse(stringifyAndCleanEvent(dataToSerialize));
      expect(result).toEqual({
        args: [
          {
            AT_TARGET: 2,
            BUBBLING_PHASE: 3,
            CAPTURING_PHASE: 1,
            NONE: 0,
            _wc: true,
            detail: {},
            eventPhase: 0,
            defaultPrevented: false,
            timeStamp: expect.any(Number),
            type: "custom",
            bubbles: false,
            cancelable: false,
            composed: false,
          },
        ],
      });
    });

    it("should allow empoty string on another arguments that are not event", () => {
      const dataToSerialize = { args: [new Event("click"), ""] };
      const result = JSON.parse(stringifyAndCleanEvent(dataToSerialize));
      expect(result).toEqual({
        args: [
          {
            defaultPrevented: false,
            eventPhase: 0,
            timeStamp: expect.any(Number),
            NONE: 0,
            CAPTURING_PHASE: 1,
            AT_TARGET: 2,
            BUBBLING_PHASE: 3,
            type: "click",
            bubbles: false,
            cancelable: false,
            composed: false,
          },
          "",
        ],
      });
    });

    it("should allow empty string on store", () => {
      const dataToSerialize = { "x-s": [["foo", ""]] };
      const result = JSON.parse(stringifyAndCleanEvent(dataToSerialize));
      expect(result).toEqual({
        "x-s": [["foo", ""]],
      });
    });

    it("should allow null on store", () => {
      const dataToSerialize = { "x-s": [["foo", null]] };
      const result = JSON.parse(stringifyAndCleanEvent(dataToSerialize));
      expect(result).toEqual({
        "x-s": [["foo", null]],
      });
    });

    // For now is converted to "null" by JSON.stringify, it would be nice to fix
    // this case: https://github.com/brisa-build/brisa/issues/279
    it.todo("should allow undefined on store", () => {
      const dataToSerialize = { "x-s": [["foo", undefined]] };
      const result = JSON.parse(stringifyAndCleanEvent(dataToSerialize));
      expect(result).toEqual({
        "x-s": [["foo", undefined]],
      });
    });
  });
});
