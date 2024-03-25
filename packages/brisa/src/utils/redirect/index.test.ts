import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import path from "node:path";
import extendRequestContext from "../extend-request-context";
import { redirect, redirectFromUnnormalizedURL } from ".";

const ROOT_DIR = path.join(import.meta.dir, "..", "..", "__fixtures__");
const ASSETS_DIR = path.join(ROOT_DIR, "public");
const PAGES_DIR = path.join(ROOT_DIR, "pages");

describe("utils", () => {
  describe("redirect", () => {
    it("should return a response with the location header set to the given url", () => {
      const url = "https://example.com";
      const response = redirect(url);
      expect(response.headers.get("location")).toBe(url);
    });
  });

  describe("redirectFromUnnormalizedURL", () => {
    describe("WHEN trailingSlash is true and i18n is defined", () => {
      beforeEach(() => {
        globalThis.mockConstants = {
          ASSETS_DIR,
          PAGES_DIR,
          BUILD_DIR: PAGES_DIR,
          LOCALES_SET: new Set(["en", "es"]),
          I18N_CONFIG: {
            defaultLocale: "en",
            locales: ["en", "es"],
            pages: {},
          },
          CONFIG: {
            trailingSlash: true,
          },
        };
      });
      afterEach(() => {
        globalThis.mockConstants = undefined;
      });

      it("should return a 307 response if the origin of the given url is different from the origin of the current request", () => {
        const url = new URL("https://example.com");
        const currentRequest = extendRequestContext({
          originalRequest: new Request("https://example.org"),
        });
        const response = redirectFromUnnormalizedURL(url, currentRequest);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(url.toString());
      });

      it("should return a 301 response if the origin of the given url is the same as the origin of the current request", () => {
        const url = new URL("https://example.com");
        const currentRequest = extendRequestContext({
          originalRequest: new Request("https://example.com"),
        });
        const response = redirectFromUnnormalizedURL(url, currentRequest);
        expect(response.status).toBe(301);
        expect(response.headers.get("location")).toBe("/en/");
      });

      it("should return a 301 response if the given url is an asset request", () => {
        const url = new URL("https://example.com/favicon.ico");
        const currentRequest = extendRequestContext({
          originalRequest: new Request("https://example.com"),
        });
        const response = redirectFromUnnormalizedURL(url, currentRequest);
        expect(response.status).toBe(301);
        expect(response.headers.get("location")).toBe(
          "https://example.com/favicon.ico",
        );
      });

      it("should return a 301 response if the given url is not an asset request and not an action request", () => {
        const url = new URL("https://example.com/foo");
        const currentRequest = extendRequestContext({
          originalRequest: new Request("https://example.com"),
        });
        const response = redirectFromUnnormalizedURL(url, currentRequest);
        expect(response.status).toBe(301);
        expect(response.headers.get("location")).toBe("/en/foo/");
      });

      it("should return a 301 response if the given url is not an asset request and not an action request and the redirectTrailingSlash function returns a response", () => {
        const url = new URL("https://example.com/foo/");
        const currentRequest = extendRequestContext({
          originalRequest: new Request("https://example.com"),
        });
        const response = redirectFromUnnormalizedURL(url, currentRequest);
        expect(response.status).toBe(301);
        expect(response.headers.get("location")).toBe("/en/foo/");
      });
    });
    describe("WHEN trailingSlash is false and i18n is defined", () => {
      beforeEach(() => {
        globalThis.mockConstants = {
          ASSETS_DIR,
          PAGES_DIR,
          BUILD_DIR: PAGES_DIR,
          LOCALES_SET: new Set(["en", "es"]),
          I18N_CONFIG: {
            defaultLocale: "en",
            locales: ["en", "es"],
            pages: {},
          },
          CONFIG: {
            trailingSlash: false,
          },
        };
      });
      afterEach(() => {
        globalThis.mockConstants = undefined;
      });

      it("should return a 307 response if the origin of the given url is different from the origin of the current request", () => {
        const url = new URL("https://example.com");
        const currentRequest = extendRequestContext({
          originalRequest: new Request("https://example.org"),
        });
        const response = redirectFromUnnormalizedURL(url, currentRequest);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(url.toString());
      });

      it("should return a 301 response if the origin of the given url is the same as the origin of the current request", () => {
        const url = new URL("https://example.com");
        const currentRequest = extendRequestContext({
          originalRequest: new Request("https://example.com"),
        });
        const response = redirectFromUnnormalizedURL(url, currentRequest);
        expect(response.status).toBe(301);
        expect(response.headers.get("location")).toBe("/en");
      });

      it("should return a 301 response if the given url is an asset request", () => {
        const url = new URL("https://example.com/favicon.ico");
        const currentRequest = extendRequestContext({
          originalRequest: new Request("https://example.com"),
        });
        const response = redirectFromUnnormalizedURL(url, currentRequest);
        expect(response.status).toBe(301);
        expect(response.headers.get("location")).toBe(
          "https://example.com/favicon.ico",
        );
      });

      it("should return a 301 response if the given url is not an asset request and not an action request", () => {
        const url = new URL("https://example.com/foo/");
        const currentRequest = extendRequestContext({
          originalRequest: new Request("https://example.com"),
        });
        const response = redirectFromUnnormalizedURL(url, currentRequest);
        expect(response.status).toBe(301);
        expect(response.headers.get("location")).toBe("/en/foo");
      });
    });

    describe("WHEN i18n is not defined", () => {
      beforeEach(() => {
        globalThis.mockConstants = {
          ASSETS_DIR,
          PAGES_DIR,
          BUILD_DIR: PAGES_DIR,
          CONFIG: {
            trailingSlash: true,
          },
        };
      });
      afterEach(() => {
        globalThis.mockConstants = undefined;
      });

      it("should return a 307 response if the origin of the given url is different from the origin of the current request", () => {
        const url = new URL("https://example.com");
        const currentRequest = extendRequestContext({
          originalRequest: new Request("https://example.org"),
        });
        const response = redirectFromUnnormalizedURL(url, currentRequest);
        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toBe(url.toString());
      });

      it("should return a 301 response if the origin of the given url is the same as the origin of the current request", () => {
        const url = new URL("https://example.com");
        const currentRequest = extendRequestContext({
          originalRequest: new Request("https://example.com"),
        });
        const response = redirectFromUnnormalizedURL(url, currentRequest);
        expect(response.status).toBe(301);
        expect(response.headers.get("location")).toBe(url.toString());
      });

      it("should return a 301 response if the given url is an asset request", () => {
        const url = new URL("https://example.com/favicon.ico");
        const currentRequest = extendRequestContext({
          originalRequest: new Request("https://example.com"),
        });
        const response = redirectFromUnnormalizedURL(url, currentRequest);
        expect(response.status).toBe(301);
        expect(response.headers.get("location")).toBe(
          "https://example.com/favicon.ico",
        );
      });

      it("should return a 301 response if the given url is not an asset request and not an action request", () => {
        const url = new URL("https://example.com/foo/");
        const currentRequest = extendRequestContext({
          originalRequest: new Request("https://example.com"),
        });
        const response = redirectFromUnnormalizedURL(url, currentRequest);
        expect(response.status).toBe(301);
        expect(response.headers.get("location")).toBe(
          "https://example.com/foo/",
        );
      });
    });
  });
});
