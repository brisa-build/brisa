import { describe, spyOn, expect, it, beforeEach, afterEach } from "bun:test";
import feedbackError from ".";
import extendRequestContext from "@/utils/extend-request-context";

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

  it("should add ERR_DLOPEN_FAILED log the __BRISA_ERRORS__ to req.webStore", () => {
    const req = extendRequestContext({
      originalRequest: new Request("http://localhost"),
    });
    const error = new Error();
    error.name = "ERR_DLOPEN_FAILED";
    feedbackError(error, req);
    expect(logSpy).toHaveBeenCalled();

    const storeErrors = (req as any).webStore.get("__BRISA_ERRORS__");
    expect(storeErrors).toHaveLength(1);
    expect(storeErrors[0].title).toBe("ERR_DLOPEN_FAILED");
  });
});
