import { normalizeQuotes } from "@/helpers";
import AST from "@/utils/ast";
import destructuredPropsToArrowFn from "@/utils/client-build-plugin/destructured-props-to-arrow-fn";
import { describe, expect, it } from "bun:test";

const { parseCodeToAST } = AST("tsx");

const TESTS = [
  // Basic patterns
  {
    param: "{ b: { d: [foo] } }",
    expected: [
      {
        name: "foo",
        arrow: "() => b.value.d[0]",
      },
    ],
    expectedWithPrefix: [
      {
        name: "foo",
        arrow: "() => _derived_b.value.d[0]",
      },
    ],
  },
  {
    param: "{a, b: [b = 1, c = 2]}",
    expected: [
      {
        name: "b",
        arrow: "() => b.value[0] ?? 1",
      },
      {
        name: "c",
        arrow: "() => b.value[1] ?? 2",
      },
    ],
    expectedWithPrefix: [
      {
        name: "b",
        arrow: "() => _derived_b.value[0] ?? 1",
      },
      {
        name: "c",
        arrow: "() => _derived_b.value[1] ?? 2",
      },
    ],
  },

  // Ignore first level
  {
    param: "[a, b, c]",
    expected: [],
    expectedWithPrefix: [],
  },
  {
    param: "[...rest]",
    expected: [],
    expectedWithPrefix: [],
  },
  {
    param: "[foo, ...rest]",
    expected: [],
    expectedWithPrefix: [],
  },
  {
    param: "{ a, b, ...rest }",
    expected: [],
    expectedWithPrefix: [],
  },
  {
    param: "{ a = 1, b = 2, c = 3 }",
    expected: [],
    expectedWithPrefix: [],
  },

  // Rest in nested level array
  {
    param: "{ w: { x: [b, ...foo] } }",
    expected: [
      {
        name: "b",
        arrow: "() => w.value.x[0]",
      },
      {
        name: "foo",
        arrow: "() => w.value.x.slice(1)",
      },
    ],
    expectedWithPrefix: [
      {
        name: "b",
        arrow: "() => _derived_w.value.x[0]",
      },
      {
        name: "foo",
        arrow: "() => _derived_w.value.x.slice(1)",
      },
    ],
  },
  {
    param: "{ a: { 'b-c': [d, ...e] } }",
    expected: [
      {
        name: "d",
        arrow: "() => a.value['b-c'][0]",
      },
      {
        name: "e",
        arrow: "() => a.value['b-c'].slice(1)",
      },
    ],
    expectedWithPrefix: [
      {
        name: "d",
        arrow: "() => _derived_a.value['b-c'][0]",
      },
      {
        name: "e",
        arrow: "() => _derived_a.value['b-c'].slice(1)",
      },
    ],
  },
  {
    param: "{ a: { 1: [d, ...e] } }",
    expected: [
      {
        name: "d",
        arrow: "() => a.value['1'][0]",
      },
      {
        name: "e",
        arrow: "() => a.value['1'].slice(1)",
      },
    ],
    expectedWithPrefix: [
      {
        name: "d",
        arrow: "() => _derived_a.value['1'][0]",
      },
      {
        name: "e",
        arrow: "() => _derived_a.value['1'].slice(1)",
      },
    ],
  },
  {
    param: "{ w: { x: [b, ...foo], y: { z } } }",
    expected: [
      {
        name: "b",
        arrow: "() => w.value.x[0]",
      },
      {
        name: "foo",
        arrow: "() => w.value.x.slice(1)",
      },
      {
        name: "z",
        arrow: "() => w.value.y.z",
      },
    ],
    expectedWithPrefix: [
      {
        name: "b",
        arrow: "() => _derived_w.value.x[0]",
      },
      {
        name: "foo",
        arrow: "() => _derived_w.value.x.slice(1)",
      },
      {
        name: "z",
        arrow: "() => _derived_w.value.y.z",
      },
    ],
  },
  {
    param: "{ w: { x: [[b], ...foo], y: { z } } }",
    expected: [
      {
        name: "b",
        arrow: "() => w.value.x[0][0]",
      },
      {
        name: "foo",
        arrow: "() => w.value.x.slice(1)",
      },
      {
        name: "z",
        arrow: "() => w.value.y.z",
      },
    ],
    expectedWithPrefix: [
      {
        name: "b",
        arrow: "() => _derived_w.value.x[0][0]",
      },
      {
        name: "foo",
        arrow: "() => _derived_w.value.x.slice(1)",
      },
      {
        name: "z",
        arrow: "() => _derived_w.value.y.z",
      },
    ],
  },

  // Rest in nested level object
  {
    param: "{ w: { x: { y, ...foo } } }",
    expected: [
      {
        name: "y",
        arrow: "() => w.value.x.y",
      },
      {
        name: "foo",
        arrow: "() => { let {y, ...foo} = w.value.x; return foo}",
      },
    ],
    expectedWithPrefix: [
      {
        name: "y",
        arrow: "() => _derived_w.value.x.y",
      },
      {
        name: "foo",
        arrow: "() => { let {y, ...foo} = _derived_w.value.x; return foo}",
      },
    ],
  },
  {
    param: "{ w: { x: { y, ...foo }, z } }",
    expected: [
      {
        name: "y",
        arrow: "() => w.value.x.y",
      },
      {
        name: "foo",
        arrow: "() => { let {y, ...foo} = w.value.x; return foo}",
      },
      {
        name: "z",
        arrow: "() => w.value.z",
      },
    ],
    expectedWithPrefix: [
      {
        name: "y",
        arrow: "() => _derived_w.value.x.y",
      },
      {
        name: "foo",
        arrow: "() => { let {y, ...foo} = _derived_w.value.x; return foo}",
      },
      {
        name: "z",
        arrow: "() => _derived_w.value.z",
      },
    ],
  },
  {
    param: "{ w: { x: { y, z, a, b, ...foo }, t } }",
    expected: [
      {
        name: "y",
        arrow: "() => w.value.x.y",
      },
      {
        name: "z",
        arrow: "() => w.value.x.z",
      },
      {
        name: "a",
        arrow: "() => w.value.x.a",
      },
      {
        name: "b",
        arrow: "() => w.value.x.b",
      },
      {
        name: "foo",
        arrow: "() => { let {y, z, a, b, ...foo} = w.value.x; return foo}",
      },
      {
        name: "t",
        arrow: "() => w.value.t",
      },
    ],
    expectedWithPrefix: [
      {
        name: "y",
        arrow: "() => _derived_w.value.x.y",
      },
      {
        name: "z",
        arrow: "() => _derived_w.value.x.z",
      },
      {
        name: "a",
        arrow: "() => _derived_w.value.x.a",
      },
      {
        name: "b",
        arrow: "() => _derived_w.value.x.b",
      },
      {
        name: "foo",
        arrow:
          "() => { let {y, z, a, b, ...foo} = _derived_w.value.x; return foo}",
      },
      {
        name: "t",
        arrow: "() => _derived_w.value.t",
      },
    ],
  },
  {
    param: "{ w: { x: [{ y: { f }, z, ...foo }], t } }",
    expected: [
      {
        name: "f",
        arrow: "() => w.value.x[0].y.f",
      },
      {
        name: "z",
        arrow: "() => w.value.x[0].z",
      },
      {
        name: "foo",
        arrow: "() => { let {y, z, ...foo} = w.value.x[0]; return foo}",
      },
      {
        name: "t",
        arrow: "() => w.value.t",
      },
    ],
    expectedWithPrefix: [
      {
        name: "f",
        arrow: "() => _derived_w.value.x[0].y.f",
      },
      {
        name: "z",
        arrow: "() => _derived_w.value.x[0].z",
      },
      {
        name: "foo",
        arrow:
          "() => { let {y, z, ...foo} = _derived_w.value.x[0]; return foo}",
      },
      {
        name: "t",
        arrow: "() => _derived_w.value.t",
      },
    ],
  },

  // Default values
  {
    param: "{ a = 1, b: { c, d } } = { c: 2, b: { c: 3, d: 4} }",
    expected: [
      {
        name: "c",
        arrow: "() => (b.value ?? {c: 3,d: 4}).c",
      },
      {
        name: "d",
        arrow: "() => (b.value ?? {c: 3,d: 4}).d",
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: "() => (_derived_b.value ?? {c: 3,d: 4}).c",
      },
      {
        name: "d",
        arrow: "() => (_derived_b.value ?? {c: 3,d: 4}).d",
      },
    ],
  },
  {
    param: "{ a = 1, b: [c, d] } = { c: 2, b: [3, 4] }",
    expected: [
      {
        name: "c",
        arrow: "() => (b.value ?? [3, 4])[0]",
      },
      {
        name: "d",
        arrow: "() => (b.value ?? [3, 4])[1]",
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: "() => (_derived_b.value ?? [3, 4])[0]",
      },
      {
        name: "d",
        arrow: "() => (_derived_b.value ?? [3, 4])[1]",
      },
    ],
  },
  {
    param: "{ a = 1, b: { c, d = { f: 2 } } }",
    expected: [
      {
        name: "c",
        arrow: "() => b.value.c",
      },
      {
        name: "d",
        arrow: "() => b.value.d ?? {f: 2}",
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: "() => _derived_b.value.c",
      },
      {
        name: "d",
        arrow: "() => _derived_b.value.d ?? {f: 2}",
      },
    ],
  },
  {
    param: "{ a = 1, b: { c, d = {f: 'test'} } }",
    expected: [
      {
        name: "c",
        arrow: "() => b.value.c",
      },
      {
        name: "d",
        arrow: '() => b.value.d ?? {f: "test"}',
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: "() => _derived_b.value.c",
      },
      {
        name: "d",
        arrow: '() => _derived_b.value.d ?? {f: "test"}',
      },
    ],
  },
  {
    param: "{ a = '1', b: { c, d } } = { c: '2', b: { c: '3', d: '4'} }",
    expected: [
      {
        name: "c",
        arrow: "() => (b.value ?? {c: '3',d: '4'}).c",
      },
      {
        name: "d",
        arrow: "() => (b.value ?? {c: '3',d: '4'}).d",
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: "() => (_derived_b.value ?? {c: '3',d: '4'}).c",
      },
      {
        name: "d",
        arrow: "() => (_derived_b.value ?? {c: '3',d: '4'}).d",
      },
    ],
  },
  {
    param: "{ a = 1, b: { c, ...rest } = { c: 2, d: 3 } }",
    expected: [
      {
        name: "c",
        arrow: "() => (b.value ?? {c: 2,d: 3}).c",
      },
      {
        name: "rest",
        arrow:
          "() => { let {c, ...rest} = (b.value ?? {c: 2,d: 3}); return rest}",
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: "() => (_derived_b.value ?? {c: 2,d: 3}).c",
      },
      {
        name: "rest",
        arrow:
          "() => { let {c, ...rest} = (_derived_b.value ?? {c: 2,d: 3}); return rest}",
      },
    ],
  },
  {
    param: "{ a = 1, b: [c, ...rest] = [2, 3] }",
    expected: [
      {
        name: "c",
        arrow: "() => (b.value ?? [2, 3])[0]",
      },
      {
        name: "rest",
        arrow: "() => (b.value ?? [2, 3]).slice(1)",
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: "() => (_derived_b.value ?? [2, 3])[0]",
      },
      {
        name: "rest",
        arrow: "() => (_derived_b.value ?? [2, 3]).slice(1)",
      },
    ],
  },
  {
    param: "{ a = 1, b: { c, ...rest } = { c: '2', d: '3' } }",
    expected: [
      {
        name: "c",
        arrow: `() => (b.value ?? {c: '2',d: '3'}).c`,
      },
      {
        name: "rest",
        arrow:
          "() => { let {c, ...rest} = (b.value ?? {c: '2',d: '3'}); return rest}",
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: `() => (_derived_b.value ?? {c: '2',d: '3'}).c`,
      },
      {
        name: "rest",
        arrow:
          "() => { let {c, ...rest} = (_derived_b.value ?? {c: '2',d: '3'}); return rest}",
      },
    ],
  },
  {
    param: "{ a: { b = 1, c = 2 } }",
    expected: [
      {
        name: "b",
        arrow: "() => a.value.b ?? 1",
      },
      {
        name: "c",
        arrow: "() => a.value.c ?? 2",
      },
    ],
    expectedWithPrefix: [
      {
        name: "b",
        arrow: "() => _derived_a.value.b ?? 1",
      },
      {
        name: "c",
        arrow: "() => _derived_a.value.c ?? 2",
      },
    ],
  },
  {
    param: '{ a: { b = "1", c = "2" } }',
    expected: [
      {
        name: "b",
        arrow: "() => a.value.b ?? '1'",
      },
      {
        name: "c",
        arrow: "() => a.value.c ?? '2'",
      },
    ],
    expectedWithPrefix: [
      {
        name: "b",
        arrow: "() => _derived_a.value.b ?? '1'",
      },
      {
        name: "c",
        arrow: "() => _derived_a.value.c ?? '2'",
      },
    ],
  },
  {
    param: '{ a: [{ b: {c = "3" }}], d, f: { g = "5" }}',
    expected: [
      {
        name: "c",
        arrow: "() => a.value[0].b.c ?? '3'",
      },
      {
        name: "g",
        arrow: "() => f.value.g ?? '5'",
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: "() => _derived_a.value[0].b.c ?? '3'",
      },
      {
        name: "g",
        arrow: "() => _derived_f.value.g ?? '5'",
      },
    ],
  },
  {
    param: "{ w: { x: { y: { z = 1 } } } }",
    expected: [
      {
        name: "z",
        arrow: "() => w.value.x.y.z ?? 1",
      },
    ],
    expectedWithPrefix: [
      {
        name: "z",
        arrow: "() => _derived_w.value.x.y.z ?? 1",
      },
    ],
  },
  {
    param: "{ w: { x: [{ y: { f = 'bar' }, z = 'baz', ...foo }], t } }",
    expected: [
      {
        name: "f",
        arrow: `() => w.value.x[0].y.f ?? 'bar'`,
      },
      {
        name: "z",
        arrow: `() => w.value.x[0].z ?? 'baz'`,
      },
      {
        name: "foo",
        arrow: "() => { let {y, z, ...foo} = w.value.x[0]; return foo}",
      },
      {
        name: "t",
        arrow: "() => w.value.t",
      },
    ],
    expectedWithPrefix: [
      {
        name: "f",
        arrow: `() => _derived_w.value.x[0].y.f ?? 'bar'`,
      },
      {
        name: "z",
        arrow: `() => _derived_w.value.x[0].z ?? 'baz'`,
      },
      {
        name: "foo",
        arrow:
          "() => { let {y, z, ...foo} = _derived_w.value.x[0]; return foo}",
      },
      {
        name: "t",
        arrow: "() => _derived_w.value.t",
      },
    ],
  },

  // Default values from other params (using value from top level)
  {
    param: "{ a = 1, b: { c = a, d = 2 } }",
    expected: [
      {
        name: "c",
        arrow: "() => b.value.c ?? a.value",
      },
      {
        name: "d",
        arrow: "() => b.value.d ?? 2",
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: "() => _derived_b.value.c ?? a.value",
      },
      {
        name: "d",
        arrow: "() => _derived_b.value.d ?? 2",
      },
    ],
  },
  {
    param: "{ a: foo, b: { c = foo, d = 2 } }",
    expected: [
      {
        name: "c",
        arrow: "() => b.value.c ?? foo.value",
      },
      {
        name: "d",
        arrow: "() => b.value.d ?? 2",
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: "() => _derived_b.value.c ?? foo.value",
      },
      {
        name: "d",
        arrow: "() => _derived_b.value.d ?? 2",
      },
    ],
  },
  {
    param: "{ a: { b: { c = z, d = y } }, y, z }",
    expected: [
      {
        name: "c",
        arrow: "() => a.value.b.c ?? z.value",
      },
      {
        name: "d",
        arrow: "() => a.value.b.d ?? y.value",
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: "() => _derived_a.value.b.c ?? z.value",
      },
      {
        name: "d",
        arrow: "() => _derived_a.value.b.d ?? y.value",
      },
    ],
  },
  {
    param: "{ a: { b: { c = d, d = 5 } } }",
    expected: [
      {
        name: "c",
        arrow: "() => a.value.b.c ?? d.value",
      },
      {
        name: "d",
        arrow: "() => a.value.b.d ?? 5",
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: "() => _derived_a.value.b.c ?? d.value",
      },
      {
        name: "d",
        arrow: "() => _derived_a.value.b.d ?? 5",
      },
    ],
  },

  // Default values from external identifiers (show not add the .value)
  {
    param: "{ a: { b: { c = foo, d = 5 } } }",
    expected: [
      {
        name: "c",
        arrow: "() => a.value.b.c ?? foo",
      },
      {
        name: "d",
        arrow: "() => a.value.b.d ?? 5",
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: "() => _derived_a.value.b.c ?? foo",
      },
      {
        name: "d",
        arrow: "() => _derived_a.value.b.d ?? 5",
      },
    ],
  },
  {
    param: "{ a: { b: { c = foo(), d = 5 } } }",
    expected: [
      {
        name: "c",
        arrow: "() => a.value.b.c ?? foo()",
      },
      {
        name: "d",
        arrow: "() => a.value.b.d ?? 5",
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: "() => _derived_a.value.b.c ?? foo()",
      },
      {
        name: "d",
        arrow: "() => _derived_a.value.b.d ?? 5",
      },
    ],
  },
  {
    param: "{ a: { b: { c = t, d: t = 5 } } }",
    expected: [
      {
        name: "c",
        arrow: "() => a.value.b.c ?? t.value",
      },
      {
        name: "t",
        arrow: "() => a.value.b.t ?? 5",
      },
    ],
    expectedWithPrefix: [
      {
        name: "c",
        arrow: "() => _derived_a.value.b.c ?? t.value",
      },
      {
        name: "t",
        arrow: "() => _derived_a.value.b.t ?? 5",
      },
    ],
  },
];

const normalizeArrows = ({ arrow }: { arrow: string }) =>
  normalizeQuotes(arrow);

describe("AST", () => {
  describe.each(TESTS)(
    "destructuredPropsToArrowFn",
    ({ param, expected, expectedWithPrefix }) => {
      const expectedArrows = expected.map(normalizeArrows);
      const expectedWithPrefixArrows = expectedWithPrefix.map(normalizeArrows);
      const expectedNames = expected.map((a) => a.name).join(", ");

      it(`should transform ${param} to ${expectedArrows.join(", ")}`, () => {
        const patternString = `function test(${param}){}`;
        const ast = parseCodeToAST(patternString) as any;
        const pattern = ast.body[0].declarations[0].init.params[0];
        const result = destructuredPropsToArrowFn(pattern);

        expect(result.map(normalizeArrows)).toEqual(expectedArrows);
      });

      it(`should extract these props "${expectedNames}" from: ${param}`, () => {
        const patternString = `function test(${param}){}`;
        const ast = parseCodeToAST(patternString) as any;
        const pattern = ast.body[0].declarations[0].init.params[0];
        const result = destructuredPropsToArrowFn(pattern);

        expect(result.map((a) => a.name).join(", ")).toBe(expectedNames);
      });

      it(`should use prefix + transform ${param} to ${expectedWithPrefixArrows.join(
        ", ",
      )}`, () => {
        const patternString = `function test(${param}){}`;
        const ast = parseCodeToAST(patternString) as any;
        const pattern = ast.body[0].declarations[0].init.params[0];
        const result = destructuredPropsToArrowFn(pattern, "_derived_");

        expect(result.map(normalizeArrows)).toEqual(expectedWithPrefixArrows);
      });
    },
  );
});
