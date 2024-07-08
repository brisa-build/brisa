import getAllPatternNames from "@/utils/ast/get-all-pattern-names";
import { describe, expect, it } from "bun:test";

describe("AST", () => {
  describe("getAllPatternNames", () => {
    it("should return all pattern names from a simple object pattern", () => {
      const pattern = {
        type: "ObjectPattern",
        properties: [
          {
            type: "Property",
            key: { type: "Identifier", name: "a" },
            value: { type: "Identifier", name: "b" },
            kind: "init",
          },
          {
            type: "Property",
            key: { type: "Identifier", name: "c" },
            value: { type: "Identifier", name: "d" },
            kind: "init",
          },
        ],
      };

      const names = getAllPatternNames(pattern);

      expect(names).toEqual(
        new Set([
          {
            type: "Identifier",
            name: "b",
          },
          {
            type: "Identifier",
            name: "d",
          },
        ]),
      );
    });

    it("should return all pattern names from a simple array pattern", () => {
      const pattern = {
        type: "ArrayPattern",
        elements: [
          { type: "Identifier", name: "a" },
          { type: "Identifier", name: "b" },
          { type: "Identifier", name: "c" },
          { type: "Identifier", name: "d" },
        ],
      };

      const names = getAllPatternNames(pattern);

      expect(names).toEqual(
        new Set([
          {
            type: "Identifier",
            name: "a",
          },
          {
            type: "Identifier",
            name: "b",
          },
          {
            type: "Identifier",
            name: "c",
          },
          {
            type: "Identifier",
            name: "d",
          },
        ]),
      );
    });

    it("should return all pattern names from a nested object pattern", () => {
      const pattern = {
        type: "ObjectPattern",
        properties: [
          {
            type: "Property",
            key: { type: "Identifier", name: "a" },
            value: {
              type: "ObjectPattern",
              properties: [
                {
                  type: "Property",
                  key: { type: "Identifier", name: "b" },
                  value: { type: "Identifier", name: "c" },
                  kind: "init",
                },
                {
                  type: "Property",
                  key: { type: "Identifier", name: "d" },
                  value: { type: "Identifier", name: "e" },
                  kind: "init",
                },
              ],
            },
            kind: "init",
          },
        ],
      };

      const names = getAllPatternNames(pattern);

      expect(names).toEqual(
        new Set([
          {
            type: "Identifier",
            name: "c",
          },
          {
            type: "Identifier",
            name: "e",
          },
        ]),
      );
    });

    it("should return all pattern names from a nested array pattern", () => {
      const pattern = {
        type: "ArrayPattern",
        elements: [
          { type: "Identifier", name: "a" },
          {
            type: "ArrayPattern",
            elements: [
              { type: "Identifier", name: "b" },
              { type: "Identifier", name: "c" },
            ],
          },
          { type: "Identifier", name: "d" },
        ],
      };

      const names = getAllPatternNames(pattern);

      expect(names).toEqual(
        new Set([
          {
            type: "Identifier",
            name: "a",
          },
          {
            type: "Identifier",
            name: "b",
          },
          {
            type: "Identifier",
            name: "c",
          },
          {
            type: "Identifier",
            name: "d",
          },
        ]),
      );
    });

    it("should return all pattern names from a nested object and array pattern", () => {
      const pattern = {
        type: "ObjectPattern",
        properties: [
          {
            type: "Property",
            key: { type: "Identifier", name: "a" },
            value: {
              type: "ArrayPattern",
              elements: [
                { type: "Identifier", name: "b" },
                { type: "Identifier", name: "c" },
              ],
            },
            kind: "init",
          },
        ],
      };

      const names = getAllPatternNames(pattern);

      expect(names).toEqual(
        new Set([
          {
            type: "Identifier",
            name: "b",
          },
          {
            type: "Identifier",
            name: "c",
          },
        ]),
      );
    });

    it("should return all pattern names from a nested array and object pattern", () => {
      const pattern = {
        type: "ArrayPattern",
        elements: [
          { type: "Identifier", name: "a" },
          {
            type: "ObjectPattern",
            properties: [
              {
                type: "Property",
                key: { type: "Identifier", name: "b" },
                value: { type: "Identifier", name: "c" },
                kind: "init",
              },
            ],
          },
          { type: "Identifier", name: "d" },
        ],
      };

      const names = getAllPatternNames(pattern);

      expect(names).toEqual(
        new Set([
          {
            type: "Identifier",
            name: "a",
          },
          {
            type: "Identifier",
            name: "c",
          },
          {
            type: "Identifier",
            name: "d",
          },
        ]),
      );
    });

    it("should work with assignment patterns", () => {
      const pattern = {
        type: "ObjectPattern",
        properties: [
          {
            type: "Property",
            key: { type: "Identifier", name: "a" },
            value: {
              type: "AssignmentPattern",
              left: { type: "Identifier", name: "b" },
              right: { type: "Identifier", name: "c" },
            },
            kind: "init",
          },
        ],
      };

      const names = getAllPatternNames(pattern);

      expect(names).toEqual(
        new Set([
          {
            type: "Identifier",
            name: "b",
          },
        ]),
      );
    });
  });
});
