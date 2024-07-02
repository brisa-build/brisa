import { normalizeQuotes } from "@/helpers";
import AST from "@/utils/ast";
import getPropsOptimizations from "@/utils/client-build-plugin/get-props-optimizations";
import { describe, expect, it } from "bun:test";

const { parseCodeToAST } = AST("tsx");
const DERIVED_FN_NAME = "derived";

/**
 * TODO;
 * - Change order of lines for dependencies
 * - Add top line with the extracted first-level props
 */
const TESTS = [
  // Should ignore identifier at first level
  {
    param: "props",
    expected: [],
  },
  {
    param: "props = { foo: 'bar' }",
    expected: [],
  },
  {
    param: "props = { foo: 'bar', baz: { qux: 'quuz' } }",
    expected: [],
  },

  // Basic patterns
  {
    param: "{ b: { d: [foo] } }",
    expected: ["const foo = derived(() => __b_props__.b.value.d[0]);"],
  },
  {
    param: "{a, b: [b = 1, c = 2]}",
    expected: [
      "const b = derived(() => __b_props__.b.value[0] ?? 1);",
      "const c = derived(() => __b_props__.b.value[1] ?? 2);",
    ],
  },
  {
    param: "{ 'a-b': { 'c-d': e } }",
    expected: ["const e = derived(() => __b_props__['a-b'].value.e);"],
  },

  // Ignore first level ONLY if not have default value (valid signal for top level)
  {
    param: "[a, b, c]",
    expected: [],
  },
  {
    param: "[...rest]",
    expected: [],
  },
  {
    param: "[foo, ...rest]",
    expected: [],
  },
  {
    param: "{ a, b, ...rest }",
    expected: [],
  },
  {
    param: "{ a = 1, b = 2, c = 3 }",
    expected: [
      "const a = derived(() => __b_props__.a.value ?? 1);",
      "const b = derived(() => __b_props__.b.value ?? 2);",
      "const c = derived(() => __b_props__.c.value ?? 3);",
    ],
  },
  {
    param: "{ a: b = 1, c: d = 2 }",
    expected: [
      "const b = derived(() => __b_props__.b.value ?? 1);",
      "const d = derived(() => __b_props__.d.value ?? 2);",
    ],
  },
  {
    param: "{ a: b = { foo: 'bar' } }",
    expected: ["const b = derived(() => __b_props__.b.value ?? {foo: 'bar'});"],
  },
  {
    param: "{ a: b = { foo: 'bar' }, c: d = { baz: 'qux' } }",
    expected: [
      "const b = derived(() => __b_props__.b.value ?? {foo: 'bar'});",
      "const d = derived(() => __b_props__.d.value ?? {baz: 'qux'});",
    ],
  },

  // Rest in nested level array
  {
    param: "{ w: { x: [b, ...foo] } }",
    expected: [
      "const b = derived(() => __b_props__.w.value.x[0]);",
      "const foo = derived(() => __b_props__.w.value.x.slice(1));",
    ],
  },
  {
    param: "{ a: { 'b-c': [d, ...e] } }",
    expected: [
      "const d = derived(() => __b_props__.a.value['b-c'][0]);",
      "const e = derived(() => __b_props__.a.value['b-c'].slice(1));",
    ],
  },
  {
    param: "{ a: { 1: [d, ...e] } }",
    expected: [
      "const d = derived(() => __b_props__.a.value['1'][0]);",
      "const e = derived(() => __b_props__.a.value['1'].slice(1));",
    ],
  },
  {
    param: "{ w: { x: [b, ...foo], y: { z } } }",
    expected: [
      "const b = derived(() => __b_props__.w.value.x[0]);",
      "const foo = derived(() => __b_props__.w.value.x.slice(1));",
      "const z = derived(() => __b_props__.w.value.y.z);",
    ],
  },
  {
    param: "{ w: { x: [[b], ...foo], y: { z } } }",
    expected: [
      "const b = derived(() => __b_props__.w.value.x[0][0]);",
      "const foo = derived(() => __b_props__.w.value.x.slice(1));",
      "const z = derived(() => __b_props__.w.value.y.z);",
    ],
  },

  // Rest in nested level object
  {
    param: "{ w: { x: { y, ...foo } } }",
    expected: [
      "const y = derived(() => __b_props__.w.value.x.y);",
      "const foo = derived(() => {let {y, ...foo} = __b_props__.w.value.x; return foo;});",
    ],
  },
  {
    param: "{ w: { x: { y, ...foo }, z } }",
    expected: [
      "const y = derived(() => __b_props__.w.value.x.y);",
      "const foo = derived(() => {let {y, ...foo} = __b_props__.w.value.x; return foo;});",
      "const z = derived(() => __b_props__.w.value.z);",
    ],
  },
  {
    param: "{ w: { x: { y, z, a, b, ...foo }, t } }",
    expected: [
      "const y = derived(() => __b_props__.w.value.x.y);",
      "const z = derived(() => __b_props__.w.value.x.z);",
      "const a = derived(() => __b_props__.w.value.x.a);",
      "const b = derived(() => __b_props__.w.value.x.b);",
      "const foo = derived(() => {let {y, z, a, b, ...foo} = __b_props__.w.value.x; return foo;});",
      "const t = derived(() => __b_props__.w.value.t);",
    ],
  },
  {
    param: "{ w: { x: [{ y: { f }, z, ...foo }], t } }",
    expected: [
      "const f = derived(() => __b_props__.w.value.x[0].y.f);",
      "const z = derived(() => __b_props__.w.value.x[0].z);",
      "const foo = derived(() => {let {y, z, ...foo} = __b_props__.w.value.x[0]; return foo;});",
      "const t = derived(() => __b_props__.w.value.t);",
    ],
  },

  // Default values
  {
    param: "{ a = 1, b: { c, d } } = { c: 2, b: { c: 3, d: 4} }",
    expected: [
      "const a = derived(() => __b_props__.a.value ?? 1);",
      "const c = derived(() => (__b_props__.b.value ?? {c: 3,d: 4}).c);",
      "const d = derived(() => (__b_props__.b.value ?? {c: 3,d: 4}).d);",
    ],
  },
  {
    param: "{ a = 1, b: [c, d] } = { c: 2, b: [3, 4] }",
    expected: [
      "const a = derived(() => __b_props__.a.value ?? 1);",
      "const c = derived(() => (__b_props__.b.value ?? [3, 4])[0]);",
      "const d = derived(() => (__b_props__.b.value ?? [3, 4])[1]);",
    ],
  },
  {
    param: "{ a = 1, b: { c, d = { f: 2 } } }",
    expected: [
      "const a = derived(() => __b_props__.a.value ?? 1);",
      "const c = derived(() => __b_props__.b.value.c);",
      "const d = derived(() => __b_props__.b.value.d ?? {f: 2});",
    ],
  },
  {
    param: "{ a = 1, b: { c, d = {f: 'test'} } }",
    expected: [
      "const a = derived(() => __b_props__.a.value ?? 1);",
      "const c = derived(() => __b_props__.b.value.c);",
      "const d = derived(() => __b_props__.b.value.d ?? {f: 'test'});",
    ],
  },
  {
    param: "{ a = '1', b: { c, d } } = { c: '2', b: { c: '3', d: '4'} }",
    expected: [
      "const a = derived(() => __b_props__.a.value ?? '1');",
      "const c = derived(() => (__b_props__.b.value ?? {c: '3',d: '4'}).c);",
      "const d = derived(() => (__b_props__.b.value ?? {c: '3',d: '4'}).d);",
    ],
  },
  {
    param: "{ a = 1, b: { c, ...rest } = { c: 2, d: 3 } }",
    expected: [
      "const a = derived(() => __b_props__.a.value ?? 1);",
      "const c = derived(() => (__b_props__.b.value ?? {c: 2,d: 3}).c);",
      "const rest = derived(() => {let {c, ...rest} = (__b_props__.b.value ?? {c: 2,d: 3}); return rest;});",
    ],
  },
  {
    param: "{ a = 1, b: [c, ...rest] = [2, 3] }",
    expected: [
      "const a = derived(() => __b_props__.a.value ?? 1);",
      "const c = derived(() => (__b_props__.b.value ?? [2, 3])[0]);",
      "const rest = derived(() => (__b_props__.b.value ?? [2, 3]).slice(1));",
    ],
  },
  {
    param: "{ a = 1, b: { c, ...rest } = { c: '2', d: '3' } }",
    expected: [
      "const a = derived(() => __b_props__.a.value ?? 1);",
      "const c = derived(() => (__b_props__.b.value ?? {c: '2',d: '3'}).c);",
      "const rest = derived(() => {let {c, ...rest} = (__b_props__.b.value ?? {c: '2',d: '3'}); return rest;});",
    ],
  },
  {
    param: "{ a: { b = 1, c = 2 } }",
    expected: [
      "const b = derived(() => __b_props__.a.value.b ?? 1);",
      "const c = derived(() => __b_props__.a.value.c ?? 2);",
    ],
  },
  {
    param: '{ a: { b = "1", c = "2" } }',
    expected: [
      "const b = derived(() => __b_props__.a.value.b ?? '1');",
      "const c = derived(() => __b_props__.a.value.c ?? '2');",
    ],
  },
  {
    param: '{ a: [{ b: {c = "3" }}], d, f: { g = "5" }}',
    expected: [
      "const c = derived(() => __b_props__.a.value[0].b.c ?? '3');",
      "const g = derived(() => __b_props__.f.value.g ?? '5');",
    ],
  },
  {
    param: "{ w: { x: { y: { z = 1 } } } }",
    expected: ["const z = derived(() => __b_props__.w.value.x.y.z ?? 1);"],
  },
  {
    param: "{ w: { x: [{ y: { f = 'bar' }, z = 'baz', ...foo }], t } }",
    expected: [
      "const f = derived(() => __b_props__.w.value.x[0].y.f ?? 'bar');",
      "const z = derived(() => __b_props__.w.value.x[0].z ?? 'baz');",
      "const foo = derived(() => {let {y, z, ...foo} = __b_props__.w.value.x[0]; return foo;});",
      "const t = derived(() => __b_props__.w.value.t);",
    ],
  },

  // Default values from other params (using value from top level)
  {
    param: "{ a = 1, b: { c = a, d = 2 } }",
    expected: [
      "const a = derived(() => __b_props__.a.value ?? 1);",
      "const d = derived(() => __b_props__.b.value.d ?? 2);",
      "const c = derived(() => __b_props__.b.value.c ?? a.value);",
    ],
  },
  {
    param: "{ a: foo = 1, b: { c = foo, d = 2 } }",
    expected: [
      "const foo = derived(() => __b_props__.foo.value ?? 1);",
      "const d = derived(() => __b_props__.b.value.d ?? 2);",
      "const c = derived(() => __b_props__.b.value.c ?? foo.value);",
    ],
  },
  {
    param: "{ a: { b: { c = z, d = y } }, y, z }",
    expected: [
      "const c = derived(() => __b_props__.a.value.b.c ?? z.value);",
      "const d = derived(() => __b_props__.a.value.b.d ?? y.value);",
    ],
  },
  {
    param: "{ a: { b: { c = d, d = 5 } } }",
    expected: [
      "const d = derived(() => __b_props__.a.value.b.d ?? 5);",
      "const c = derived(() => __b_props__.a.value.b.c ?? d.value);",
    ],
  },

  // Default values from external identifiers (show not add the .value)
  {
    param: "{ a: { b: { c = foo, d = 5 } } }",
    expected: [
      "const d = derived(() => __b_props__.a.value.b.d ?? 5);",
      "const c = derived(() => __b_props__.a.value.b.c ?? foo);",
    ],
  },
  {
    param: "{ a: { b: { c = foo(), d = 5 } } }",
    expected: [
      "const c = derived(() => __b_props__.a.value.b.c ?? foo());",
      "const d = derived(() => __b_props__.a.value.b.d ?? 5);",
    ],
  },
  {
    param: "{ a: { b: { c = t, d: t = 5 } } }",
    expected: [
      "const t = derived(() => __b_props__.a.value.b.t ?? 5);",
      "const c = derived(() => __b_props__.a.value.b.c ?? t.value);",
    ],
  },
];

describe("AST", () => {
  describe.each(TESTS)("getPropsOptimizations", ({ param, expected }) => {
    const expectedArrows = expected.map(normalizeQuotes);

    it(`should transform ${param} to ${expectedArrows.join(", ")}`, () => {
      const patternString = `function test(${param}){}`;
      const ast = parseCodeToAST(patternString) as any;
      const pattern = ast.body[0].declarations[0].init.params[0];
      const result = getPropsOptimizations(pattern, DERIVED_FN_NAME);

      expect(result.map(normalizeQuotes)).toEqual(expectedArrows);
    });
  });
});
