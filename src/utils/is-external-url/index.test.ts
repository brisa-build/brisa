import { describe, expect, it } from "bun:test";
import isExternalUrl from ".";

describe("bunrise core", () => {
  describe("isExternalUrl", () => {
    it("should return false if the URL is internal", () => {
      const input = "/somepage";
      const output = isExternalUrl(input);
      const expected = false;

      expect(output).toBe(expected);
    });
    it("should return true if the URL is external", () => {
      const input = "https://example.com";
      const output = isExternalUrl(input);
      const expected = true;

      expect(output).toBe(expected);
    });

    it("should return true if the URL is mailto", () => {
      const input = "mailto:test@example.com";
      const output = isExternalUrl(input);
      const expected = true;

      expect(output).toBe(expected);
    });

    it("should return true if the URL is tel", () => {
      const input = "tel:+1234567890";
      const output = isExternalUrl(input);
      const expected = true;

      expect(output).toBe(expected);
    });

    it("should return true if the URL is sms", () => {
      const input = "sms:+1234567890";
      const output = isExternalUrl(input);
      const expected = true;

      expect(output).toBe(expected);
    });

    it("should return true if the URL is data", () => {
      const input = "data:image/png;base64,ABC";
      const output = isExternalUrl(input);
      const expected = true;

      expect(output).toBe(expected);
    });

    it("should return true if the URL is blob", () => {
      const input = "blob:https://example.com/123";
      const output = isExternalUrl(input);
      const expected = true;

      expect(output).toBe(expected);
    });
  });
});