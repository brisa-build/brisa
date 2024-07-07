import AST from "@/utils/ast";
import getWebComponentAst from "@/utils/client-build-plugin/get-web-component-ast";
import skipPropTransformation from "@/utils/client-build-plugin/skip-prop-transformation";
import { describe, expect, it } from "bun:test";

const { parseCodeToAST } = AST("tsx");

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

    expect(applySkipTest(code, props)).toEqual([
      {
        type: "Identifier",
        name: "foo",
        _skip: ["foo"],
      },
    ]);
  });
});

function applySkipTest(inputCode: string, props: Set<string>) {
  const ast = parseCodeToAST(inputCode);
  const [component] = getWebComponentAst(ast);
  const declaration = (component as any)?.declarations?.[0];
  const componentBody = component?.body ?? declaration?.init.body;
  const skipped: any[] = [];

  JSON.parse(
    JSON.stringify(componentBody, skipPropTransformation(props)),
    displaySkippedParts,
  );

  function displaySkippedParts(this: any, key: string, value: any) {
    if (value?._skip && !this?._skip) skipped.push(value);
    return value;
  }

  return skipped;
}
