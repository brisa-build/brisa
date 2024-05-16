import isTestFile from "@/utils/is-test-file";
import { describe, it, expect } from "bun:test";

describe("utils", () => {
  describe("isTestFile", () => {
    it("should return false if the filename is not provided", () => {
      expect(isTestFile()).toBeFalse();
    });
    it("should return true if the file is a test file", () => {
      expect(isTestFile("index.test")).toBeTrue();
      expect(isTestFile("index_test")).toBeTrue();
      expect(isTestFile("index.spec")).toBeTrue();
      expect(isTestFile("index_spec")).toBeTrue();
      expect(isTestFile("index.test")).toBeTrue();
      expect(isTestFile("index_test")).toBeTrue();
      expect(isTestFile("index.spec")).toBeTrue();
      expect(isTestFile("index_spec")).toBeTrue();
    });

    it("should return false if the file is not a test file", () => {
      expect(isTestFile("index")).toBeFalse();
      expect(isTestFile("index")).toBeFalse();
      expect(isTestFile("index")).toBeFalse();
      expect(isTestFile("index")).toBeFalse();
    });

    it("should return true if the file is a test file with format", () => {
      const isUsingFormat = true;
      expect(isTestFile("index.test.ts", isUsingFormat)).toBeTrue();
      expect(isTestFile("index.test.tsx", isUsingFormat)).toBeTrue();
      expect(isTestFile("index.test.js", isUsingFormat)).toBeTrue();
      expect(isTestFile("index.test.jsx", isUsingFormat)).toBeTrue();

      expect(isTestFile("index_test.ts", isUsingFormat)).toBeTrue();
      expect(isTestFile("index_test.tsx", isUsingFormat)).toBeTrue();
      expect(isTestFile("index_test.js", isUsingFormat)).toBeTrue();
      expect(isTestFile("index_test.jsx", isUsingFormat)).toBeTrue();

      expect(isTestFile("index.spec.ts", isUsingFormat)).toBeTrue();
      expect(isTestFile("index.spec.tsx", isUsingFormat)).toBeTrue();
      expect(isTestFile("index.spec.js", isUsingFormat)).toBeTrue();
      expect(isTestFile("index.spec.jsx", isUsingFormat)).toBeTrue();

      expect(isTestFile("index_spec.ts", isUsingFormat)).toBeTrue();
      expect(isTestFile("index_spec.tsx", isUsingFormat)).toBeTrue();
      expect(isTestFile("index_spec.js", isUsingFormat)).toBeTrue();
      expect(isTestFile("index_spec.jsx", isUsingFormat)).toBeTrue();
    });

    it("should return false if the file is not a test file with format", () => {
      const isUsingFormat = true;
      expect(isTestFile("index.ts", isUsingFormat)).toBeFalse();
      expect(isTestFile("index.js", isUsingFormat)).toBeFalse();
      expect(isTestFile("index.tsx", isUsingFormat)).toBeFalse();
      expect(isTestFile("index.jsx", isUsingFormat)).toBeFalse();
    });
  });
});
