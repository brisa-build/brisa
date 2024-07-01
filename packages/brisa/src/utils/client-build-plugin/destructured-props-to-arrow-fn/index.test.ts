import AST from "@/utils/ast";
import destructuredPropsToArrowFn from "@/utils/client-build-plugin/destructured-props-to-arrow-fn";
import { describe, expect, it } from "bun:test";

const { parseCodeToAST } = AST("tsx");

const BATTERY_TESTS: any = [
  // Basic patterns
  ["{ b: { d: [foo] } }", ["() => b.d[0]"]],
  ["{a, b: [b = 1, c = 2]}", ["() => b[0] ?? 1", "() => b[1] ?? 2"]],

  // Ignore first level
  ["[a, b, c]", []],
  ["[...rest]", []],
  ["[foo, ...rest]", []],
  ["{ a, b, ...rest }", []],

  // Rest in nested level array
  ["{ w: { x: [b, ...foo] } }", ["() => w.x[0]", "() => w.x.slice(1)"]],
  [
    "{ a: { 'b-c': [d, ...e] } }",
    ['() => a["b-c"][0]', '() => a["b-c"].slice(1)'],
  ],
  ["{ a: { 1: [d, ...e] } }", ['() => a["1"][0]', '() => a["1"].slice(1)']],
  [
    "{ w: { x: [b, ...foo], y: { z } } }",
    ["() => w.x[0]", "() => w.x.slice(1)", "() => w.y.z"],
  ],
  [
    "{ w: { x: [[b], ...foo], y: { z } } }",
    ["() => w.x[0][0]", "() => w.x.slice(1)", "() => w.y.z"],
  ],

  // Rest in nested level object
  [
    "{ w: { x: { y, ...foo } } }",
    ["() => w.x.y", "() => { let {y, ...foo} = w.x; return foo}"],
  ],
  [
    "{ w: { x: { y, ...foo }, z } }",
    ["() => w.x.y", "() => { let {y, ...foo} = w.x; return foo}", "() => w.z"],
  ],
  [
    "{ w: { x: { y, z, a, b, ...foo }, t } }",
    [
      "() => w.x.y",
      "() => w.x.z",
      "() => w.x.a",
      "() => w.x.b",
      "() => { let {y, z, a, b, ...foo} = w.x; return foo}",
      "() => w.t",
    ],
  ],
  [
    "{ w: { x: [{ y: { f }, z, ...foo }], t } }",
    [
      "() => w.x[0].y.f",
      "() => w.x[0].z",
      "() => { let {y, z, ...foo} = w.x[0]; return foo}",
      "() => w.t",
    ],
  ],

  // Default values
  ["{ a = 1, b = 2, c = 3 }", []],
  ["{ a: { b = 1, c = 2 } }", ["() => a.b ?? 1", "() => a.c ?? 2"]],
  ['{ a: { b = "1", c = "2" } }', ['() => a.b ?? "1"', '() => a.c ?? "2"']],
  [
    '{ a: [{ b: {c = "3" }}], d, f: { g = "5" }}',
    ['() => a[0].b.c ?? "3"', '() => f.g ?? "5"'],
  ],
  ["{ w: { x: { y: { z = 1 } } } }", ["() => w.x.y.z ?? 1"]],
  [
    "{ w: { x: [{ y: { f = 'bar' }, z = 'baz', ...foo }], t } }",
    [
      `() => w.x[0].y.f ?? "bar"`,
      `() => w.x[0].z ?? "baz"`,
      "() => { let {y, z, ...foo} = w.x[0]; return foo}",
      "() => w.t",
    ],
  ],
] as const;

describe("AST", () => {
  describe.each(BATTERY_TESTS)(
    "destructuredPropsToArrowFn",
    (input, expected, options) => {
      it(`should transform ${input} to ${expected.join(", ")}`, () => {
        const patternString = `function test(${input}){}`;
        const ast = parseCodeToAST(patternString) as any;
        const pattern = ast.body[0].declarations[0].init.params[0];
        const result = destructuredPropsToArrowFn(pattern, options);

        expect(result).toEqual(expected);
      });
    },
  );
});
