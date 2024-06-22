import matchers from "@/core/test/matchers";
import type { BrisaTestMatchers } from "@/types";
import { mock, expect } from "bun:test";
import crypto from "node:crypto";

const dec = new TextDecoder();

Bun.env.__CRYPTO_KEY__ = crypto.randomBytes(32).toString("hex");
Bun.env.__CRYPTO_IV__ = crypto.randomBytes(8).toString("hex");
globalThis.__BASE_PATH__ = "";

// All tests about this diff dom streaming algorithm are inside the library
mock.module("diff-dom-streaming", () => ({
  default: async (
    doc: Document,
    reader: ReadableStreamDefaultReader<Uint8Array>,
  ) => {
    let result = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += dec.decode(value);
    }
    doc.documentElement.innerHTML = result;
  },
}));

expect.extend<BrisaTestMatchers>(matchers);
