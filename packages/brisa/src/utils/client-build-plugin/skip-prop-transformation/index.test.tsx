import { normalizeQuotes } from "@/helpers";
import AST from "@/utils/ast";
import getWebComponentAst from "@/utils/client-build-plugin/get-web-component-ast";
import skipPropTransformation from "@/utils/client-build-plugin/skip-prop-transformation";
import { describe, expect, it } from "bun:test";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");

describe("client-build-plugin/skip-prop-transformation", () => {
  it("should skip scopes with variables with the same name as prop", () => {
    const code = `
      export default function Component({foo}) {
        function onClick() {
          const foo = 1;
          console.log(foo);
        }
        return <div onClick={onClick}>{foo}</div>;
      }
    `;
    const props = new Set(["foo"]);
    const out = applySkipTest(code, props);
    const lines = getOutputCodeLines(out, "foo");

    expect(lines).toEqual(["console.log(foo);"]);
  });

  it("should skip all the rest of the scope with variables with the same name as prop", () => {
    const code = `
      export default function Component({foo}) {
        function onClick() {
          const foo = 1;
          console.log(foo);
          const bar = 2;
          console.log(bar);
          const baz = 3;
          console.log(baz);
        }
        return <div onClick={onClick}>{foo}</div>;
      }
    `;
    const props = new Set(["foo", "bar", "baz"]);
    const out = applySkipTest(code, props);

    console.log(out);

    expect(getOutputCodeLines(out, "foo")).toEqual([
      "console.log(foo);",
      "const bar = 2;",
      "console.log(bar);",
      "const baz = 3;",
      "console.log(baz);",
    ]);

    expect(getOutputCodeLines(out, "bar")).toEqual([
      "console.log(bar);",
      "const baz = 3;",
      "console.log(baz);",
    ]);

    expect(getOutputCodeLines(out, "baz")).toEqual(["console.log(baz);"]);
  });

  it("should skip inside nested scopes", () => {
    const code = `
      export default function Component({foo}) {
        function onClick() {
          const foo = 1;
          const test = () => {
            const bar = 2;
            console.log(bar);
          }
          console.log(foo);
        }
        return <div onClick={onClick}>{foo}</div>;
      }
    `;
    const props = new Set(["foo", "bar"]);
    const out = applySkipTest(code, props);

    expect(getOutputCodeLines(out, "foo")).toEqual([
      // Inner scope:
      "const bar = 2;",
      "console.log(bar);",
      // Outer scope:
      "const test = () => {const bar = 2;console.log(bar);};",
      "console.log(foo);",
    ]);

    expect(getOutputCodeLines(out, "bar")).toEqual([
      // Inner scope:
      "console.log(bar);",
    ]);
  });
});

function applySkipTest(inputCode: string, props: Set<string>) {
  const ast = parseCodeToAST(inputCode);
  const [component] = getWebComponentAst(ast);
  const declaration = (component as any)?.declarations?.[0];
  const componentBody = component?.body ?? declaration?.init.body;
  return JSON.stringify(componentBody, skipPropTransformation(props));
}

function getOutputCodeLines(out: string, byProp: string) {
  const skipped: any[] = [];

  JSON.parse(out, displaySkippedParts);

  function displaySkippedParts(this: any, key: string, value: any) {
    if (
      value?.type !== "Identifier" &&
      value?.type !== "VariableDeclarator" &&
      Array.isArray(this) &&
      value?._skip?.includes(byProp)
    ) {
      skipped.push(value);
    }
    return value;
  }

  return skipped.map((node) => normalizeQuotes(generateCodeFromAST(node)));
}
