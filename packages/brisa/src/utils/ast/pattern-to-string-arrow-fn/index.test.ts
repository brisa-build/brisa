import AST from "@/utils/ast";
import patternToStringArrowFn from "@/utils/ast/pattern-to-string-arrow-fn";
import { describe, expect, it } from "bun:test";

const { parseCodeToAST } = AST("tsx");

const options1 = { skipFirstLevel: false };
const BATTERY_OF_TESTS: any = [
  // Basic patterns
  ["[a, b, c]", ["() => a", "() => b", "() => c"], options1],
  ["{ b: { d: [foo] } }", ["() => b.d[0]"], options1],

  // Rest in first object level is not transformed
  ["[...rest]", ["() => rest"]],
  ["[foo, ...rest]", ["() => foo", "() => rest"], options1],
  ["{ a, b, ...rest }", ["() => a", "() => b", "() => rest"], options1],

  // Rest in nested level array
  [
    "{ w: { x: [b, ...foo] } }",
    ["() => w.x[0]", "() => w.x.slice(1)"],
    options1,
  ],
  [
    "{ w: { x: [b, ...foo], y: { z } } }",
    ["() => w.x[0]", "() => w.x.slice(1)", "() => w.y.z"],
    options1,
  ],
  [
    "{ w: { x: [[b], ...foo], y: { z } } }",
    ["() => w.x[0][0]", "() => w.x.slice(1)", "() => w.y.z"],
    options1,
  ],

  // Rest in nested level object
  [
    "{ w: { x: { y, ...foo } } }",
    ["() => w.x.y", "() => { let {y, ...foo} = w.x; return foo}"],
    options1,
  ],
  [
    "{ w: { x: { y, ...foo }, z } }",
    ["() => w.x.y", "() => { let {y, ...foo} = w.x; return foo}", "() => w.z"],
    options1,
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
    options1,
  ],
  [
    "{ w: { x: [{ y: { f }, z, ...foo }], t } }",
    [
      "() => w.x[0].y.f",
      "() => w.x[0].z",
      "() => { let {y, z, ...foo} = w.x[0]; return foo}",
      "() => w.t",
    ],
    options1,
  ],

  // Default values
  [
    "{ a = 1, b = 2, c = 3 }",
    ["() => a ?? 1", "() => b ?? 2", "() => c ?? 3"],
    options1,
  ],
  [
    '{ a: { b = "1", c = "2" } }',
    ['() => a.b ?? "1"', '() => a.c ?? "2"'],
    options1,
  ],
  ["{ a: { b = 1, c = 2 } }", ["() => a.b ?? 1", "() => a.c ?? 2"], options1],
  [
    '{ a: [{ b: {c = "3" }}], d, f: { g = "5" }}',
    ['() => a[0].b.c ?? "3"', "() => d", '() => f.g ?? "5"'],
    options1,
  ],
  ["{ w: { x: { y: { z = 1 } } } }", ["() => w.x.y.z ?? 1"], options1],
  [
    "{ w: { x: [{ y: { f = 'bar' }, z = 'baz', ...foo }], t } }",
    [
      `() => w.x[0].y.f ?? "bar"`,
      `() => w.x[0].z ?? "baz"`,
      "() => { let {y, z, ...foo} = w.x[0]; return foo}",
      "() => w.t",
    ],
    options1,
  ],
] as const;

const options2 = { skipFirstLevel: true };
const BATTERY_OF_TESTS_SKIP_LEVEL_1: any = [
  // Basic patterns
  ["{ b: { d: [foo] } }", ["() => b.d[0]"], options2],

  // Ignore first level
  ["[a, b, c]", [], options2],
  ["[...rest]", [], options2],
  ["[foo, ...rest]", [], options2],
  ["{ a, b, ...rest }", [], options2],

  // Rest in nested level array
  [
    "{ w: { x: [b, ...foo] } }",
    ["() => w.x[0]", "() => w.x.slice(1)"],
    options2,
  ],
  [
    "{ w: { x: [b, ...foo], y: { z } } }",
    ["() => w.x[0]", "() => w.x.slice(1)", "() => w.y.z"],
    options2,
  ],
  [
    "{ w: { x: [[b], ...foo], y: { z } } }",
    ["() => w.x[0][0]", "() => w.x.slice(1)", "() => w.y.z"],
    options2,
  ],

  // Rest in nested level object
  [
    "{ w: { x: { y, ...foo } } }",
    ["() => w.x.y", "() => { let {y, ...foo} = w.x; return foo}"],
    options2,
  ],
  [
    "{ w: { x: { y, ...foo }, z } }",
    ["() => w.x.y", "() => { let {y, ...foo} = w.x; return foo}", "() => w.z"],
    options2,
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
    options2,
  ],
  [
    "{ w: { x: [{ y: { f }, z, ...foo }], t } }",
    [
      "() => w.x[0].y.f",
      "() => w.x[0].z",
      "() => { let {y, z, ...foo} = w.x[0]; return foo}",
      "() => w.t",
    ],
    options2,
  ],

  // Default values
  ["{ a = 1, b = 2, c = 3 }", [], options2],
  ["{ a: { b = 1, c = 2 } }", ["() => a.b ?? 1", "() => a.c ?? 2"], options2],
  [
    '{ a: { b = "1", c = "2" } }',
    ['() => a.b ?? "1"', '() => a.c ?? "2"'],
    options2,
  ],
  [
    '{ a: [{ b: {c = "3" }}], d, f: { g = "5" }}',
    ['() => a[0].b.c ?? "3"', '() => f.g ?? "5"'],
    options2,
  ],
  ["{ w: { x: { y: { z = 1 } } } }", ["() => w.x.y.z ?? 1"], options2],
  [
    "{ w: { x: [{ y: { f = 'bar' }, z = 'baz', ...foo }], t } }",
    [
      `() => w.x[0].y.f ?? "bar"`,
      `() => w.x[0].z ?? "baz"`,
      "() => { let {y, z, ...foo} = w.x[0]; return foo}",
      "() => w.t",
    ],
    options2,
  ],
] as const;

const ALL_BATERY_OF_TESTS = [
  ...BATTERY_OF_TESTS,
  ...BATTERY_OF_TESTS_SKIP_LEVEL_1,
];

describe("AST", () => {
  describe.each(ALL_BATERY_OF_TESTS)(
    "patternToExpressions",
    (input, expected, options) => {
      it(`should transform ${input} to ${expected.join(", ")}`, () => {
        const patternString = `function test(${input}){}`;
        const ast = parseCodeToAST(patternString) as any;
        const pattern = ast.body[0].declarations[0].init.params[0];
        const result = patternToStringArrowFn(pattern, options);

        expect(result).toEqual(expected);
      });
    },
  );
});
