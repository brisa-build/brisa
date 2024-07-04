import { normalizeQuotes } from "@/helpers";
import AST from "@/utils/ast";
import getPropsOptimizations from "@/utils/client-build-plugin/get-props-optimizations";
import { describe, expect, it } from "bun:test";

const { parseCodeToAST } = AST("tsx");
const DERIVED_FN_NAME = "derived";

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

  // Ignore first level without nested levels or default values
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

  // Basic patterns
  {
    param: "{ b: { d: [foo] } }",
    expected: ["const foo = derived(() => __b_props__.b.d[0]);"],
  },
  {
    param: "{a, b: [b = 1, c = 2]}",
    expected: [
      "const {a} = __b_props__;",
      "const b = derived(() => __b_props__.b[0] ?? 1);",
      "const c = derived(() => __b_props__.b[1] ?? 2);",
    ],
  },
  {
    param: "{ 'a-b': { 'c-d': e } }",
    expected: ["const e = derived(() => __b_props__['a-b'].e);"],
  },

  // Valid cases on first level
  {
    param: "{ a, b: { c }, ...rest }",
    expected: [
      "const {a} = __b_props__;",
      "const rest = (({a, b, ...rest}) => rest)(__b_props__);",
      "const c = derived(() => __b_props__.b.c);",
    ],
  },
  {
    param: "{ a, b = 1, ...rest }",
    expected: [
      "const {a} = __b_props__;",
      "const rest = (({a, b, ...rest}) => rest)(__b_props__);",
      "const b = derived(() => __b_props__.b ?? 1);",
    ],
  },
  {
    param: "{ a = 1, b = 2, c = 3 }",
    expected: [
      "const a = derived(() => __b_props__.a ?? 1);",
      "const b = derived(() => __b_props__.b ?? 2);",
      "const c = derived(() => __b_props__.c ?? 3);",
    ],
  },
  {
    param: "{ a: b = 1, c: d = 2 }",
    expected: [
      "const b = derived(() => __b_props__.b ?? 1);",
      "const d = derived(() => __b_props__.d ?? 2);",
    ],
  },
  {
    param: "{ a: b = { foo: 'bar' } }",
    expected: ["const b = derived(() => __b_props__.b ?? {foo: 'bar'});"],
  },
  {
    param: "{ a: b = { foo: 'bar' }, c: d = { baz: 'qux' } }",
    expected: [
      "const b = derived(() => __b_props__.b ?? {foo: 'bar'});",
      "const d = derived(() => __b_props__.d ?? {baz: 'qux'});",
    ],
  },

  // Rest in nested level array
  {
    param: "{ w: { x: [b, ...foo] } }",
    expected: [
      "const b = derived(() => __b_props__.w.x[0]);",
      "const foo = derived(() => __b_props__.w.x.slice(1));",
    ],
  },
  {
    param: "{ a: { 'b-c': [d, ...e] } }",
    expected: [
      "const d = derived(() => __b_props__.a['b-c'][0]);",
      "const e = derived(() => __b_props__.a['b-c'].slice(1));",
    ],
  },
  {
    param: "{ a: { 1: [d, ...e] } }",
    expected: [
      "const d = derived(() => __b_props__.a['1'][0]);",
      "const e = derived(() => __b_props__.a['1'].slice(1));",
    ],
  },
  {
    param: "{ w: { x: [b, ...foo], y: { z } } }",
    expected: [
      "const b = derived(() => __b_props__.w.x[0]);",
      "const foo = derived(() => __b_props__.w.x.slice(1));",
      "const z = derived(() => __b_props__.w.y.z);",
    ],
  },
  {
    param: "{ w: { x: [[b], ...foo], y: { z } } }",
    expected: [
      "const b = derived(() => __b_props__.w.x[0][0]);",
      "const foo = derived(() => __b_props__.w.x.slice(1));",
      "const z = derived(() => __b_props__.w.y.z);",
    ],
  },

  // Rest in nested level object
  {
    param: "{ w: { x: { y, ...foo } } }",
    expected: [
      "const y = derived(() => __b_props__.w.x.y);",
      "const foo = derived(() => (({y, ...foo}) => foo)(__b_props__.w.x));",
    ],
  },
  {
    param: "{ w: { x: { y, ...foo }, z } }",
    expected: [
      "const y = derived(() => __b_props__.w.x.y);",
      "const foo = derived(() => (({y, ...foo}) => foo)(__b_props__.w.x));",
      "const z = derived(() => __b_props__.w.z);",
    ],
  },
  {
    param: "{ w: { x: { y, z, a, b, ...foo }, t } }",
    expected: [
      "const y = derived(() => __b_props__.w.x.y);",
      "const z = derived(() => __b_props__.w.x.z);",
      "const a = derived(() => __b_props__.w.x.a);",
      "const b = derived(() => __b_props__.w.x.b);",
      "const foo = derived(() => (({y, z, a, b, ...foo}) => foo)(__b_props__.w.x));",
      "const t = derived(() => __b_props__.w.t);",
    ],
  },
  {
    param: "{ w: { x: [{ y: { f }, z, ...foo }], t } }",
    expected: [
      "const f = derived(() => __b_props__.w.x[0].y.f);",
      "const z = derived(() => __b_props__.w.x[0].z);",
      "const foo = derived(() => (({y, z, ...foo}) => foo)(__b_props__.w.x[0]));",
      "const t = derived(() => __b_props__.w.t);",
    ],
  },

  // Default values
  {
    param: "{ a = 1, b: { c, d } } = { c: 2, b: { c: 3, d: 4} }",
    expected: [
      "const a = derived(() => __b_props__.a ?? 1);",
      "const c = derived(() => (__b_props__.b ?? {c: 3,d: 4}).c);",
      "const d = derived(() => (__b_props__.b ?? {c: 3,d: 4}).d);",
    ],
  },
  {
    param: "{ a = 1, b: [c, d] } = { c: 2, b: [3, 4] }",
    expected: [
      "const a = derived(() => __b_props__.a ?? 1);",
      "const c = derived(() => (__b_props__.b ?? [3, 4])[0]);",
      "const d = derived(() => (__b_props__.b ?? [3, 4])[1]);",
    ],
  },
  {
    param: "{ a = 1, b: { c, d = { f: 2 } } }",
    expected: [
      "const a = derived(() => __b_props__.a ?? 1);",
      "const c = derived(() => __b_props__.b.c);",
      "const d = derived(() => __b_props__.b.d ?? {f: 2});",
    ],
  },
  {
    param: "{ a = 1, b: { c, d = {f: 'test'} } }",
    expected: [
      "const a = derived(() => __b_props__.a ?? 1);",
      "const c = derived(() => __b_props__.b.c);",
      "const d = derived(() => __b_props__.b.d ?? {f: 'test'});",
    ],
  },
  {
    param: "{ a = '1', b: { c, d } } = { c: '2', b: { c: '3', d: '4'} }",
    expected: [
      "const a = derived(() => __b_props__.a ?? '1');",
      "const c = derived(() => (__b_props__.b ?? {c: '3',d: '4'}).c);",
      "const d = derived(() => (__b_props__.b ?? {c: '3',d: '4'}).d);",
    ],
  },
  {
    param: "{ a = 1, b: { c, ...rest } = { c: 2, d: 3 } }",
    expected: [
      "const a = derived(() => __b_props__.a ?? 1);",
      "const c = derived(() => (__b_props__.b ?? {c: 2,d: 3}).c);",
      "const rest = derived(() => (({c, ...rest}) => rest)((__b_props__.b ?? {c: 2,d: 3})));",
    ],
  },
  {
    param: "{ a = 1, b: [c, ...rest] = [2, 3] }",
    expected: [
      "const a = derived(() => __b_props__.a ?? 1);",
      "const c = derived(() => (__b_props__.b ?? [2, 3])[0]);",
      "const rest = derived(() => (__b_props__.b ?? [2, 3]).slice(1));",
    ],
  },
  {
    param: "{ a = 1, b: { c, ...rest } = { c: '2', d: '3' } }",
    expected: [
      "const a = derived(() => __b_props__.a ?? 1);",
      "const c = derived(() => (__b_props__.b ?? {c: '2',d: '3'}).c);",
      "const rest = derived(() => (({c, ...rest}) => rest)((__b_props__.b ?? {c: '2',d: '3'})));",
    ],
  },
  {
    param: "{ a: { b = 1, c = 2 }, d, ...rest }",
    expected: [
      "const {d} = __b_props__;",
      "const rest = (({a, d, ...rest}) => rest)(__b_props__);",
      "const b = derived(() => __b_props__.a.b ?? 1);",
      "const c = derived(() => __b_props__.a.c ?? 2);",
    ],
  },
  {
    param: '{ a: { b = "1", c = "2" } }',
    expected: [
      "const b = derived(() => __b_props__.a.b ?? '1');",
      "const c = derived(() => __b_props__.a.c ?? '2');",
    ],
  },
  {
    param: '{ a: [{ b: {c = "3" }}], d, f: { g = "5" }}',
    expected: [
      "const {d} = __b_props__;",
      "const c = derived(() => __b_props__.a[0].b.c ?? '3');",
      "const g = derived(() => __b_props__.f.g ?? '5');",
    ],
  },
  {
    param: "{ w: { x: { y: { z = 1 } } } }",
    expected: ["const z = derived(() => __b_props__.w.x.y.z ?? 1);"],
  },
  {
    param: "{ w: { x: [{ y: { f = 'bar' }, z = 'baz', ...foo }], t }, a }",
    expected: [
      "const {a} = __b_props__;",
      "const f = derived(() => __b_props__.w.x[0].y.f ?? 'bar');",
      "const z = derived(() => __b_props__.w.x[0].z ?? 'baz');",
      "const foo = derived(() => (({y, z, ...foo}) => foo)(__b_props__.w.x[0]));",
      "const t = derived(() => __b_props__.w.t);",
    ],
  },

  // Default values from other params (using value from top level)
  {
    param: "{ a = 1, b: { c = a, d = 2 } }",
    expected: [
      "const a = derived(() => __b_props__.a ?? 1);",
      "const d = derived(() => __b_props__.b.d ?? 2);",
      "const c = derived(() => __b_props__.b.c ?? a);",
    ],
  },
  {
    param: "{ a: foo = 1, b: { c = foo, d = 2 } }",
    expected: [
      "const foo = derived(() => __b_props__.foo ?? 1);",
      "const d = derived(() => __b_props__.b.d ?? 2);",
      "const c = derived(() => __b_props__.b.c ?? foo);",
    ],
  },
  {
    param: "{ a: { b: { c = z, d = y } }, y, z }",
    expected: [
      "const {y, z} = __b_props__;",
      "const c = derived(() => __b_props__.a.b.c ?? z);",
      "const d = derived(() => __b_props__.a.b.d ?? y);",
    ],
  },
  {
    param: "{ a: { b: { c = d, d = 5 } } }",
    expected: [
      "const d = derived(() => __b_props__.a.b.d ?? 5);",
      "const c = derived(() => __b_props__.a.b.c ?? d);",
    ],
  },

  // Default values from external identifiers (show not add the )
  {
    param: "{ a: { b: { c = foo, d = 5 } } }",
    expected: [
      "const d = derived(() => __b_props__.a.b.d ?? 5);",
      "const c = derived(() => __b_props__.a.b.c ?? foo);",
    ],
  },
  {
    param: "{ a: { b: { c = foo(), d = 5 } } }",
    expected: [
      "const c = derived(() => __b_props__.a.b.c ?? foo());",
      "const d = derived(() => __b_props__.a.b.d ?? 5);",
    ],
  },
  {
    param: "{ a: { b: { c = t, d: t = 5 } } }",
    expected: [
      "const t = derived(() => __b_props__.a.b.t ?? 5);",
      "const c = derived(() => __b_props__.a.b.c ?? t);",
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
