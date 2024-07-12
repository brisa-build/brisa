import { normalizeQuotes } from "@/helpers";
import AST from "@/utils/ast";
import getWebComponentAst from "@/utils/client-build-plugin/get-web-component-ast";
import skipPropTransformation from "@/utils/client-build-plugin/skip-prop-transformation";
import { describe, expect, it } from "bun:test";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");
const PROPS_OPTIMIZATION_IDENTIFIER = "__b_props__";

describe("client-build-plugin/skip-prop-transformation", () => {
  describe("VariableDeclaration in component body", () => {
    it("should not skip anything in same level of component body", () => {
      const code = `
        export default function Component(__b_props__, {derived}) {
            const foo = derived(() => __b_props__.foo);
            console.log(foo);
            return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const lines = getOutputCodeLines(out, "foo");
      const varIdentifiers = ["foo"];

      expect(lines).toEqual(varIdentifiers);
    });
  });

  describe("VariableDeclaration", () => {
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
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const lines = getOutputCodeLines(out, "foo");

      expect(lines).toEqual(["foo", "console.log(foo);"]);
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
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const varIdentifiers = ["foo", "bar", "baz"];

      expect(getOutputCodeLines(out, "foo")).toEqual([
        varIdentifiers[0],
        "console.log(foo);",
        varIdentifiers[1],
        "const bar = 2;",
        "console.log(bar);",
        varIdentifiers[2],
        "const baz = 3;",
        "console.log(baz);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        varIdentifiers[0],
        varIdentifiers[1],
        "console.log(bar);",
        varIdentifiers[2],
        "const baz = 3;",
        "console.log(baz);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...varIdentifiers,
        "console.log(baz);",
      ]);
    });

    it("should skip variables inside nested scopes", () => {
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
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const varIdentifiers = ["foo", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual([
        ...varIdentifiers,
        // Inner scope:
        "const bar = 2;",
        "console.log(bar);",
        // Outer scope:
        "const test = () => {const bar = 2;console.log(bar);};",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...varIdentifiers,
        // Inner scope:
        "console.log(bar);",
      ]);
    });
  });

  describe("ObjectPattern", () => {
    it("should skip scopes with destructured variables with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const {foo} = 1;
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const lines = getOutputCodeLines(out, "foo");
      const varIdentifiers = ["foo", "foo"];

      expect(lines).toEqual([...varIdentifiers, "console.log(foo);"]);
    });
    it("should skip all the rest of the scope with destructured variables with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const {foo} = 1;
            console.log(foo);
            const {bar} = 2;
            console.log(bar);
            const {baz} = 3;
            console.log(baz);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const fooIdentifiers = ["foo", "foo"];
      const barIdentifiers = ["bar", "bar"];
      const bazIdentifiers = ["baz", "baz"];

      expect(getOutputCodeLines(out, "foo")).toEqual([
        ...fooIdentifiers,
        "console.log(foo);",
        ...barIdentifiers,
        "const {bar} = 2;",
        "console.log(bar);",
        ...bazIdentifiers,
        "const {baz} = 3;",
        "console.log(baz);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...fooIdentifiers,
        ...barIdentifiers,
        "console.log(bar);",
        ...bazIdentifiers,
        "const {baz} = 3;",
        "console.log(baz);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...fooIdentifiers,
        ...barIdentifiers,
        ...bazIdentifiers,
        "console.log(baz);",
      ]);
    });
    it("should skip variables inside nested destructured variables", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const {foo} = 1;
            const test = () => {
              const {bar} = 2;
              console.log(bar);
            }
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const varIdentifiers = ["foo", "foo", "bar", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual([
        ...varIdentifiers,
        // Inner scope:
        "const {bar} = 2;",
        "console.log(bar);",
        // Outer scope:
        "const test = () => {const {bar} = 2;console.log(bar);};",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...varIdentifiers,
        // Inner scope:
        "console.log(bar);",
      ]);
    });
  });

  describe("ArrayPattern", () => {
    it("should skip scopes with destructured variables with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const [foo] = 1;
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const lines = getOutputCodeLines(out, "foo");

      expect(lines).toEqual(["foo", "console.log(foo);"]);
    });

    it("should skip all the rest of the scope with destructured variables with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const [foo] = 1;
            console.log(foo);
            const [bar] = 2;
            console.log(bar);
            const [baz] = 3;
            console.log(baz);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const varIdentifiers = ["foo", "bar", "baz"];

      expect(getOutputCodeLines(out, "foo")).toEqual([
        varIdentifiers[0],
        "console.log(foo);",
        varIdentifiers[1],
        "const [bar] = 2;",
        "console.log(bar);",
        varIdentifiers[2],
        "const [baz] = 3;",
        "console.log(baz);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        varIdentifiers[0],
        varIdentifiers[1],
        "console.log(bar);",
        varIdentifiers[2],
        "const [baz] = 3;",
        "console.log(baz);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...varIdentifiers,
        "console.log(baz);",
      ]);
    });

    it("should skip variables inside nested destructured variables", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const [foo] = 1;
            const test = () => {
              const [bar] = 2;
              console.log(bar);
            }
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const varIdentifiers = ["foo", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual([
        ...varIdentifiers,

        // Inner scope:
        "const [bar] = 2;",
        "console.log(bar);",
        // Outer scope:
        "const test = () => {const [bar] = 2;console.log(bar);};",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...varIdentifiers,
        // Inner scope:
        "console.log(bar);",
      ]);
    });
  });

  describe("ObjectPattern with nested destructured variables", () => {
    it("should skip scopes with nested destructured variables with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const {foo: {bar}} = 1;
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const varIdentifiers = ["foo", "bar", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual(varIdentifiers);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...varIdentifiers,
        "console.log(bar);",
      ]);
    });

    it("should skip all the rest of the scope with nested destructured variables with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const {foo: {bar}} = 1;
            console.log(bar);
            const {bar: {baz}} = 2;
            console.log(baz);
            const {baz: {foo}} = 3;
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const barIdentifiers = ["foo", "bar", "bar"];
      const bazIdentifiers = ["bar", "baz", "baz"];
      const fooIdentifiers = ["baz", "foo", "foo"];

      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...barIdentifiers,
        "console.log(bar);",
        ...bazIdentifiers,
        "const {bar: {baz}} = 2;",
        "console.log(baz);",
        ...fooIdentifiers,
        "const {baz: {foo}} = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...barIdentifiers,
        ...bazIdentifiers,
        "console.log(baz);",
        ...fooIdentifiers,
        "const {baz: {foo}} = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        ...barIdentifiers,
        ...bazIdentifiers,
        ...fooIdentifiers,
        "console.log(foo);",
      ]);
    });

    it("should skip variables inside nested destructured variables with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const {foo: {bar}} = 1;
            const test = () => {
              const {bar: {baz}} = 2;
              console.log(baz);
            }
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const varIdentifiers = ["foo", "bar", "bar", "bar", "baz", "baz"];

      expect(getOutputCodeLines(out, "foo")).toEqual(varIdentifiers);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...varIdentifiers,
        // Inner scope:
        "const {bar: {baz}} = 2;",
        "console.log(baz);",

        // Outer scope:
        "const test = () => {const {bar: {baz}} = 2;console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...varIdentifiers,
        // Inner scope:
        "console.log(baz);",
      ]);
    });
  });

  describe("ArrayPattern with nested destructured variables", () => {
    it("should skip scopes with nested destructured variables with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const [{bar}] = 1;
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const varIdentifiers = ["bar", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual(varIdentifiers);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...varIdentifiers,
        "console.log(bar);",
      ]);
    });

    it("should skip all the rest of the scope with nested destructured variables with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const [{bar}] = 1;
            console.log(bar);
            const [{baz}] = 2;
            console.log(baz);
            const [{foo}] = 3;
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const varIdentifiers = ["bar", "baz", "foo"];

      expect(getOutputCodeLines(out, "bar")).toEqual([
        varIdentifiers[0],
        varIdentifiers[0],
        "console.log(bar);",
        varIdentifiers[1],
        varIdentifiers[1],
        "const [{baz}] = 2;",
        "console.log(baz);",
        varIdentifiers[2],
        varIdentifiers[2],
        "const [{foo}] = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        varIdentifiers[0],
        varIdentifiers[0],
        varIdentifiers[1],
        varIdentifiers[1],
        "console.log(baz);",
        varIdentifiers[2],
        varIdentifiers[2],
        "const [{foo}] = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        varIdentifiers[0],
        varIdentifiers[0],
        varIdentifiers[1],
        varIdentifiers[1],
        varIdentifiers[2],
        varIdentifiers[2],
        "console.log(foo);",
      ]);
    });

    it("should skip variables inside nested destructured variables with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const [{bar}] = 1;
            const test = () => {
              const [{baz}] = 2;
              console.log(baz);
            }
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const varIdentifiers = ["bar", "bar", "baz", "baz"];

      expect(getOutputCodeLines(out, "foo")).toEqual(varIdentifiers);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...varIdentifiers,
        // Inner scope:
        "const [{baz}] = 2;",
        "console.log(baz);",

        // Outer scope:
        "const test = () => {const [{baz}] = 2;console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...varIdentifiers,
        // Inner scope:
        "console.log(baz);",
      ]);
    });
  });

  describe("ObjectPattern with RestElement", () => {
    it("should skip scopes with rest elements with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const {foo, ...bar} = 1;
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const varIdentifiers = ["foo", "foo", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual([
        ...varIdentifiers,
        "console.log(bar);",
      ]);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...varIdentifiers,
        "console.log(bar);",
      ]);
    });

    it("should skip all the rest of the scope with rest elements with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const {...bar} = 1;
            console.log(bar);
            const {...baz} = 2;
            console.log(baz);
            const {...foo} = 3;
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const varIdentifiers = ["bar", "baz", "foo"];

      expect(getOutputCodeLines(out, "bar")).toEqual([
        varIdentifiers[0],
        "console.log(bar);",
        varIdentifiers[1],
        "const {...baz} = 2;",
        "console.log(baz);",
        varIdentifiers[2],
        "const {...foo} = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...varIdentifiers.slice(0, 2),
        "console.log(baz);",
        varIdentifiers[2],
        "const {...foo} = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        ...varIdentifiers,
        "console.log(foo);",
      ]);
    });

    it("should skip variables inside nested rest elements with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const {foo, ...bar} = 1;
            const test = () => {
              const {bar, ...baz} = 2;
              console.log(baz);
            }
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const varIdentifiers = ["foo", "foo", "bar", "bar", "bar", "baz"];

      expect(getOutputCodeLines(out, "foo")).toEqual([
        ...varIdentifiers,
        // Inner scope:
        "const {bar, ...baz} = 2;",
        "console.log(baz);",

        // Outer scope:
        "const test = () => {const {bar, ...baz} = 2;console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...varIdentifiers,
        // Inner scope:
        "const {bar, ...baz} = 2;",
        "console.log(baz);",

        // Outer scope:
        "const test = () => {const {bar, ...baz} = 2;console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...varIdentifiers,
        // Inner scope:
        "console.log(baz);",
      ]);
    });
  });

  describe("ArrayPattern with RestElement", () => {
    it("should skip scopes with rest elements with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const [foo, ...bar] = 1;
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const varIdentifiers = ["foo", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual([
        ...varIdentifiers,
        "console.log(bar);",
      ]);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...varIdentifiers,
        "console.log(bar);",
      ]);
    });

    it("should skip all the rest of the scope with rest elements with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const [...bar] = 1;
            console.log(bar);
            const [...baz] = 2;
            console.log(baz);
            const [...foo] = 3;
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));

      expect(getOutputCodeLines(out, "bar")).toEqual([
        "bar",
        "console.log(bar);",
        "baz",
        "const [...baz] = 2;",
        "console.log(baz);",
        "foo",
        "const [...foo] = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        "bar",
        "baz",
        "console.log(baz);",
        "foo",
        "const [...foo] = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Var identifiers
        "bar",
        "baz",
        "foo",
        // Inner scope:
        "console.log(foo);",
      ]);
    });

    it("should skip variables inside nested rest elements with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick() {
            const [foo, ...bar] = 1;
            const test = () => {
              const [bar, ...baz] = 2;
              console.log(baz);
            }
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;

      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedVarIdentifiers = ["foo", "bar", "bar", "baz"];

      expect(getOutputCodeLines(out, "foo")).toEqual([
        ...expectedVarIdentifiers,
        // Inner scope:
        "const [bar, ...baz] = 2;",
        "console.log(baz);",

        // Outer scope:
        "const test = () => {const [bar, ...baz] = 2;console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedVarIdentifiers,
        // Inner scope:
        "const [bar, ...baz] = 2;",
        "console.log(baz);",

        // Outer scope:
        "const test = () => {const [bar, ...baz] = 2;console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...expectedVarIdentifiers,
        // Inner scope:
        "console.log(baz);",
      ]);
    });
  });

  describe("FunctionDeclaration parameters", () => {
    it("should skip function declarations with parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick(foo) {
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const lines = getOutputCodeLines(out, "foo");

      expect(lines).toEqual([
        // Params onClick fn
        "foo",
        // Inner scope:
        "console.log(foo);",
      ]);
    });

    it("should skip all the rest of the function declaration with parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick(foo, bar, baz) {
            console.log(foo);
            console.log(bar);
            console.log(baz);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expected = [
        // Params onClick fn
        "foo",
        "bar",
        "baz",

        // Inner scope:
        "console.log(foo);",
        "console.log(bar);",
        "console.log(baz);",
      ];

      expect(getOutputCodeLines(out, "foo")).toEqual(expected);
      expect(getOutputCodeLines(out, "bar")).toEqual(expected);
      expect(getOutputCodeLines(out, "baz")).toEqual(expected);
    });

    it("should skip variables inside nested function declarations with parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick(foo) {
            const test = (bar) => {
              console.log(bar);
            }
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Param onClick fn
        "foo",

        // Param test fn
        "bar",

        // Inner scope:
        "console.log(bar);",

        // Outer scope:
        "const test = bar => {console.log(bar);};",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        // Param onClick fn
        "foo",

        // Param test fn
        "bar",

        // Inner scope:
        "console.log(bar);",
      ]);
    });
  });

  describe("FunctionDeclaration rest parameter", () => {
    it("should skip function declarations with rest parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick(...foo) {
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const lines = getOutputCodeLines(out, "foo");

      expect(lines).toEqual([
        // Params onClick fn
        "foo",

        // Inner scope:
        "console.log(foo);",
      ]);
    });

    it("should skip all the rest of the function declaration with rest parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick(...foo) {
            console.log(foo);
            console.log(foo);
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expected = [
        // Params onClick fn
        "foo",

        // Inner scope:
        "console.log(foo);",
        "console.log(foo);",
        "console.log(foo);",
      ];

      expect(getOutputCodeLines(out, "foo")).toEqual(expected);
    });

    it("should skip variables inside nested function declarations with rest parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick(...foo) {
            const test = (...bar) => {
              console.log(bar);
            }
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Param onClick fn
        "foo",

        // Param test fn
        "bar",

        // Inner scope:
        "console.log(bar);",

        // Outer scope:
        "const test = (...bar) => {console.log(bar);};",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        // Param onClick fn
        "foo",

        // Param test fn
        "bar",

        // Inner scope:
        "console.log(bar);",
      ]);
    });
  });

  describe("FunctionDeclaration destructured parameters", () => {
    it("should skip function expressions with destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick({foo}){
            console.log(foo)
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const lines = getOutputCodeLines(out, "foo");
      const expectedParams = ["foo", "foo"];

      expect(lines).toEqual([...expectedParams, "console.log(foo);"]);
    });

    it("should skip all the rest of the function expression with destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick({foo, bar, baz}) {
            console.log(foo);
            console.log(bar);
            console.log(baz);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["foo", "foo", "bar", "bar", "baz", "baz"];
      const expected = [
        ...expectedParams,
        "console.log(foo);",
        "console.log(bar);",
        "console.log(baz);",
      ];

      expect(getOutputCodeLines(out, "foo")).toEqual(expected);
      expect(getOutputCodeLines(out, "bar")).toEqual(expected);
      expect(getOutputCodeLines(out, "baz")).toEqual(expected);
    });

    it("should skip variables inside nested function expressions with destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick({foo}) {
            function test({bar}) {
              console.log(bar);
            }
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["foo", "foo", "bar", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual([
        ...expectedParams,
        // Inner scope:
        "console.log(bar);",

        // Outer scope:
        "function test({bar}) {console.log(bar);}",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,
        // Inner scope:
        "console.log(bar);",
      ]);
    });
  });

  describe("FunctionDeclaration with nested destructured parameters", () => {
    it("should skip function expressions with nested destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick({foo: {bar}}){
            console.log(bar)
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["bar", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,
        "console.log(bar);",
      ]);
    });

    it("should skip all the rest of the function expression with nested destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick({foo: {bar}}) {
            console.log(bar);
            console.log(bar);
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["bar", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,
        "console.log(bar);",
        "console.log(bar);",
        "console.log(bar);",
      ]);
    });

    it("should skip variables inside nested function expressions with nested destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick({foo: {bar}}) {
            const test = ({bar: {baz}}) => {
              console.log(baz);
            }
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["bar", "bar", "baz", "baz"];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,

        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        "const test = ({bar: {baz}}) => {console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...expectedParams,

        // Inner scope:
        "console.log(baz);",
      ]);
    });
  });

  describe("FunctionDeclaration destructured parameters with renames", () => {
    it("should skip function expressions with destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick({foo: bar}){
            console.log(bar)
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,
        "console.log(bar);",
      ]);
    });

    it("should skip all the rest of the function expression with destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick({foo: bar, bar: baz, baz: quux}) {
            console.log(bar);
            console.log(baz);
            console.log(quux);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz", "quux"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["bar", "baz", "quux"];
      const expected = [
        ...expectedParams,
        "console.log(bar);",
        "console.log(baz);",
        "console.log(quux);",
      ];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual(expected);
      expect(getOutputCodeLines(out, "baz")).toEqual(expected);
      expect(getOutputCodeLines(out, "quux")).toEqual(expected);
    });

    it("should skip variables inside nested function expressions with destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick({foo: bar}) {
            const test = ({bar: baz}) => {
              console.log(baz);
            }
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["bar", "baz"];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,
        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        "const test = ({bar: baz}) => {console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...expectedParams,
        // Inner scope:
        "console.log(baz);",
      ]);
    });
  });

  describe("FunctionDeclaration nested destructured parameters with renames and default values", () => {
    it("should skip function expressions with nested destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick({foo: {bar = 1}}){
            console.log(bar)
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["bar", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,
        "console.log(bar);",
      ]);
    });

    it("should skip all the rest of the function expression with nested destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick({foo: {bar = 1, baz = {}, quux = []}}) {
            console.log(bar);
            console.log(baz);
            console.log(quux);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz", "quux"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["bar", "bar", "baz", "baz", "quux", "quux"];
      const expected = [
        ...expectedParams,
        "console.log(bar);",
        "console.log(baz);",
        "console.log(quux);",
      ];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual(expected);
      expect(getOutputCodeLines(out, "baz")).toEqual(expected);
      expect(getOutputCodeLines(out, "quux")).toEqual(expected);
    });

    it("should skip variables inside nested function expressions with nested destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick({foo: {bar = 1}}) {
            const test = ({bar: {baz = "2"}}) => {
              console.log(baz);
            }
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["bar", "bar", "baz", "baz"];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,
        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        'const test = ({bar: {baz = "2"}}) => {console.log(baz);};',
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...expectedParams,
        // Inner scope:
        "console.log(baz);",
      ]);
    });
  });

  describe("FunctionDeclaration with ArrayPattern", () => {
    it("should skip function expressions with array patterns with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick([foo]){
            console.log(foo)
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const lines = getOutputCodeLines(out, "foo");

      expect(lines).toEqual(["foo", "console.log(foo);"]);
    });

    it("should skip all the rest of the function expression with array patterns with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick([foo, bar, baz]) {
            console.log(foo);
            console.log(bar);
            console.log(baz);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expected = [
        // Params onClick fn
        "foo",
        "bar",
        "baz",

        // Inner scope:
        "console.log(foo);",
        "console.log(bar);",
        "console.log(baz);",
      ];

      expect(getOutputCodeLines(out, "foo")).toEqual(expected);
      expect(getOutputCodeLines(out, "bar")).toEqual(expected);
      expect(getOutputCodeLines(out, "baz")).toEqual(expected);
    });

    it("should skip variables inside nested function expressions with array patterns with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick([foo]) {
            const test = ([bar]) => {
              console.log(bar);
            }
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["foo", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual([
        ...expectedParams,
        // Inner scope:
        "console.log(bar);",

        // Outer scope:
        "const test = ([bar]) => {console.log(bar);};",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,
        // Inner scope:
        "console.log(bar);",
      ]);
    });
  });

  describe("FunctionDeclaration with RestElement", () => {
    it("should skip function declarations with rest elements with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick({foo, ...bar}) {
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["foo", "foo", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual([
        ...expectedParams,
        "console.log(bar);",
      ]);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,
        "console.log(bar);",
      ]);
    });

    it("should skip all the rest of the function declaration with rest elements with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick({...bar}) {
            console.log(bar);
            console.log(bar);
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,
        "console.log(bar);",
        "console.log(bar);",
        "console.log(bar);",
      ]);
    });

    it("should skip variables inside nested function declarations with rest elements with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          function onClick({foo, ...bar}) {
            const test = ({bar, ...baz}) => {
              console.log(baz);
            }
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["foo", "foo", "bar", "bar", "bar", "baz"];

      expect(getOutputCodeLines(out, "foo")).toEqual([
        ...expectedParams,
        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        "const test = ({bar, ...baz}) => {console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,
        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        "const test = ({bar, ...baz}) => {console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...expectedParams,
        // Inner scope:
        "console.log(baz);",
      ]);
    });
  });

  describe("ArrowFunctionExpression parameters", () => {
    it("should skip arrow function expressions with parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = (foo) => console.log(foo);
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const lines = getOutputCodeLines(out, "foo");

      expect(lines).toEqual([
        // Param onClick fn
        "foo",
        // Inner scope:
        "console.log(foo)",
      ]);
    });

    it("should skip all the rest of the arrow function expression with parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = (foo, bar, baz) => {
            console.log(foo);
            console.log(bar);
            console.log(baz);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expected = [
        // Param onClick fn
        "foo",
        "bar",
        "baz",

        // Inner scope:
        "console.log(foo);",
        "console.log(bar);",
        "console.log(baz);",
      ];

      expect(getOutputCodeLines(out, "foo")).toEqual(expected);
      expect(getOutputCodeLines(out, "bar")).toEqual(expected);
      expect(getOutputCodeLines(out, "baz")).toEqual(expected);
    });

    it("should skip variables inside nested arrow function expressions with parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = (foo) => {
            const test = (bar) => {
              console.log(bar);
            }
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Param onClick fn
        "foo",

        // Param test fn
        "bar",

        // Inner scope:
        "console.log(bar);",

        // Outer scope:
        "const test = bar => {console.log(bar);};",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        // Param onClick fn
        "foo",

        // Param test fn
        "bar",

        // Inner scope:
        "console.log(bar);",
      ]);
    });
  });

  describe("ArrowFunctionExpression destructured parameters", () => {
    it("should skip function expressions with destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ({foo}) => console.log(foo);
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const lines = getOutputCodeLines(out, "foo");
      const expectedParams = ["foo", "foo"];

      expect(lines).toEqual([...expectedParams, "console.log(foo)"]);
    });

    it("should skip all the rest of the function expression with destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ({foo, bar, baz}) => {
            console.log(foo);
            console.log(bar);
            console.log(baz);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expected = [
        // Params onClick fn
        "foo",
        "foo",
        "bar",
        "bar",
        "baz",
        "baz",

        // Inner scope:
        "console.log(foo);",
        "console.log(bar);",
        "console.log(baz);",
      ];

      expect(getOutputCodeLines(out, "foo")).toEqual(expected);
      expect(getOutputCodeLines(out, "bar")).toEqual(expected);
      expect(getOutputCodeLines(out, "baz")).toEqual(expected);
    });

    it("should skip variables inside nested function expressions with destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ({foo}) => {
            const test = ({bar}) => {
              console.log(bar);
            }
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["foo", "foo", "bar", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual([
        ...expectedParams,

        // Inner scope:
        "console.log(bar);",

        // Outer scope:
        "const test = ({bar}) => {console.log(bar);};",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,

        // Inner scope:
        "console.log(bar);",
      ]);
    });
  });

  describe("ArrowFunctionExpression with nested destructured parameters", () => {
    it("should skip arrow function expressions with nested destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ({foo: {bar}}) => console.log(bar);
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["bar", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,
        "console.log(bar)",
      ]);
    });

    it("should skip all the rest of the arrow function expression with nested destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ({foo: {bar}}) => {
            console.log(bar);
            console.log(bar);
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["bar", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,
        "console.log(bar);",
        "console.log(bar);",
        "console.log(bar);",
      ]);
    });

    it("should skip variables inside nested arrow function expressions with nested destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ({foo: {bar}}) => {
            const test = ({bar: {baz}}) => {
              console.log(baz);
            }
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["bar", "bar", "baz", "baz"];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,
        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        "const test = ({bar: {baz}}) => {console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...expectedParams,
        "console.log(baz);",
      ]);
    });
  });

  describe("ArrowFunctionExpression destructured parameters with renames", () => {
    it("should skip arrow function expressions with destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ({foo: bar}) => console.log(bar);
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));

      expect(getOutputCodeLines(out, "foo")).toEqual(["bar"]);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        "bar",
        "console.log(bar)",
      ]);
    });

    it("should skip all the rest of the arrow function expression with destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ({foo: bar, bar: baz, baz: quux}) => {
            console.log(bar);
            console.log(baz);
            console.log(quux);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz", "quux"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["bar", "baz", "quux"];
      const expected = [
        ...expectedParams,
        "console.log(bar);",
        "console.log(baz);",
        "console.log(quux);",
      ];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual(expected);
      expect(getOutputCodeLines(out, "baz")).toEqual(expected);
      expect(getOutputCodeLines(out, "quux")).toEqual(expected);
    });

    it("should skip variables inside nested arrow function expressions with destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ({foo: bar}) => {
            const test = ({bar: baz}) => {
              console.log(baz);
            }
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = ["bar", "baz"];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...expectedParams,

        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        "const test = ({bar: baz}) => {console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...expectedParams,
        "console.log(baz);",
      ]);
    });
  });

  describe("ArrowFunctionExpression nested destructured parameters with renames and default values", () => {
    it("should skip arrow function expressions with nested destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ({foo: {bar = 1}}) => console.log(bar);
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const fnParams = ["bar", "bar"];

      expect(getOutputCodeLines(out, "foo")).toEqual(fnParams);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...fnParams,
        "console.log(bar)",
      ]);
    });

    it("should skip all the rest of the arrow function expression with nested destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ({foo: {bar = 1, baz = {}, quux = []}}) => {
            console.log(bar);
            console.log(baz);
            console.log(quux);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz", "quux"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expectedParams = [
        // onClick fn params
        "bar",
        "bar",
        "baz",
        "baz",
        "quux",
        "quux",
      ];
      const expected = [
        ...expectedParams,

        // Inner scope:
        "console.log(bar);",
        "console.log(baz);",
        "console.log(quux);",
      ];

      expect(getOutputCodeLines(out, "foo")).toEqual(expectedParams);
      expect(getOutputCodeLines(out, "bar")).toEqual(expected);
      expect(getOutputCodeLines(out, "baz")).toEqual(expected);
      expect(getOutputCodeLines(out, "quux")).toEqual(expected);
    });

    it("should skip variables inside nested arrow function expressions with nested destructured parameters with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ({foo: {bar = 1}}) => {
            const test = ({bar: {baz = "2"}}) => {
              console.log(baz);
            }
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const paramUsedsFn = ["bar", "bar", "baz", "baz"];

      expect(getOutputCodeLines(out, "foo")).toEqual(paramUsedsFn);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        ...paramUsedsFn,
        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        `const test = ({bar: {baz = "2"}}) => {console.log(baz);};`,
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        ...paramUsedsFn,
        "console.log(baz);",
      ]);
    });
  });

  describe("ArrowFunctionExpression with ArrayPattern", () => {
    it("should skip arrow function expressions with array patterns with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ([foo]) => console.log(foo);
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const lines = getOutputCodeLines(out, "foo");

      expect(lines).toEqual(["foo", "console.log(foo)"]);
    });

    it("should skip all the rest of the arrow function expression with array patterns with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ([foo, bar, baz]) => {
            console.log(foo);
            console.log(bar);
            console.log(baz);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));
      const expected = [
        // Param onClick fn
        "foo",
        "bar",
        "baz",

        // Inner scope:
        "console.log(foo);",
        "console.log(bar);",
        "console.log(baz);",
      ];

      expect(getOutputCodeLines(out, "foo")).toEqual(expected);
      expect(getOutputCodeLines(out, "bar")).toEqual(expected);
      expect(getOutputCodeLines(out, "baz")).toEqual(expected);
    });

    it("should skip variables inside nested arrow function expressions with array patterns with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ([foo]) => {
            const test = ([bar]) => {
              console.log(bar);
            }
            console.log(foo);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Param onClick fn
        "foo",

        // Param test fn
        "bar",

        // Inner scope:
        "console.log(bar);",

        // Outer scope:
        "const test = ([bar]) => {console.log(bar);};",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        // Param onClick fn
        "foo",

        // Param test fn
        "bar",

        // Inner scope:
        "console.log(bar);",
      ]);
    });
  });

  describe("ArrowFunctionExpression with RestElement", () => {
    it("should skip arrow function expressions with rest elements with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ({foo, ...bar}) => console.log(bar);
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Params Component
        "foo",
        // Param onClick fn
        "foo",
        "bar",
        // Inner scope:
        "console.log(bar)",
      ]);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        // Params Component
        "foo",
        // Param onClick fn
        "foo",
        "bar",
        // Inner scope:
        "console.log(bar)",
      ]);
    });

    it("should skip all the rest of the arrow function expression with rest elements with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ({...bar}) => {
            console.log(bar);
            console.log(bar);
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar"]);
      const out = applySkipTest(code, props, "", new Set(["foo"]));

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Param onClick fn
        "bar",
      ]);
      expect(getOutputCodeLines(out, "bar")).toEqual([
        // Param onClick fn
        "bar",
        // Inner scope:
        "console.log(bar);",
        "console.log(bar);",
        "console.log(bar);",
      ]);
    });

    it("should skip variables inside nested arrow function expressions with rest elements with the same name as prop", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = ({foo, ...bar}) => {
            const test = ({bar, ...baz}) => {
              console.log(baz);
            }
            console.log(bar);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo", "bar", "baz"]);
      const standalonProps = new Set(["foo"]);
      const out = applySkipTest(code, props, "", standalonProps);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Component param fn:
        "foo",

        // Param onClick fn
        "foo",
        "bar",
        "bar",

        // Param test fn
        "bar",
        "baz",

        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        "const test = ({bar, ...baz}) => {console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        // Component param fn:
        "foo",

        // Param onClick fn
        "foo",
        "bar",
        "bar",

        // Param test fn
        "bar",
        "baz",

        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        "const test = ({bar, ...baz}) => {console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        // Component param fn:
        "foo",

        // Param onClick fn
        "foo",
        "bar",
        "bar",

        // Param test fn
        "bar",
        "baz",

        // Inner scope:
        "console.log(baz);",
      ]);
    });
  });

  describe("MemberExpression", () => {
    it('should skip "foo" prop when is a derived property without the optimization (__b_props__)', () => {
      const code = `
        export default function Component(props, {derived}) {
          const foo = derived(() => props.foo);
          const onClick = () => {
            console.log(foo.bar.baz.quux);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props);
      const lines = getOutputCodeLines(out, "foo");

      expect(lines).toEqual([
        // const foo:
        "foo",
        // Inner scope:
        "foo",
        "bar",
        "baz",
        "quux",
        // JSX
        "foo",
      ]);
    });
    it("should skip after the prop name", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = () => {
            console.log(foo.bar.baz.quux);
            console.log(foo.baz.quux);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props, "");
      const lines = getOutputCodeLines(out, "foo");
      const linesBar = getOutputCodeLines(out, "bar");
      const linesBaz = getOutputCodeLines(out, "baz");
      const expected = [
        // bar.baz.quux
        "bar",
        "baz",
        "quux",
        // baz.quux
        "baz",
        "quux",
      ];

      expect(lines).toEqual(expected);
      expect(linesBar).toEqual(expected);
      expect(linesBaz).toEqual(expected);
    });

    it("should skip all with no prop identifier", () => {
      const code = `
        export default function Component() {
          const onClick = () => {
            console.log(invalid.foo.bar.baz.quux);
            console.log(invalid.foo.baz.quux);
          }
          return <div onClick={onClick}>{invalid.foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props);
      const lines = getOutputCodeLines(out, "foo");
      const linesBar = getOutputCodeLines(out, "bar");
      const linesBaz = getOutputCodeLines(out, "baz");
      const expected = [
        // invalid.foo.bar.baz.quux
        "invalid",
        "foo",
        "bar",
        "baz",
        "quux",
        // invalid.foo.baz.quux
        "invalid",
        "foo",
        "baz",
        "quux",
        // invalid.foo
        "invalid",
        "foo",
      ];

      expect(lines).toEqual(expected);
      expect(linesBar).toEqual(expected);
      expect(linesBaz).toEqual(expected);
    });

    it("should skip after PROPS_OPTIMIZATION_IDENTIFIER + prop name", () => {
      const code = `
        export default function Component(${PROPS_OPTIMIZATION_IDENTIFIER}) {
          const onClick = () => {
            console.log(${PROPS_OPTIMIZATION_IDENTIFIER}.foo.bar.baz.quux);
            console.log(${PROPS_OPTIMIZATION_IDENTIFIER}.foo.baz.quux);
          }
          return <div onClick={onClick}>{${PROPS_OPTIMIZATION_IDENTIFIER}.foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props);
      const lines = getOutputCodeLines(out, "foo");
      const linesBar = getOutputCodeLines(out, "bar");
      const linesBaz = getOutputCodeLines(out, "baz");
      const expected = [
        // bar.baz.quux
        "bar",
        "baz",
        "quux",
        // baz.quux
        "baz",
        "quux",
      ];

      expect(lines).toEqual(expected);
      expect(linesBar).toEqual(expected);
      expect(linesBaz).toEqual(expected);
    });
    it("should skip after the props identifier ('props') + prop name", () => {
      const code = `
        export default function Component(props) {
          const onClick = () => {
            console.log(props.foo.bar.baz.quux);
            console.log(props.foo.baz.quux);
          }
          return <div onClick={onClick}>{props.foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props);
      const lines = getOutputCodeLines(out, "foo");
      const linesBar = getOutputCodeLines(out, "bar");
      const linesBaz = getOutputCodeLines(out, "baz");
      const expected = [
        // bar.baz.quux
        "bar",
        "baz",
        "quux",
        // baz.quux
        "baz",
        "quux",
      ];

      expect(lines).toEqual(expected);
      expect(linesBar).toEqual(expected);
      expect(linesBaz).toEqual(expected);
    });
  });

  describe("MemberExpression with default values in multiple levels", () => {
    it("should skip after the prop name", () => {
      const code = `
        export default function Component({foo}) {
          const onClick = () => {
            console.log(((foo ?? {}).bar || {}).baz.quux);
            console.log(((foo ?? {}).baz || {}).quux);
          }
          return <div onClick={onClick}>{foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props, "");
      const lines = getOutputCodeLines(out, "foo");
      const linesBar = getOutputCodeLines(out, "bar");
      const linesBaz = getOutputCodeLines(out, "baz");
      const expected = [
        // bar.baz.quux
        "bar",
        "baz",
        "quux",
        // baz.quux
        "baz",
        "quux",
      ];

      expect(lines).toEqual(expected);
      expect(linesBar).toEqual(expected);
      expect(linesBaz).toEqual(expected);
    });

    it("should skip all with no prop identifier", () => {
      const code = `
        export default function Component() {
          const onClick = () => {
            console.log((((invalid.foo ?? {}).bar || {}).baz ?? {}).quux);
            console.log(((invalid.foo ?? {}).baz || {}).quux);
          }
          return <div onClick={onClick}>{invalid.foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props);
      const lines = getOutputCodeLines(out, "foo");
      const linesBar = getOutputCodeLines(out, "bar");
      const linesBaz = getOutputCodeLines(out, "baz");
      const expected = [
        // invalid.foo.bar.baz.quux
        "invalid",
        "foo",
        "bar",
        "baz",
        "quux",
        // invalid.foo.baz.quux
        "invalid",
        "foo",
        "baz",
        "quux",
        // invalid.foo
        "invalid",
        "foo",
      ];

      expect(lines).toEqual(expected);
      expect(linesBar).toEqual(expected);
      expect(linesBaz).toEqual(expected);
    });

    it("should skip after PROPS_OPTIMIZATION_IDENTIFIER + prop name", () => {
      const code = `
        export default function Component(${PROPS_OPTIMIZATION_IDENTIFIER}) {
          const onClick = () => {
            console.log((((${PROPS_OPTIMIZATION_IDENTIFIER}.foo ?? {}).bar || {}).baz ?? {}).quux);
            console.log(((${PROPS_OPTIMIZATION_IDENTIFIER}.foo ?? {}).baz || {}).quux);
          }
          return <div onClick={onClick}>{${PROPS_OPTIMIZATION_IDENTIFIER}.foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props);
      const lines = getOutputCodeLines(out, "foo");
      const linesBar = getOutputCodeLines(out, "bar");
      const linesBaz = getOutputCodeLines(out, "baz");
      const expected = [
        // bar.baz.quux
        "bar",
        "baz",
        "quux",
        // baz.quux
        "baz",
        "quux",
      ];

      expect(lines).toEqual(expected);
      expect(linesBar).toEqual(expected);
      expect(linesBaz).toEqual(expected);
    });

    it("should skip after the props identifier ('props') + prop name", () => {
      const code = `
        export default function Component(props) {
          const onClick = () => {
            console.log(((props.foo ?? {}).bar || {}).baz.quux);
            console.log(((props.foo ?? {}).baz || {}).quux);
          }
          return <div onClick={onClick}>{props.foo}</div>;
        }
      `;
      const props = new Set(["foo"]);
      const out = applySkipTest(code, props);
      const lines = getOutputCodeLines(out, "foo");
      const linesBar = getOutputCodeLines(out, "bar");
      const linesBaz = getOutputCodeLines(out, "baz");
      const expected = [
        // bar.baz.quux
        "bar",
        "baz",
        "quux",
        // baz.quux
        "baz",
        "quux",
      ];

      expect(lines).toEqual(expected);
      expect(linesBar).toEqual(expected);
      expect(linesBaz).toEqual(expected);
    });
  });

  describe("Other cases", () => {
    it('should skip "state" method when the props.state is used', () => {
      const code = `
        export default function Component(props, {state}) {
          const foo = state();

          function onClick() {
            console.log(props.state);
          }

          return null;
        }
      `;
      const props = new Set(["state"]);
      const out = applySkipTest(code, props);
      const lines = getOutputCodeLines(out, "state");

      expect(lines).toEqual(["foo", "state"]);
    });
  });
});

const AVOIDED_TYPES = new Set([
  "Identifier",
  "VariableDeclarator",
  "Property",
  "RestElement",
  "ObjectPattern",
  "ArrayPattern",
]);

function applySkipTest(
  inputCode: string,
  props: Set<string>,
  propsIdentifier: string = "props",
  standaloneProps: Set<string> = new Set(),
) {
  const ast = parseCodeToAST(inputCode);
  const [component] = getWebComponentAst(ast);
  const declaration = (component as any)?.declarations?.[0];
  const componentBody = component?.body ?? declaration?.init.body;
  return JSON.stringify(
    componentBody,
    skipPropTransformation(
      componentBody,
      props,
      propsIdentifier,
      standaloneProps,
    ),
  );
}

function getOutputCodeLines(out: string, byProp: string) {
  const skipped: any[] = [];

  JSON.parse(out, displaySkippedParts);

  function displaySkippedParts(this: any, key: string, value: any) {
    const isArrowWithoutBlockStatement =
      this?.type === "ArrowFunctionExpression" &&
      value?.type !== "BlockStatement";

    if (
      (isArrowWithoutBlockStatement || Array.isArray(this)) &&
      !AVOIDED_TYPES.has(value?.type) &&
      value?._skip?.includes(byProp)
    ) {
      skipped.push(value);
    }

    const AVOIDED_NAMES_FOR_READABILITY = new Set([
      "console",
      "log",
      "test",
      "onClick",
      "jsxDEV",
      "children",
      "undefined",
    ]);

    if (
      value?.type === "Identifier" &&
      value?._force_skip &&
      // Avoid console.log to improve the tests readability
      !AVOIDED_NAMES_FOR_READABILITY.has(value?.name)
    ) {
      skipped.push(value);
    }
    return value;
  }

  return skipped.map((node) => normalizeQuotes(generateCodeFromAST(node)));
}
