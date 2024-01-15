import { describe, it, expect } from "bun:test";
import AST from "@/utils/ast";
import getWebComponentAst from "@/utils/get-web-component-ast";
import getVariableNames from ".";

const { parseCodeToAST } = AST();

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
    describe("get-component-variable-names", () => {
      it("should register the names of all variables inside the web-component", () => {
        const ast = parseCodeToAST(`
            export default function MyComponent(props) {
              const name = "Aral";
              const age = 33;
              const { address, ...rest } = props;

              return <div>Hello {name}!</div>;
            }
          `);
        const [componentBranch] = getWebComponentAst(ast);
        const varNames = getVariableNames(componentBranch as any);

        expect(varNames.toSorted()).toEqual(
          ["name", "age", "address", "rest", "props"].toSorted(),
        );
      });
    });
  });
});
