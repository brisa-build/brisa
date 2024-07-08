import { normalizeQuotes } from "@/helpers";
import AST from "@/utils/ast";
import getWebComponentAst from "@/utils/client-build-plugin/get-web-component-ast";
import skipPropTransformation from "@/utils/client-build-plugin/skip-prop-transformation";
import { describe, expect, it } from "bun:test";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");

describe("client-build-plugin/skip-prop-transformation", () => {
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
      const out = applySkipTest(code, props);
      const lines = getOutputCodeLines(out, "foo");

      expect(lines).toEqual(["console.log(foo);"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        "console.log(foo);",
        "const {bar} = 2;",
        "console.log(bar);",
        "const {baz} = 3;",
        "console.log(baz);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        "console.log(bar);",
        "const {baz} = 3;",
        "console.log(baz);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual(["console.log(baz);"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Inner scope:
        "const {bar} = 2;",
        "console.log(bar);",
        // Outer scope:
        "const test = () => {const {bar} = 2;console.log(bar);};",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
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
      const out = applySkipTest(code, props);
      const lines = getOutputCodeLines(out, "foo");

      expect(lines).toEqual(["console.log(foo);"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        "console.log(foo);",
        "const [bar] = 2;",
        "console.log(bar);",
        "const [baz] = 3;",
        "console.log(baz);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        "console.log(bar);",
        "const [baz] = 3;",
        "console.log(baz);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual(["console.log(baz);"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Inner scope:
        "const [bar] = 2;",
        "console.log(bar);",
        // Outer scope:
        "const test = () => {const [bar] = 2;console.log(bar);};",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toBeEmpty();
      expect(getOutputCodeLines(out, "bar")).toEqual(["console.log(bar);"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        "console.log(bar);",
        "const {bar: {baz}} = 2;",
        "console.log(baz);",
        "const {baz: {foo}} = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        "console.log(baz);",
        "const {baz: {foo}} = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "foo")).toEqual(["console.log(foo);"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toBeEmpty();

      expect(getOutputCodeLines(out, "bar")).toEqual([
        // Inner scope:
        "const {bar: {baz}} = 2;",
        "console.log(baz);",

        // Outer scope:
        "const test = () => {const {bar: {baz}} = 2;console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toBeEmpty();
      expect(getOutputCodeLines(out, "bar")).toEqual(["console.log(bar);"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        "console.log(bar);",
        "const [{baz}] = 2;",
        "console.log(baz);",
        "const [{foo}] = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        "console.log(baz);",
        "const [{foo}] = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "foo")).toEqual(["console.log(foo);"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toBeEmpty();
      expect(getOutputCodeLines(out, "bar")).toEqual([
        // Inner scope:
        "const [{baz}] = 2;",
        "console.log(baz);",

        // Outer scope:
        "const test = () => {const [{baz}] = 2;console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual(["console.log(bar);"]);
      expect(getOutputCodeLines(out, "bar")).toEqual(["console.log(bar);"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        "console.log(bar);",
        "const {...baz} = 2;",
        "console.log(baz);",
        "const {...foo} = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        "console.log(baz);",
        "const {...foo} = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "foo")).toEqual(["console.log(foo);"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Inner scope:
        "const {bar, ...baz} = 2;",
        "console.log(baz);",

        // Outer scope:
        "const test = () => {const {bar, ...baz} = 2;console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        // Inner scope:
        "const {bar, ...baz} = 2;",
        "console.log(baz);",

        // Outer scope:
        "const test = () => {const {bar, ...baz} = 2;console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual(["console.log(bar);"]);
      expect(getOutputCodeLines(out, "bar")).toEqual(["console.log(bar);"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        "console.log(bar);",
        "const [...baz] = 2;",
        "console.log(baz);",
        "const [...foo] = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        "console.log(baz);",
        "const [...foo] = 3;",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "foo")).toEqual(["console.log(foo);"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Inner scope:
        "const [bar, ...baz] = 2;",
        "console.log(baz);",

        // Outer scope:
        "const test = () => {const [bar, ...baz] = 2;console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        // Inner scope:
        "const [bar, ...baz] = 2;",
        "console.log(baz);",

        // Outer scope:
        "const test = () => {const [bar, ...baz] = 2;console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
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
      const out = applySkipTest(code, props);
      const lines = getOutputCodeLines(out, "foo");

      expect(lines).toEqual(["console.log(foo);"]);
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
      const out = applySkipTest(code, props);
      const expected = [
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Inner scope:
        "console.log(bar);",

        // Outer scope:
        "const test = bar => {console.log(bar);};",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
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
      const out = applySkipTest(code, props);
      const lines = getOutputCodeLines(out, "foo");

      expect(lines).toEqual(["console.log(foo);"]);
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
      const out = applySkipTest(code, props);
      const expected = [
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Inner scope:
        "console.log(bar);",

        // Outer scope:
        "function test({bar}) {console.log(bar);}",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toBeEmpty();
      expect(getOutputCodeLines(out, "bar")).toEqual(["console.log(bar);"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toBeEmpty();
      expect(getOutputCodeLines(out, "bar")).toEqual([
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toBeEmpty();
      expect(getOutputCodeLines(out, "bar")).toEqual([
        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        "const test = ({bar: {baz}}) => {console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        // Inner scope:
        "console.log(baz);",
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual(["console.log(bar);"]);
      expect(getOutputCodeLines(out, "bar")).toEqual(["console.log(bar);"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toBeEmpty();
      expect(getOutputCodeLines(out, "bar")).toEqual([
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        "const test = ({bar, ...baz}) => {console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        "const test = ({bar, ...baz}) => {console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
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
      const out = applySkipTest(code, props);
      const lines = getOutputCodeLines(out, "foo");

      expect(lines).toEqual(["console.log(foo)"]);
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
      const out = applySkipTest(code, props);
      const expected = [
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Inner scope:
        "console.log(bar);",

        // Outer scope:
        "const test = bar => {console.log(bar);};",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
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
      const out = applySkipTest(code, props);
      const lines = getOutputCodeLines(out, "foo");

      expect(lines).toEqual(["console.log(foo)"]);
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
      const out = applySkipTest(code, props);
      const expected = [
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Inner scope:
        "console.log(bar);",

        // Outer scope:
        "const test = ({bar}) => {console.log(bar);};",
        "console.log(foo);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toBeEmpty();
      expect(getOutputCodeLines(out, "bar")).toEqual(["console.log(bar)"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toBeEmpty();
      expect(getOutputCodeLines(out, "bar")).toEqual([
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toBeEmpty();
      expect(getOutputCodeLines(out, "bar")).toEqual([
        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        "const test = ({bar: {baz}}) => {console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual(["console.log(baz);"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual(["console.log(bar)"]);
      expect(getOutputCodeLines(out, "bar")).toEqual(["console.log(bar)"]);
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toBeEmpty();
      expect(getOutputCodeLines(out, "bar")).toEqual([
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
      const out = applySkipTest(code, props);

      expect(getOutputCodeLines(out, "foo")).toEqual([
        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        "const test = ({bar, ...baz}) => {console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "bar")).toEqual([
        // Inner scope:
        "console.log(baz);",

        // Outer scope:
        "const test = ({bar, ...baz}) => {console.log(baz);};",
        "console.log(bar);",
      ]);

      expect(getOutputCodeLines(out, "baz")).toEqual([
        // Inner scope:
        "console.log(baz);",
      ]);
    });
  });
});

const AVOIDED_TYPES = new Set([
  "Identifier",
  "VariableDeclarator",
  "Property",
  "RestElement",
  "ObjectPattern",
]);

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
    return value;
  }

  return skipped.map((node) => normalizeQuotes(generateCodeFromAST(node)));
}
