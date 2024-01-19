import { describe, it, expect } from "bun:test";
import generateStaticExport from "./index";

describe("utils", () => {
  describe("generate-static-export", () => {
    it.todo("should generate static export", async () => {
      const success = await generateStaticExport();
      expect(success).toBe(true);
    });
  });
});
