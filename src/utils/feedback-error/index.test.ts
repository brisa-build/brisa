import { describe, spyOn, expect, it } from "bun:test";
import feedbackError from ".";

describe("feedbackError", () => {
  it("should log ERR_DLOPEN_FAILED", () => {
    const error = new Error();
    error.name = "ERR_DLOPEN_FAILED";
    const logErrorSpy = spyOn(console, "log").mockImplementation(() => {});
    feedbackError(error);
    expect(logErrorSpy).toHaveBeenCalled();
  });
});
