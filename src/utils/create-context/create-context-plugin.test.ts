import { describe, expect, it } from "bun:test";
import { generateContextID } from "./create-context-plugin";
import { toInline } from "../../helpers";

describe("utils", () => {
  describe("create-context-plugin", () => {
    it("should NOT add the context ID if already is there", () => {
      const inputCode = `
        import { createContext } from "brisa";

        const context = createContext<string>("foo", "some-id");
      `;

      const expectedCode = toInline(`
        import {createContext} from "brisa";
        const context = createContext("foo", "some-id");
      `);

      const outputCode = toInline(
        generateContextID(inputCode, "/some/path.ts"),
      );

      expect(outputCode).toBe(expectedCode);
    });

    it("should add the context ID", () => {
      const inputCode = `
        import { createContext } from "brisa";
        const context = createContext("foo");
      `;

      const expectedCode = toInline(`
        import {createContext} from "brisa";
        const context = createContext("foo", "0:0");
      `);

      const outputCode = toInline(
        generateContextID(inputCode, "/some/path.ts"),
      );

      expect(outputCode).toBe(expectedCode);
    });

    it("should add the context ID without default value", () => {
      const inputCode = `
        import { createContext } from "brisa";
        const context = createContext();
      `;

      const expectedCode = toInline(`
        import {createContext} from "brisa";
        const context = createContext(undefined, "0:0");
      `);

      const outputCode = toInline(
        generateContextID(inputCode, "/some/path.ts"),
      );

      expect(outputCode).toBe(expectedCode);
    });

    it("should add multiple context IDs", () => {
      const inputCode = `
        import { createContext } from "brisa";
        const context = createContext("foo");
        const context2 = createContext("bar");
      `;

      const expectedCode = toInline(`
        import {createContext} from "brisa";
        const context = createContext("foo", "0:0");
        const context2 = createContext("bar", "0:1");
      `);

      const outputCode = toInline(
        generateContextID(inputCode, "/some/path.ts"),
      );

      expect(outputCode).toBe(expectedCode);
    });

    it("should work with a renamed import", () => {
      const inputCode = `
        import { createContext as brisaCreateContext } from "brisa";
        const context = brisaCreateContext("foo");
      `;

      const expectedCode = toInline(`
        import {createContext as brisaCreateContext} from "brisa";
        const context = brisaCreateContext("foo", "0:0");
      `);

      const outputCode = toInline(
        generateContextID(inputCode, "/some/path.ts"),
      );

      expect(outputCode).toBe(expectedCode);
    });

    it("should work with a require (CJS)", () => {
      const inputCode = `
        const { createContext } = require("brisa");
        const context = createContext("foo");
      `;

      const expectedCode = toInline(`
        const {createContext} = require("brisa");
        const context = createContext("foo", "0:0");
      `);

      const outputCode = toInline(
        generateContextID(inputCode, "/some/path.ts"),
      );

      expect(outputCode).toBe(expectedCode);
    });

    it("should work with a required (CJS) mix with another ESM import", () => {
      const inputCode = `
        import { something } from "something";
        const { createContext } = require("brisa");
        const context = createContext("foo");
      `;

      const expectedCode = toInline(`
        import {something} from "something";
        const {createContext} = require("brisa");
        const context = createContext("foo", "0:0");
      `);

      const outputCode = toInline(
        generateContextID(inputCode, "/some/path.ts"),
      );

      expect(outputCode).toBe(expectedCode);
    });

    it("should work with a renamed require (CJS)", () => {
      const inputCode = `
        const { createContext: brisaCreateContext } = require("brisa");
        const context = brisaCreateContext("foo");
      `;

      const expectedCode = toInline(`
        const {createContext: brisaCreateContext} = require("brisa");
        const context = brisaCreateContext("foo", "0:0");
      `);

      const outputCode = toInline(
        generateContextID(inputCode, "/some/path.ts"),
      );

      expect(outputCode).toBe(expectedCode);
    });

    it("should consuming directly require (CJS)", () => {
      const inputCode = `
        const context = require("brisa").createContext("foo");
      `;

      const expectedCode = toInline(`
        const context = require("brisa").createContext("foo", "0:0");
      `);

      const outputCode = toInline(
        generateContextID(inputCode, "/some/path.ts"),
      );

      expect(outputCode).toBe(expectedCode);
    });

    it("should work using a variable from require (CJS)", () => {
      const inputCode = `
        const brisa = require("brisa");
        const context = brisa.createContext("foo");
      `;

      const expectedCode = toInline(`
        const brisa = require("brisa");
        const context = brisa.createContext("foo", "0:0");
      `);

      const outputCode = toInline(
        generateContextID(inputCode, "/some/path.ts"),
      );

      expect(outputCode).toBe(expectedCode);
    });

    it("should work using a variable from import (ESM)", () => {
      const inputCode = `
        import brisa from "brisa";
        const context = brisa.createContext("foo");
      `;

      const expectedCode = toInline(`
        import brisa from "brisa";
        const context = brisa.createContext("foo", "0:0");
      `);

      const outputCode = toInline(
        generateContextID(inputCode, "/some/path.ts"),
      );

      expect(outputCode).toBe(expectedCode);
    });
  });
});
