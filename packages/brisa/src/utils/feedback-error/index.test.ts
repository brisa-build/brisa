import { describe, spyOn, expect, it, beforeEach, afterEach } from "bun:test";
import feedbackError from ".";

let logSpy: ReturnType<typeof spyOn>;

describe("feedbackError", () => {
  beforeEach(() => {
    logSpy = spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    logSpy.mockRestore();
  });

  it("should log ERR_DLOPEN_FAILED", () => {
    const error = new Error();
    error.name = "ERR_DLOPEN_FAILED";
    feedbackError(error);
    expect(logSpy).toHaveBeenCalled();
  });

  it("should log error stack", () => {
    const error = new Error();
    feedbackError(error);
    expect(logSpy.mock.calls.toString()).toContain(error.stack?.toString?.());
  });
});
