import { normalizeQuotes } from "@/helpers";
import AST from "@/utils/ast";
import destructuredPropsToArrowFn from "@/utils/client-build-plugin/destructured-props-to-arrow-fn";
import { describe, expect, it } from "bun:test";

const { parseCodeToAST } = AST("tsx");

const BATTERY_TESTS: any = [
  // Basic patterns
  ["{ b: { d: [foo] } }", ["() => b.value.d[0]"]],
  [
    "{a, b: [b = 1, c = 2]}",
    ["() => b.value[0] ?? 1", "() => b.value[1] ?? 2"],
  ],

  // Ignore first level
  ["[a, b, c]", []],
  ["[...rest]", []],
  ["[foo, ...rest]", []],
  ["{ a, b, ...rest }", []],
  ["{ a = 1, b = 2, c = 3 }", []],

  // Rest in nested level array
  [
    "{ w: { x: [b, ...foo] } }",
    ["() => w.value.x[0]", "() => w.value.x.slice(1)"],
  ],
  [
    "{ a: { 'b-c': [d, ...e] } }",
    ['() => a.value["b-c"][0]', '() => a.value["b-c"].slice(1)'],
  ],
  [
    "{ a: { 1: [d, ...e] } }",
    ['() => a.value["1"][0]', '() => a.value["1"].slice(1)'],
  ],
  [
    "{ w: { x: [b, ...foo], y: { z } } }",
    ["() => w.value.x[0]", "() => w.value.x.slice(1)", "() => w.value.y.z"],
  ],
  [
    "{ w: { x: [[b], ...foo], y: { z } } }",
    ["() => w.value.x[0][0]", "() => w.value.x.slice(1)", "() => w.value.y.z"],
  ],

  // Rest in nested level object
  [
    "{ w: { x: { y, ...foo } } }",
    ["() => w.value.x.y", "() => { let {y, ...foo} = w.value.x; return foo}"],
  ],
  [
    "{ w: { x: { y, ...foo }, z } }",
    [
      "() => w.value.x.y",
      "() => { let {y, ...foo} = w.value.x; return foo}",
      "() => w.value.z",
    ],
  ],
  [
    "{ w: { x: { y, z, a, b, ...foo }, t } }",
    [
      "() => w.value.x.y",
      "() => w.value.x.z",
      "() => w.value.x.a",
      "() => w.value.x.b",
      "() => { let {y, z, a, b, ...foo} = w.value.x; return foo}",
      "() => w.value.t",
    ],
  ],
  [
    "{ w: { x: [{ y: { f }, z, ...foo }], t } }",
    [
      "() => w.value.x[0].y.f",
      "() => w.value.x[0].z",
      "() => { let {y, z, ...foo} = w.value.x[0]; return foo}",
      "() => w.value.t",
    ],
  ],

  // Default values
  [
    "{ a = 1, b: { c, d } } = { c: 2, b: { c: 3, d: 4} }",
    ["() => (b.value ?? {c: 3,d: 4}).c", "() => (b.value ?? {c: 3,d: 4}).d"],
  ],
  [
    "{ a = 1, b: [c, d] } = { c: 2, b: [3, 4] }",
    ["() => (b.value ?? [3, 4])[0]", "() => (b.value ?? [3, 4])[1]"],
  ],
  [
    "{ a = 1, b: { c, d = { f: 2 } } }",
    ["() => b.value.c", "() => b.value.d ?? {f: 2}"],
  ],
  [
    "{ a = 1, b: { c, d = {f: 'test'} } }",
    ["() => b.value.c", '() => b.value.d ?? {f: "test"}'],
  ],
  [
    "{ a = '1', b: { c, d } } = { c: '2', b: { c: '3', d: '4'} }",
    [
      "() => (b.value ?? {c: '3',d: '4'}).c",
      "() => (b.value ?? {c: '3',d: '4'}).d",
    ],
  ],
  [
    "{ a = 1, b: { c, ...rest } = { c: 2, d: 3 } }",
    [
      "() => (b.value ?? {c: 2,d: 3}).c",
      "() => { let {c, ...rest} = (b.value ?? {c: 2,d: 3}); return rest}",
    ],
  ],
  [
    "{ a = 1, b: [c, ...rest] = [2, 3] }",
    ["() => (b.value ?? [2, 3])[0]", "() => (b.value ?? [2, 3]).slice(1)"],
  ],
  [
    "{ a = 1, b: { c, ...rest } = { c: '2', d: '3' } }",
    [
      `() => (b.value ?? {c: '2',d: '3'}).c`,
      "() => { let {c, ...rest} = (b.value ?? {c: '2',d: '3'}); return rest}",
    ],
  ],
  ["{ a: { b = 1, c = 2 } }", ["() => a.value.b ?? 1", "() => a.value.c ?? 2"]],
  [
    '{ a: { b = "1", c = "2" } }',
    ['() => a.value.b ?? "1"', '() => a.value.c ?? "2"'],
  ],
  [
    '{ a: [{ b: {c = "3" }}], d, f: { g = "5" }}',
    ['() => a.value[0].b.c ?? "3"', '() => f.value.g ?? "5"'],
  ],
  ["{ w: { x: { y: { z = 1 } } } }", ["() => w.value.x.y.z ?? 1"]],
  [
    "{ w: { x: [{ y: { f = 'bar' }, z = 'baz', ...foo }], t } }",
    [
      `() => w.value.x[0].y.f ?? "bar"`,
      `() => w.value.x[0].z ?? "baz"`,
      "() => { let {y, z, ...foo} = w.value.x[0]; return foo}",
      "() => w.value.t",
    ],
  ],

  // Default values from other params (using value from top level)
  [
    "{ a = 1, b: { c = a, d = 2 } }",
    ["() => b.value.c ?? a.value", "() => b.value.d ?? 2"],
  ],
  [
    "{ a: foo, b: { c = foo, d = 2 } }",
    ["() => b.value.c ?? foo.value", "() => b.value.d ?? 2"],
  ],
  [
    "{ a: { b: { c = z, d = y } }, y, z }",
    ["() => a.value.b.c ?? z.value", "() => a.value.b.d ?? y.value"],
  ],
  [
    "{ a: { b: { c = d, d = 5 } } }",
    ["() => a.value.b.c ?? d.value", "() => a.value.b.d ?? 5"],
  ],

  // Default values from external identifiers (show not add the .value)
  [
    "{ a: { b: { c = foo, d = 5 } } }",
    ["() => a.value.b.c ?? foo", "() => a.value.b.d ?? 5"],
  ],
  [
    "{ a: { b: { c = foo(), d = 5 } } }",
    ["() => a.value.b.c ?? foo()", "() => a.value.b.d ?? 5"],
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

        expect(result.map(normalizeQuotes)).toEqual(
          expected.map(normalizeQuotes),
        );
      });
    },
  );
});
