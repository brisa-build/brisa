import getDependenciesMap from "@/utils/ast/get-dependencies-list";
import { expect, it, describe } from "bun:test";
import type { ESTree } from "meriyah";

describe("utils", () => {
  describe("ast", () => {
    describe("get-dependencies-list", () => {
      it("should return a list with the dependencies of the given ast", () => {
        const ast = {
          type: "Program",
          body: [
            {
              type: "ImportDeclaration",
              specifiers: [
                {
                  type: "ImportDefaultSpecifier",
                  local: { type: "Identifier", name: "foo" },
                },
              ],
              source: { type: "Literal", value: "./index.tsx" },
            },
          ],
        } as ESTree.Program;

        const path = "/path/to/file.tsx";
        const deps = getDependenciesMap(ast, path);

        expect(deps).toEqual(new Set(["/path/to/index.tsx"]));
      });

      it("should support initial value as 3th argument", () => {
        const ast = {
          type: "Program",
          body: [
            {
              type: "ImportDeclaration",
              specifiers: [
                {
                  type: "ImportDefaultSpecifier",
                  local: { type: "Identifier", name: "foo" },
                },
              ],
              source: { type: "Literal", value: "./index.tsx" },
            },
          ],
        } as ESTree.Program;

        const path = "/path/to/file.tsx";
        const initialValue = new Set(["/path/to/initial.tsx"]);
        const deps = getDependenciesMap(ast, path, initialValue);

        expect(deps).toEqual(
          new Set(["/path/to/index.tsx", "/path/to/initial.tsx"]),
        );
      });

      it("should return a list with the dependencies of the given ast with multiple imports", () => {
        const ast = {
          type: "Program",
          body: [
            {
              type: "ImportDeclaration",
              specifiers: [
                {
                  type: "ImportDefaultSpecifier",
                  local: { type: "Identifier", name: "foo" },
                },
              ],
              source: { type: "Literal", value: "./index.tsx" },
            },
            {
              type: "ImportDeclaration",
              specifiers: [
                {
                  type: "ImportDefaultSpecifier",
                  local: { type: "Identifier", name: "bar" },
                },
              ],
              source: { type: "Literal", value: "./bar.tsx" },
            },
          ],
        } as ESTree.Program;

        const path = "/path/to/file.tsx";
        const deps = getDependenciesMap(ast, path);

        expect(deps).toEqual(
          new Set(["/path/to/index.tsx", "/path/to/bar.tsx"]),
        );
      });

      it("should work with named imports", () => {
        const ast = {
          type: "Program",
          body: [
            {
              type: "ImportDeclaration",
              specifiers: [
                {
                  type: "ImportSpecifier",
                  imported: { type: "Identifier", name: "foo" },
                  local: { type: "Identifier", name: "foo" },
                },
              ],
              source: { type: "Literal", value: "./index.tsx" },
            },
          ],
        } as ESTree.Program;

        const path = "/path/to/file.tsx";
        const deps = getDependenciesMap(ast, path);

        expect(deps).toEqual(new Set(["/path/to/index.tsx"]));
      });
    });
  });
});
