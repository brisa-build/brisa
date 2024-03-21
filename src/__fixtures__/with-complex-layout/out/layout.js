// @bun
import Te from "path";
import Mn from "path";
import Wn from "path";
var Pe = function (e, t) {
  try {
    return import.meta.resolveSync(Wn.join(t, e));
  } catch (r) {
    return null;
  }
};
async function wt(e, t = Mn.join(process.cwd(), "build")) {
  const r = Pe(e, t);
  if (!r) return null;
  return await import(r);
}
async function Rt(
  { Component: e, selector: t, ...r },
  { store: n, useContext: o, i18n: i, indicate: a },
) {
  const { WEB_CONTEXT_PLUGINS: u } = U(),
    s = !n.has(eo);
  let c = "",
    d = t;
  n.setOptimistic = Ae;
  const f = {
    store: n,
    state: (p) => ({ value: p }),
    effect: Ae,
    onMount: Ae,
    reset: Ae,
    derived: (p) => ({ value: p() }),
    cleanup: Ae,
    indicate: a,
    useContext: o,
    i18n: i,
    css: (p, ...h) => {
      c += String.raw(p, ...h.map((x) => (typeof x === "function" ? x() : x)));
    },
  };
  for (let p of u) Object.assign(f, p(f));
  const l = { ...r, children: ke("slot", {}, void 0, !1, void 0, this) };
  let g;
  if (s)
    try {
      g = await (typeof e.suspense === "function" ? e.suspense(l, f) : e(l, f));
    } catch (p) {
      if (e.error) g = await e.error({ ...l, error: p }, f);
      else throw p;
    }
  return ke(
    d,
    {
      ...r,
      __isWebComponent: !0,
      children: [
        s &&
          ke(
            "template",
            {
              shadowrootmode: "open",
              children: [
                g,
                c.length > 0 &&
                  ke("style", { children: Or(c) }, void 0, !1, void 0, this),
              ],
            },
            void 0,
            !0,
            void 0,
            this,
          ),
        ke(_r, { slot: "", children: r.children }, void 0, !1, void 0, this),
      ],
    },
    void 0,
    !0,
    void 0,
    this,
  );
}
import { watch as to } from "fs";
import ro from "path";
import er from "path";
import Ke from "fs";
import { readdir as oo } from "fs/promises";
async function Wr(e) {
  const t = (await oo(e, { withFileTypes: !0 })).map(async (r) => {
    const n = [e, r.name].join("/");
    if (r.isDirectory()) return await Wr(n);
    else return [n];
  });
  return (await Promise.all(t)).flat();
}
async function io(e) {
  const t = await Wr(e);
  await Promise.all(
    t.map(async (r) => {
      if (r.endsWith(".gz")) return;
      const n = Bun.file(r),
        o = no(new Uint8Array(await n.arrayBuffer()));
      Bun.write(`${r}.gz`, o);
    }),
  );
}
async function ao() {
  const { SRC_DIR: e, BUILD_DIR: t } = U(),
    r = er.join(t, "public"),
    n = er.join(e, "public");
  if (!Ke.existsSync(r)) Ke.mkdirSync(r, { recursive: !0 });
  if (Ke.existsSync(n))
    Ke.cpSync(n, r, { recursive: !0 }), await io(r).catch(console.error);
}
import le from "fs";
import { join as J } from "path";
var tr = function (e, t = 2, r = !1) {
  if (e < 0) return "Invalid byteCount";
  if (e === 0) return r ? nt("0 B") : "0 B";
  const n = Math.floor(Math.log(e) / Math.log(1000));
  let o = nt;
  if (e > 70000) o = Fr;
  if (e > 1e5) o = Lr;
  const i = `${(e / Math.pow(1000, n)).toFixed(t)} ${uo[n]}`;
  return r ? o(i) : i;
};
import { rm as so, writeFile as lo } from "fs/promises";
import { join as rr } from "path";
var mo = function (e, t) {
    const r = new Ur(t);
    return r.generator[e.type](e, r), r.output;
  },
  he = function (e = "tsx") {
    const t = new Bun.Transpiler({ loader: e });
    return {
      parseCodeToAST(r) {
        return W0(t.transformSync(r), { jsx: !0, module: !0 });
      },
      generateCodeFromAST(r) {
        return mo(r, { indent: "  " });
      },
    };
  },
  Nn = function (e) {
    const t = [null],
      r = e.body.findIndex(
        (u) =>
          u.type === "ExportDefaultDeclaration" &&
          u.declaration.type !== "Literal" &&
          u.declaration.value !== null,
      );
    let n = -1;
    if (r === -1) return t;
    const o = e.body[r],
      { type: i, name: a } = o.declaration;
    if (i === "Identifier") {
      const u = e.body.find((s, c) => {
        const d = s.declarations?.[0].id?.name ?? s?.id?.name;
        return (n = c), s.type.endsWith("Declaration") && d === a;
      });
      if (!u) return t;
      return [u, r, n];
    }
    return [o.declaration, r, n];
  },
  j0 = function (e) {
    const t = e.body.findIndex((a) => a.type === "ExportDefaultDeclaration");
    if (t === -1)
      return {
        ...e,
        body: [
          ...e.body,
          {
            type: "ExportDefaultDeclaration",
            declaration: { type: "Literal", value: null },
          },
        ],
      };
    const r = e.body[t];
    if (kr.has(r.declaration.type)) return e;
    const n = { ...e, body: e.body.filter((a, u) => u !== t) };
    let o = e.body.findIndex((a) => {
      return kr.has(a.type) && Pr(a) === r.declaration.name;
    });
    if (o === -1) return e;
    let i = e.body[o];
    if (i?.declarations?.[0]?.init === null)
      for (let a = e.body.length - 1; a > o; a--) {
        const u = e.body[a];
        if (
          u.type === "ExpressionStatement" &&
          u.expression.type === "AssignmentExpression" &&
          u.expression.left.type === "Identifier" &&
          u.expression.left.name === Pr(i)
        ) {
          (i = {
            ...i,
            declarations: [{ ...i.declarations[0], init: u.expression.right }],
          }),
            n.body.splice(a, 1);
          break;
        }
      }
    if (i.type === "VariableDeclaration") {
      const a = n.body.map((u, s) => {
        if (s === o)
          return {
            ...u,
            type: "ExportDefaultDeclaration",
            declaration: i.declarations[0].init,
          };
        return u;
      });
      return { ...n, body: a };
    }
    return e;
  },
  Z0 = function (e) {
    let t = !1;
    return (
      JSON.stringify(e, (r, n) => {
        if (n?.type === "ArrowFunctionExpression") return null;
        return (t ||= n === "AwaitExpression"), n;
      }),
      t
    );
  },
  de = function (e) {
    return {
      type: "ArrowFunctionExpression",
      expression: !0,
      async: Z0(e),
      params: [],
      body: e,
    };
  },
  wn = function (e, t) {
    const r = e.body?.body ?? [Q0(e.body)],
      { LOG_PREFIX: n } = U(),
      o = r.findIndex((l) => l.type === "ReturnStatement"),
      i = r[o];
    let [a, u, s] = i?.argument?.elements ?? [],
      c = s;
    if (i?.argument?.type === "CallExpression")
      (a = je), (u = kt), (c = de(i.argument));
    if (ei.has(i?.argument?.type)) (a = je), (u = kt), (c = de(i?.argument));
    else if (
      !i &&
      r.length === 1 &&
      r[0]?.type === "VariableDeclaration" &&
      r[0]?.declarations[0]?.init?.type === "ArrowFunctionExpression" &&
      r[0]?.declarations[0]?.init?.body?.type !== "BlockStatement"
    ) {
      const l = r[0]?.declarations[0]?.init?.body?.elements ?? [];
      (a = { type: "Literal", value: l[0]?.value ?? null }),
        (u = {
          type: "ObjectExpression",
          properties: (l[1]?.properties ?? []).map((g) => ({
            ...g,
            value: g.value,
          })),
        }),
        (c = { type: "Literal", value: l[2]?.value ?? "" });
    } else if (
      !a &&
      !u &&
      !c &&
      (i?.argument == null ||
        i?.argument?.type === "Literal" ||
        i?.argument?.type === "BinaryExpression")
    ) {
      const l = i?.argument;
      if (
        ((a = je),
        (u = kt),
        (c = { type: "Literal", value: l?.value ?? "" }),
        l?.type === "BinaryExpression" && l?.operator === "+")
      ) {
        const g = (p) => {
          if (p?.type === "BinaryExpression")
            return { ...p, left: g(p.left), right: g(p.right) };
          return p;
        };
        c = de(g(l));
      }
    }
    if (!c)
      console.log(n.ERROR, "Error Code: 5001"),
        console.log(n.ERROR),
        console.log(
          n.ERROR,
          "Description: An unexpected error occurred while processing your component.",
        ),
        console.log(
          n.ERROR,
          "Details: The server encountered an internal error and was unable to build your component.",
        ),
        console.log(n.ERROR),
        console.log(
          n.ERROR,
          "Please provide the following error code when reporting the problem: 5001.",
        ),
        console.log(n.ERROR);
    const d =
        a === je
          ? { type: "ReturnStatement", argument: c }
          : {
              type: "ReturnStatement",
              argument: { type: "ArrayExpression", elements: [a, u, c] },
            },
      f = r.map((l, g) => (g === o ? d : l));
    return {
      type: "FunctionExpression",
      id: { type: "Identifier", name: t },
      params: e.params,
      body: { type: "BlockStatement", body: f },
      generator: e.generator,
      async: e.async,
    };
  },
  ti = function (e, t, r) {
    const n = wn(e, r),
      o = [{ type: "Identifier", name: r }];
    if (t?.length)
      o.push({
        type: "ArrayExpression",
        elements: t.map((i) => ({ type: "Literal", value: i })),
      });
    return [
      $0,
      {
        type: "CallExpression",
        callee: { type: "Identifier", name: "brisaElement" },
        arguments: o,
      },
      n,
    ];
  },
  br = function (e) {
    const t = e?.body?.body ?? [];
    let r = -1;
    for (let a = 0; a < t.length; a++) {
      const u = t[a];
      if (!ri.has(u.type)) continue;
      if (n(u) && r === -1) r = a;
    }
    function n(a) {
      let u = !1;
      return (
        JSON.stringify(a, (s, c) => {
          if (ni.has(c?.type)) return null;
          if (s === "type" && c === "ReturnStatement") return (u = !0), null;
          return c;
        }),
        u
      );
    }
    if (r === -1) return e;
    const o = t.slice(0, r),
      i = t.slice(r, Infinity);
    return {
      ...e,
      body: {
        ...e.body,
        body: [
          ...o,
          {
            type: "ReturnStatement",
            argument: {
              type: "ArrayExpression",
              elements: [
                { type: "Literal", value: null },
                { type: "ObjectExpression", properties: [] },
                {
                  type: "ArrowFunctionExpression",
                  params: [],
                  body: { type: "BlockStatement", body: i },
                },
              ],
            },
          },
        ],
      },
    };
  },
  Er = function (e, t = new Set()) {
    const r = e.params[1];
    if (!r) return e;
    const n = { effectName: "effect", cleanupName: "cleanup" },
      {
        assignRNameToNode: o,
        getRNameFromIdentifier: i,
        getEffectIdentifier: a,
      } = ai(t);
    if (r.type === "ObjectPattern") {
      if (!f(r.properties)) return e;
    } else if (r.type === "Identifier") n.identifier = r.name;
    return {
      ...e,
      body: {
        ...e.body,
        body: JSON.parse(
          JSON.stringify(JSON.parse(JSON.stringify(e.body?.body, u)), s),
          c,
        ),
      },
    };
    function u(l, g) {
      if (
        g?.type === "VariableDeclaration" &&
        g?.declarations[0]?.id?.type === "ObjectPattern" &&
        n.identifier === g?.declarations[0]?.init?.name
      )
        f(g?.declarations[0]?.id?.properties);
      if (g?.callee?.name === n.effectName) o(g, { parent: this });
      return Rn(g, this), g;
    }
    function s(l, g) {
      if (vr.has(g?.type) && g?.id?.name === a())
        return JSON.parse(
          JSON.stringify(g, (p, h) => {
            if (h?.constructor === Object) h.effectDeps = [i(g?.id?.name)];
            return h;
          }),
        );
      return g;
    }
    function c(l, g) {
      if (vr.has(g?.type) && g?.id?.name === a()) return d(g, this);
      if (g?.callee?.property?.name && g?.callee?.object?.name !== n.identifier)
        return g;
      if ((g?.callee?.name ?? g?.callee?.property?.name) !== n.effectName)
        return g;
      return d(g, this);
    }
    function d(l, g) {
      const p = l?.id?.name,
        h = i(p);
      if (h) (l.effectDeps = [h]), o(l, { takenName: h, parent: g });
      const x = (I, S) => {
          if (!ui.has(S?.type)) return S;
          if (S?.callee?.property?.name && S?.callee?.object?.name !== p)
            return S;
          if ((S?.callee?.name ?? S?.callee?.property?.name) !== n.cleanupName)
            return S;
          const P = {
            type: "MemberExpression",
            object: { type: "Identifier", name: S.effectDeps?.[0] ?? b },
            property: { type: "Identifier", name: "id" },
            computed: !1,
          };
          return { ...S, arguments: [S.arguments[0], P] };
        },
        b = l.effectDeps?.[0],
        A = { type: "Identifier", name: b },
        w = JSON.parse(JSON.stringify(l), x);
      if (w.params) w.params = [A];
      else if (w.init) w.init.params = [A];
      else if (w?.arguments) w.arguments[0].params = [A];
      return oi(w, g);
    }
    function f(l) {
      let g = !1;
      for (let p of l) {
        const { key: h, value: x, type: b } = p;
        if (b === "RestElement") {
          (n.identifier = p.argument.name), (g = !0);
          continue;
        }
        if (h.type !== "Identifier" || x.type !== "Identifier") continue;
        if (h.name === n.effectName) (n.effectName = x.name), (g = !0);
        if (h.name === n.cleanupName) (n.cleanupName = x.name), (g = !0);
      }
      return g;
    }
  },
  si = function (e) {
    const { LOG_PREFIX: t } = U(),
      r = Object.keys(e[0]),
      n = r.map((i) => e.reduce((a, u) => Math.max(a, u[i].length), i.length));
    let o = [];
    o.push(r.map((i, a) => i.padEnd(n[a])).join(" | ")),
      o.push("-".repeat(n.reduce((i, a) => i + a + 3, 0)));
    for (let i of e) {
      const a = r.map((u, s) => i[u].padEnd(n[s]));
      o.push(a.join(" | "));
    }
    console.log(t.INFO), o.forEach((i) => console.log(t.INFO, i));
  },
  qe = function (e, t) {
    return Tn("Error")(e, t);
  },
  zt = function (e, t) {
    return Tn("Warning")(e, t);
  },
  ci = function (e, t) {
    const { BOOLEANS_IN_HTML: r } = U();
    function n(o, i) {
      if (i?.type === "TaggedTemplateExpression")
        return {
          ...i,
          quasi: {
            ...i.quasi,
            expressions: i.quasi.expressions.map((f) => {
              return Ye(f) ? de(f) : f;
            }),
          },
        };
      if (i?.type !== "CallExpression" || !et.has(i?.callee?.name ?? ""))
        return i;
      if (
        i.arguments[0].type === "Identifier" &&
        i.arguments[0].name !== "Fragment"
      ) {
        const f = [
          `You can't use "${i.arguments[0].name}" variable as a tag name.`,
          "Please use a string instead. You cannot use server-components inside web-components directly.",
          'You must use the "children" or slots in conjunction with the events to communicate with the server-components.',
        ];
        if (t) f.push(`File: ${t}`);
        qe(
          f,
          "Docs: https://brisa.build/docs/building-your-application/component-details/web-components",
        );
      }
      const a = i.arguments[0].value ?? null,
        u = i.arguments[1].properties,
        s = [];
      let c = [];
      if (i.arguments[2] && i.arguments[2]?.name !== "undefined")
        s.push({
          type: "Property",
          key: { type: "Identifier", name: "key" },
          value: i.arguments[2],
          shorthand: !1,
          computed: !1,
          method: !1,
          kind: "init",
          extra: { shorthand: !1 },
        });
      for (let f of u) {
        const l = f.key?.name ?? f.key?.object?.name;
        if (l === "children" || f?.key?.value === "children") {
          c = f.key.value ?? f.value;
          continue;
        }
        if (f?.type === "SpreadElement") {
          const g = [
            "You can't use spread props inside web-components JSX.",
            "This can cause the lost of reactivity.",
          ];
          if (t) g.push(`File: ${t}`);
          zt(
            g,
            "Docs: https://brisa.build/docs/building-your-application/component-details/web-components",
          );
        }
        if (r.has(l))
          if (((f.shorthand = !1), typeof f.value?.value === "boolean"))
            f.value = {
              type: "Identifier",
              name: f.value.value ? "_on" : "_off",
            };
          else
            f.value = {
              type: "ConditionalExpression",
              test: f.value,
              consequent: { type: "Identifier", name: "_on" },
              alternate: { type: "Identifier", name: "_off" },
            };
        if (l?.startsWith("on"))
          i = f.value?.type === "CallExpression" ? li(f.value) : f.value;
        else i = Ye(f.value, !0) ? de(f.value) : f.value;
        s.push({ ...f, value: i });
      }
      if (c.type === "ArrayExpression")
        c.elements = c.elements.map((f) => {
          if (et.has(f.callee?.name)) return f;
          return {
            type: "ArrayExpression",
            elements: [
              { type: "Literal", value: null },
              { type: "ObjectExpression", properties: {} },
              Ye(f) ? de(f) : f,
            ],
          };
        });
      const d = c?.type === "CallExpression" && et.has(c?.callee?.name ?? "");
      if (Ye(c, !d)) c = de(c);
      if (Array.isArray(c) && c.length === 0)
        c = { type: "Literal", value: "" };
      return {
        type: "ArrayExpression",
        elements: [
          { type: "Literal", value: a },
          { type: "ObjectExpression", properties: a == null ? {} : s },
          c,
        ],
      };
    }
    return JSON.parse(JSON.stringify(e, n));
  },
  Dn = function (e, t) {
    let r = e;
    while (t.has(r)) r += "$";
    return r;
  },
  fi = function (e) {
    const t = new Set([]);
    return (
      JSON.stringify(e, (r, n) => {
        if (n?.type === "VariableDeclarator" && n.id.name) t.add(n.id.name);
        if (
          n?.object?.type === "Identifier" &&
          n?.property?.type === "Identifier"
        )
          t.add(n?.object?.name);
        if (n?.init?.type === "Identifier" && n?.id?.properties) {
          t.add(n.init.name);
          for (let o of n.id.properties)
            if (o?.type === "RestElement") t.add(o.argument.name);
            else if (o?.key?.name) t.add(o.key.name);
        }
        return n;
      }),
      [...t]
    );
  },
  qn = function (e, t, r) {
    const n = new Map();
    return JSON.parse(
      JSON.stringify(e, function (o, i) {
        if (di(i) && i?.left?.object?.name === t) {
          if (i.right.type === "Identifier")
            return n.set(i.right.name, i?.left?.property?.name), i;
          i.right = r(i.right, i?.left?.property?.name);
        }
        if (mi(i))
          for (let a of i.arguments)
            for (let u of a?.properties ?? []) {
              if (!Gn.has(u?.key?.name)) continue;
              if (u.value.type === "Identifier")
                n.set(u.value.name, u?.key?.name);
              else u.value = r(u.value, u?.key?.name);
            }
        return i;
      }),
      function (o, i) {
        const a = this;
        if (gi(i, a, n)) a.init = r(a.init, n.get(i.name));
        return i;
      },
    );
  },
  hi = function (e) {
    return (
      e.body
        .find(
          (t) =>
            t.type === "ExportNamedDeclaration" &&
            t.declaration?.type === "VariableDeclaration" &&
            t.declaration?.declarations?.[0]?.id?.name === "props",
        )
        ?.declaration?.declarations?.[0]?.init?.elements?.map((t) => t.value) ??
      []
    );
  },
  yi = function (e, t = []) {
    const r = e?.params?.[0] ?? e?.declarations?.[0]?.init?.params?.[0],
      n = [],
      o = [];
    let i = {};
    if (r?.type === "ObjectPattern") {
      for (let u of r.properties) {
        if (u.type === "RestElement") {
          const [d, f, l] = xt(u.argument.name, e);
          n.push(...d), o.push(...f), (i = { ...i, ...l });
          continue;
        }
        const s = u.key.name,
          c = u.value.left?.name ?? u.value.name ?? s;
        if (c === lt && s === lt) continue;
        if ((o.push(c), n.push(s), u.value?.type === "AssignmentPattern"))
          i[c] = u.value.right;
      }
      const [, a] = xt("", e);
      return o.push(...a), [Je(n, t), Je(o, t), i];
    }
    if (r?.type === "Identifier") {
      const a = r.name,
        u = xt(a, e);
      return [Je(u[0], t), Je(u[1], t), u[2]];
    }
    return [t, t, {}];
  },
  Pi = function (e, t, r) {
    const n = e.params ?? e.declarations?.[0]?.init?.params ?? [],
      o = {
        type: "Property",
        key: { type: "Identifier", name: r },
        value: { type: "Identifier", name: t },
        kind: "init",
        computed: !1,
        method: !1,
        shorthand: t === r,
      };
    if (!n?.length) n.push({ type: "ObjectPattern", properties: [] });
    if (n?.length === 1) n.push({ type: "ObjectPattern", properties: [o] });
    else if (n[1]?.type === "ObjectPattern") {
      if (!n[1].properties.some((i) => i.key.name === r))
        n[1].properties.push(o);
    } else if (n[1]?.type === "Identifier") {
      const i = n[1];
      n[1] = {
        type: "ObjectPattern",
        properties: [o, { type: "RestElement", argument: i }],
      };
    }
    if (r === "effect" && r !== t) {
      for (let i of e.body.body) if (i.isEffect) i.expression.callee.name = t;
    }
  },
  Cr = function (e, t) {
    const r = fi(e),
      [n, o, i] = yi(e, t),
      a = new Set([...n, ...o, ...t]),
      u = new Set([...n, ...r]),
      s = Object.entries(i);
    ki(s, e, u);
    const c = e?.declarations?.[0],
      d = c?.init?.params ?? e?.params ?? [],
      f = e?.body ?? c?.init.body;
    for (let g of d[0]?.properties ?? []) {
      const p = g.value?.left?.name ?? g.value?.name ?? g.key?.name;
      if (
        g?.type !== "Property" ||
        !p ||
        !a.has(p) ||
        !i[p] ||
        g?.value?.right?.value !== i[p]?.value
      )
        continue;
      g.value = { type: "Identifier", name: p };
    }
    const l = JSON.parse(JSON.stringify(f), function (g, p) {
      if (this?.type === "VariableDeclarator" && this.id === p)
        return JSON.parse(JSON.stringify(p), (x, b) => {
          return b?.isSignal ? b.object : b;
        });
      const h = this?.type === "Property" && this?.key === p;
      if (
        p?.type === "Identifier" &&
        a.has(p?.name) &&
        !h &&
        !p?.name?.startsWith("on")
      ) {
        if (this?.type === "Property") this.shorthand = !1;
        return {
          type: "MemberExpression",
          object: p,
          property: { type: "Identifier", name: "value" },
          computed: !1,
          isSignal: !0,
        };
      }
      return p;
    });
    return { component: c ? { ...c?.init, body: l } : l, vars: u, props: n };
  },
  xi = function (e) {
    const [t, r, n] = Nn(e);
    if (!t)
      return {
        ast: e,
        componentName: "",
        props: [],
        vars: new Set(),
        statics: {},
      };
    const o = hi(e),
      i = {},
      a = n !== -1 ? n : r,
      u = Cr(t, o);
    let s = "Component";
    const c = {
      ...e,
      body: e.body.map((d, f) => {
        if (f !== a) return d;
        const l = "declaration" in d,
          g = l ? d?.declaration : d?.declarations?.[0];
        if (((s = g?.id?.name ?? Dn("Component", u.vars)), l))
          return { ...d, declaration: { ...g, body: u.component } };
        if (Array.isArray(d.declarations))
          return {
            ...d,
            declarations: [{ ...d.declarations[0], init: u.component }],
          };
        return { ...d, body: u.component };
      }),
    };
    return (
      qn(c, s, (d, f) => {
        const l = Cr(d, o);
        return (
          (i[f] = {
            ast: l.component,
            props: l.props,
            vars: l.vars,
            componentName: f,
          }),
          (d.body = l.component),
          d
        );
      }),
      { ast: c, componentName: s, props: u.props, vars: u.vars, statics: i }
    );
  },
  bi = function (e, t) {
    return {
      ...e,
      body: e.body.map((r) => {
        if (r.type === "ExportDefaultDeclaration")
          return {
            type: "VariableDeclaration",
            kind: "const",
            declarations: [
              {
                type: "VariableDeclarator",
                id: { type: "Identifier", name: t },
                init: r.declaration,
              },
            ],
          };
        return r;
      }),
    };
  },
  Ei = function (e) {
    let t = new Set(),
      r = !1,
      n = [],
      o = !1;
    const i = JSON.parse(JSON.stringify(e), function (a, u) {
      if (
        ((r ||= u?.type === "Identifier" && u?.name === "i18n"),
        u?.type === "CallExpression" &&
          ((u?.callee?.type === "Identifier" && u?.callee?.name === "t") ||
            (u?.callee?.property?.type === "Identifier" &&
              u?.callee?.property?.name === "t")))
      )
        if (u?.arguments?.[0]?.type === "Literal")
          t.add(u?.arguments?.[0]?.value);
        else n.push(u);
      if (
        u?.type === "ExpressionStatement" &&
        u.expression.left?.property?.name === "i18nKeys" &&
        u.expression?.right?.type === "ArrayExpression"
      ) {
        for (let s of u.expression.right.elements ?? [])
          t.add(s.value), (o = !0);
        return null;
      }
      if (Array.isArray(u)) return u.filter((s) => s);
      return u;
    });
    if (n.length > 0 && !o)
      zt(
        [
          "Addressing Dynamic i18n Key Export Limitations",
          "",
          `Code: ${n.map((a) => Or(vi(a))).join(", ")}`,
          "",
          "When using dynamic i18n keys like t(someVar) instead of",
          "literal keys such as t('example'), exporting these keys",
          "in the client code becomes challenging.",
          "",
          "Unfortunately, it is not feasible to export dynamic keys",
          "directly.",
          "",
          "To address this, it is crucial to specify these keys at",
          "web-component level. You can use RegExp. Here's an example:",
          "",
          "MyWebComponent.i18nKeys = ['footer', /projects.*title/];",
          "",
          "If you have any questions or need further assistance,",
          "feel free to contact us. We are happy to help!",
        ],
        "Docs: https://brisa.build/docs/building-your-application/routing/internationalization#translate-in-your-web-components",
      );
    if (!r) t = new Set();
    return { useI18n: r, i18nKeys: t, ast: i };
  },
  Ci = function (
    e,
    { usei18nKeysLogic: t, i18nAdded: r, isTranslateCoreAdded: n },
  ) {
    if (r && n) return e;
    const o = JSON.stringify({
      ...Kr.I18N_CONFIG,
      messages: void 0,
      pages: void 0,
    });
    let i = e.body;
    const a = Ir(`
    const i18nConfig = ${o};

    window.i18n = {
      ...i18nConfig,
      get locale(){ return document.documentElement.lang },
      ${t ? Ar : ""}
    }
  `);
    if (t && r && !n) {
      const u = Ir(`Object.assign(window.i18n, {${Ar}})`);
      i = [xr, ...e.body, ...u.body];
    } else if (t) i = [xr, ...e.body, ...a.body];
    else i = [...e.body, ...a.body];
    return { ...e, body: i };
  },
  Ni = function (e, t, r = Ai) {
    const n = t.startsWith(Nr);
    if (t.includes(Sn) && !n)
      return { code: e, useI18n: !1, i18nKeys: new Set() };
    let o = Ii(e),
      { useI18n: i, i18nKeys: a, ast: u } = Ei(o);
    if (i)
      u = Ci(u, {
        usei18nKeysLogic: a.size > 0,
        i18nAdded: r.isI18nAdded,
        isTranslateCoreAdded: r.isTranslateCoreAdded,
      });
    const s = j0(u),
      c = xi(s),
      d = ci(c.ast, t),
      f = new Set(c.props);
    let [l, g, p] = Nn(d);
    if (!l || (J0.test(t) && !n))
      return { code: bt(d), useI18n: i, i18nKeys: a };
    for (let { props: A = [] } of Object.values(c.statics ?? {}))
      for (let w of A) f.add(w);
    (l = br(Er(l, c.vars))),
      qn(d, c.componentName, (A, w) => {
        const I = wn(br(A), w);
        if (c.statics?.[w]) return Er(I, c.statics[w].vars);
        return I;
      });
    const [h, x, b] = ti(l, Array.from(f), c.componentName);
    if (((d.body[g].declaration = x), p !== -1)) d.body[p] = b;
    else d.body.splice(g, 0, b);
    if ((d.body.unshift(h), n)) {
      const A = t.split(Nr).at(-1);
      return { code: bt(bi(d, A)), useI18n: i, i18nKeys: a };
    }
    return { code: bt(d), useI18n: i, i18nKeys: a };
  },
  Si = function (e, t) {
    if (!e.includes("createContext") || !e.includes("brisa")) return e;
    const r = wi(e),
      n = globalThis.BrisaRegistry.has(t)
        ? globalThis.BrisaRegistry.get(t)
        : globalThis.BrisaRegistry.set(t, globalThis.BrisaRegistry.size).get(t);
    let o,
      i = 0;
    function a(c, d) {
      if (o) return d;
      if (d?.type === "ImportDeclaration" && d?.source?.value === "brisa") {
        for (let f of d?.specifiers ?? [])
          if (f?.imported?.name === "createContext")
            return (o = f?.local?.name), d;
      } else if (
        d?.type === "VariableDeclarator" &&
        d?.init?.callee?.name === "require"
      ) {
        if (d?.id?.type === "ObjectPattern") {
          for (let f of d?.id?.properties ?? [])
            if (f?.key?.name === "createContext")
              return (o = f?.value?.name), d;
        }
      }
      return d;
    }
    function u(c, d) {
      if (
        d?.type === "CallExpression" &&
        d?.callee?.name === o &&
        d.arguments?.length < 2
      ) {
        const f = { type: "Literal", value: `${n}:${i++}` },
          l = { type: "Identifier", name: "undefined" };
        d.arguments = d.arguments.length === 0 ? [l, f] : [d.arguments[0], f];
      }
      return d;
    }
    const s = JSON.parse(JSON.stringify(r, a), u);
    return Ri(s);
  },
  On = function () {
    return {
      name: "context-plugin",
      setup(e) {
        e.onLoad(
          { filter: new RegExp(".*/src/.*\\.(tsx|jsx|js|ts)") },
          async ({ path: t, loader: r }) => {
            let n = await Bun.file(t).text();
            try {
              n = Si(n, t);
            } catch (o) {
              qe([
                `It was not possible to generate a contextID in ${t}`,
                o.message,
              ]);
            }
            return { contents: n, loader: r };
          },
        );
      },
    };
  },
  $e = function (e) {
    return e.toLowerCase().replace(Di, Ti);
  },
  Sr = function (e, t) {
    const r = {};
    let n = !1,
      o = !1,
      i = !1;
    return (
      JSON.stringify(e, (a, u) => {
        const s = u?.arguments?.[0]?.value ?? "",
          c = t[s],
          d =
            u?.type === "CallExpression" &&
            u?.callee?.type === "Identifier" &&
            u?.arguments?.[0]?.type === "Literal",
          f = c && d;
        if (d && s === "context-provider") {
          const l = u?.arguments?.[1]?.properties?.find?.(
            (g) => g?.key?.name === "serverOnly",
          );
          i ||= l?.value?.value !== !0;
        }
        if (f) r[s] = c;
        return (
          (o ||= u === "data-action"),
          (n ||=
            u?.type === "ExpressionStatement" &&
            u?.expression?.operator === "=" &&
            u?.expression?.left?.property?.name === "suspense"),
          u
        );
      }),
      { webComponents: r, useSuspense: n, useContextProvider: i, useActions: o }
    );
  };
async function wr(e) {
  return qi.parseCodeToAST(await Bun.file(e).text());
}
async function Gi({
  webComponentsList: e,
  useContextProvider: t,
  integrationsPath: r,
}) {
  const {
      SRC_DIR: n,
      BUILD_DIR: o,
      CONFIG: i,
      LOG_PREFIX: a,
      IS_PRODUCTION: u,
    } = U(),
    s = rr(o, "_brisa"),
    c = rr(s, `temp-${crypto.randomUUID()}.ts`);
  let d = !1,
    f = new Set();
  const l = Object.values(e);
  let g = !1,
    p = Object.entries(e)
      .map((E) => `import ${$e(E[0])} from "${E[1]}";`)
      .join("\n");
  if (r) {
    if ((await import(r)).webContextPlugins?.length > 0)
      (g = !0), (p += `import {webContextPlugins} from "${r}";`);
  }
  const h =
      "const defineElement = (name, component) => name && customElements.define(name, component);",
    x = Object.keys(e);
  if (t) x.unshift("context-provider");
  const b = x.length,
    A = x
      .map((E) =>
        b === 1
          ? `if(${$e(E)}) customElements.define("${E}", ${$e(E)})`
          : `defineElement("${E}", ${$e(E)});`,
      )
      .join("\n");
  let w = "";
  if (t) {
    const E = await `// src/utils/context-provider/client.tsx
import {brisaElement} from "brisa/client";
var ClientContextProvider = function({ children, context, value, pid, cid }, { effect, self, store }) {
  const cId = cid.value ?? context.value.id;
  let pId = pid.value;
  if (!pId) {
    pId = (window._pid ?? -1) + 1;
    window._pid = pId;
  }
  effect((r) => {
    self.setAttribute("cid", cId);
    self.setAttribute("pid", pId + "");
    store.set(\`context:\${cId}:\${pId}\`, value.value ?? context.value.defaultValue);
  });
  return () => children;
};
var contextProvider = brisaElement(ClientContextProvider, ["context", "value", "pid", "cid"]);
`;
    w += E;
  }
  if (((w += `${p}\n`), g)) w += "window._P=webContextPlugins;\n";
  (w += b === 1 ? A : `${h}\n${A};`), await lo(c, w);
  const I = {};
  for (let E in Bun.env)
    if (E.startsWith(Li)) I[`process.env.${E}`] = Bun.env[E] ?? "";
  const {
    success: S,
    logs: P,
    outputs: B,
  } = await Bun.build({
    entrypoints: [c],
    root: n,
    target: "browser",
    minify: u,
    define: {
      __DEV__: (!u).toString(),
      __WEB_CONTEXT_PLUGINS__: g.toString(),
      ...I,
    },
    plugins: [
      {
        name: "client-build-plugin",
        setup(E) {
          E.onLoad(
            {
              filter: new RegExp(
                `(.*/src/web-components/(?!_integrations).*\\.(tsx|jsx|js|ts)|${l.join(
                  "|",
                )})$`,
              ),
            },
            async ({ path: R, loader: N }) => {
              let X = await Bun.file(R).text();
              try {
                const K = Ni(X, R, {
                  isI18nAdded: d,
                  isTranslateCoreAdded: f.size > 0,
                });
                (X = K.code),
                  (d ||= K.useI18n),
                  (f = new Set([...f, ...K.i18nKeys]));
              } catch (K) {
                console.log(a.ERROR, `Error transforming ${R}`),
                  console.log(a.ERROR, K.message);
              }
              return { contents: X, loader: N };
            },
          );
        },
      },
      On(),
      ...(i?.plugins ?? []),
    ],
  });
  if ((await so(c), !S)) return P.forEach((E) => console.error(E)), null;
  return { code: await B[0].text(), size: B[0].size, useI18n: d, i18nKeys: f };
}
async function Vi(e, t = {}, r = {}, n) {
  let o = 0,
    i = "";
  const a = await wr(e);
  let { useSuspense: u, useContextProvider: s, useActions: c } = Sr(a, t);
  const d = await Promise.all(
    Object.values(r).map(async (h) => Sr(await wr(h), t)),
  );
  for (let h of d)
    (s ||= h.useContextProvider),
      (u ||= h.useSuspense),
      Object.assign(r, h.webComponents);
  const f = u ? Oi : "",
    l = c ? _i : "",
    g = c ? Fi : "";
  if (((o += f.length), (o += l.length), !Object.keys(r).length))
    return {
      code: i,
      unsuspense: f,
      actionRPC: l,
      actionRPCLazy: g,
      size: o,
      useI18n: !1,
      i18nKeys: new Set(),
    };
  const p = await Gi({
    webComponentsList: r,
    useContextProvider: s,
    integrationsPath: n,
  });
  if (!p) return null;
  return (
    (i += p?.code),
    (o += p?.size ?? 0),
    {
      code: i,
      unsuspense: f,
      actionRPC: l,
      actionRPCLazy: g,
      size: o,
      useI18n: p.useI18n,
      i18nKeys: p.i18nKeys,
    }
  );
}
import Bi from "fs";
var Rr = function (e) {
  if (!Bi.existsSync(e)) return [];
  const t = new Bun.FileSystemRouter({ style: "nextjs", dir: e });
  return Object.values(t.routes);
};
import Xi from "fs";
import Ki from "path";
async function Mi(e, t) {
  const r = Ki.join(e, "web-components");
  if (!Xi.existsSync(r)) return {};
  const n = new Bun.FileSystemRouter({ style: "nextjs", dir: r }),
    o = new Set(),
    i = Object.entries(n.routes);
  if (t)
    i.push(
      ...Object.entries(await import(t).then((a) => a.default ?? {})).map(
        ([a, u]) => [a, import.meta.resolveSync(u, t)],
      ),
    );
  return Object.fromEntries(
    i
      .filter(([a]) => !a.includes(Ut) || a.includes(Sn))
      .map(([a, u]) => {
        const s = a.replace(/^\/(_)?/g, "").replaceAll("/", "-");
        if (s === Tr)
          qe([
            `You can't use the reserved name "${Tr}"`,
            "Please, rename it to avoid conflicts.",
          ]);
        else if (o.has(s))
          qe([
            `You have more than one web-component with the same name: "${s}"`,
            "Please, rename one of them to avoid conflicts.",
          ]);
        else o.add(s);
        return [s, u];
      }),
  );
}
var Wi = function (e, t) {
    function r(n, o) {
      try {
        if (o?.type === "ImportDeclaration")
          o.source.value = import.meta.resolveSync(o.source.value, t);
        if (
          o?.callee?.name === "require" &&
          o?.arguments?.[0]?.type === "Literal"
        )
          o.arguments = [
            {
              type: "Literal",
              value: import.meta.resolveSync(o.arguments[0].value, t),
            },
          ];
        if (o?.type === "ImportExpression" && o?.source?.type === "Literal")
          o.source.value = import.meta.resolveSync(o.source.value, t);
      } catch (i) {
        qe(["Error resolving import path:", i.message]);
      }
      return o;
    }
    return JSON.parse(JSON.stringify(e, r));
  },
  Ji = function (e, { allWebComponents: t, fileID: r, path: n }) {
    const { IS_PRODUCTION: o, CONFIG: i } = U(),
      a = Hi(e),
      u = i.output === "server",
      s = u || !o,
      c = ji.test(n),
      d = {},
      f = new Map();
    let l = 1,
      g = 1,
      p = !1,
      h = JSON.parse(
        JSON.stringify(a, (x, b) => {
          const A = b?.type === "CallExpression" && zi.has(b?.callee?.name);
          if (s && A && !c) {
            const w = [],
              I = b.arguments[1]?.properties ?? [];
            for (let S of I) {
              const P = S?.key?.name?.startsWith("on");
              if (P) p = !0;
              if (P && u)
                w.push({
                  type: "Property",
                  key: {
                    type: "Literal",
                    value: `data-action-${S?.key?.name?.toLowerCase()}`,
                  },
                  value: { type: "Literal", value: `${r}_${l++}` },
                  kind: "init",
                  computed: !1,
                  method: !1,
                  shorthand: !1,
                });
            }
            if (w.length) {
              const S = {
                type: "Property",
                key: { type: "Literal", value: "data-action" },
                value: { type: "Literal", value: !0 },
                kind: "init",
                computed: !1,
                method: !1,
                shorthand: !1,
              };
              b.arguments[1].properties = [...I, ...w, S];
            }
          }
          if (
            A &&
            b?.arguments?.[0]?.type === "Literal" &&
            t[b?.arguments?.[0]?.value]
          ) {
            const w = b?.arguments?.[0]?.value,
              I = t[w];
            if (((d[w] = I), w?.startsWith("native-"))) return b;
            if (
              b?.arguments?.[1]?.properties?.some(
                (P) => P?.key?.name === "skipSSR" && P?.value?.value !== !1,
              )
            )
              return b;
            const S = f.get(I) ?? `_Brisa_WC${g++}`;
            f.set(I, S),
              (b.arguments[0] = {
                type: "Identifier",
                name: "_Brisa_SSRWebComponent",
              }),
              (b.arguments[1] = {
                type: "ObjectExpression",
                properties: [
                  {
                    type: "Property",
                    key: { type: "Identifier", name: "Component" },
                    value: { type: "Identifier", name: S },
                    kind: "init",
                    computed: !1,
                    method: !1,
                    shorthand: !1,
                  },
                  {
                    type: "Property",
                    key: { type: "Identifier", name: "selector" },
                    value: { type: "Literal", value: w },
                    kind: "init",
                    computed: !1,
                    method: !1,
                    shorthand: !1,
                  },
                  ...(b.arguments[1]?.properties ?? []),
                ],
              });
          }
          return b;
        }),
      );
    if (!u && p)
      zt([
        `Actions are not supported with the "output": "${i.output}" option.`,
        "",
        `The warn arises in: ${n}`,
        "",
        "This limitation is due to the requirement of a server infrastructure for the proper functioning",
        "of server actions.",
        "",
        'To resolve this, ensure that the "output" option is set to "server" when using server actions.',
        "",
        "Feel free to reach out if you have any further questions or encounter challenges during this process.",
        "",
        "Documentation: https://brisa.build/docs/components-details/server-actions",
      ]),
        (p = !1);
    else if (p) h = Wi(h, n);
    if (
      (h.body.unshift(
        ...Array.from(f.entries()).map(([x, b]) => ({
          type: "ImportDeclaration",
          specifiers: [
            {
              type: "ImportDefaultSpecifier",
              local: { type: "Identifier", name: b },
            },
          ],
          source: { type: "Literal", value: x },
        })),
      ),
      f.size)
    )
      h.body.unshift({
        type: "ImportDeclaration",
        specifiers: [
          {
            type: "ImportSpecifier",
            imported: { type: "Identifier", name: "SSRWebComponent" },
            local: { type: "Identifier", name: "_Brisa_SSRWebComponent" },
          },
        ],
        source: { type: "Literal", value: "brisa/server" },
      });
    return { code: Ui(h) + Yi, detectedWebComponents: d, hasActions: p };
  },
  Fn = function (e, t = []) {
    const r = e.replace(Zi, "").split($i);
    if (r.length === 1) return e;
    const n = [],
      o = r.shift();
    if (o) n.push(o);
    const i = _n(r);
    for (let [a, u, s] of i) {
      const c = t[a] || ke(Mr, {}, void 0, !1, void 0, this),
        d = {
          ...c,
          props: {
            ...(c.props ?? {}),
            children: u ? Fn(u, t) : c.props.children,
          },
        };
      if ((n.push(d), s)) n.push(s);
    }
    return n;
  },
  ea = function (e, t) {
    const { allowEmptyStrings: r = !0 } = t,
      n = new Intl.PluralRules(e),
      o = (u, s) => {
        if (Array.isArray(u)) return u.map((c) => o(c, s));
        if (u instanceof Object)
          return Vn({ obj: u, query: s, config: t, locale: e });
        return Ln({ text: u, query: s, config: t, locale: e });
      },
      i = (u = "", s, c) => {
        const d = t._messages || {},
          f = { ...(t.messages?.[e] || {}), ...d },
          l = Qi(n, f, u, t, s),
          g = Ne(f, l, t, c),
          p = typeof g === "object" ? JSON.parse(JSON.stringify(g)) : g,
          h =
            typeof p === "undefined" ||
            (typeof p === "object" && !Object.keys(p).length) ||
            (p === "" && !r),
          x =
            typeof c?.fallback === "string" ? [c.fallback] : c?.fallback || [];
        if (h && Array.isArray(x) && x.length) {
          const [b, ...A] = x;
          if (typeof b === "string") return a(b, s, { ...c, fallback: A });
        }
        if (h && c && c.hasOwnProperty("default") && !x?.length)
          return c.default ? o(c.default, s) : c.default;
        if (h) return u;
        return o(p, s);
      },
      a = (u = "", s, c) => {
        const d = i(u, s, c);
        return c?.elements ? Fn(d, c.elements) : d;
      };
    return a;
  },
  ra = function (e, t) {
    const r = U().I18N_CONFIG ?? {},
      n = r.messages?.[e] ?? {},
      o = new Set(),
      i = ea(e, r),
      a = ta(t, n);
    for (let u of a) {
      const s = new String(u);
      s.__isI18nKey = !0;
      const c = i(u, null, { returnObjects: !0 });
      if (c.__isI18nKey) continue;
      if (typeof c === "string") {
        o.add(c);
        continue;
      }
      JSON.stringify(c, (d, f) => {
        if (typeof f === "string") o.add(f);
        return f;
      });
    }
    return JSON.parse(JSON.stringify(n), (u, s) => {
      if (Array.isArray(s) && !s.filter((c) => c).length) return;
      if (
        typeof s === "object" &&
        s.constructor === Object &&
        Object.keys(s).length === 0
      )
        return;
      return typeof s !== "string" || o.has(s) ? s : void 0;
    });
  };
import na from "fs";
import { join as Dr } from "path";
var oa = function (e) {
    const t = new Set(),
      r = [];
    return (
      JSON.stringify(e, (n, o) => {
        if (Gr.has(o?.type))
          JSON.stringify(o, function (i, a) {
            if (
              a?.type === "Property" &&
              a?.key?.value?.startsWith?.("data-action-")
            ) {
              const u = a?.key?.value
                  ?.replace?.("data-action-", "")
                  ?.toLowerCase(),
                s = a?.value?.value;
              if (t.has(s)) return a;
              const c = this.find?.(
                (d) => d?.key?.name?.toLowerCase() === u,
              )?.value;
              t.add(s),
                r.push({
                  actionId: s,
                  componentFnExpression: o,
                  actionFnExpression: Gr.has(c?.type) ? c : void 0,
                  actionIdentifierName:
                    c?.type === "Identifier" ? c?.name : void 0,
                });
            }
            return a;
          });
        return o;
      }),
      r
    );
  },
  ia = function (e) {
    const t = new Set();
    return (
      JSON.stringify(e, (r, n) => {
        if (n?.type === "CallExpression") return null;
        if (n?.type === "ReturnStatement") t.add(n);
        return n;
      }),
      t
    );
  },
  aa = function (e) {
    const t = ia(e);
    return JSON.parse(
      JSON.stringify(e, (r, n) => (t.has(n) ? null : n)),
      (r, n) => {
        if (Array.isArray(n)) return n.filter((o) => o !== null);
        return n;
      },
    );
  },
  ua = function (e, t) {
    let r = !1;
    return (
      JSON.stringify(e, function (n, o) {
        if (
          o?.type === "AwaitExpression" &&
          (this?.type !== "VariableDeclarator" || !t.has(this.id.name))
        )
          return;
        if (
          o?.type === "CallExpression" &&
          this?.type === "ExpressionStatement"
        )
          return;
        if (o?.type === "Identifier" && t.has(o.name)) r = !0;
        return o;
      }),
      r
    );
  },
  sa = function (e) {
    const t = new Set();
    if (!e) return t;
    return (
      JSON.stringify(e, (r, n) => {
        if (n?.type === "Identifier") t.add(n.name);
        return n;
      }),
      t
    );
  },
  la = function (e) {
    const t = new Map();
    if (!e) return t;
    function r(n) {
      const o = new Set();
      return (
        JSON.stringify(n, (i, a) => {
          if (a?.type === "Identifier") {
            if ((o.add(a.name), t.has(a.name)))
              for (let u of t.get(a.name)) o.add(u);
          }
          return a;
        }),
        o
      );
    }
    return (
      JSON.stringify(e, (n, o) => {
        if (o?.type !== "VariableDeclarator") return o;
        if (o.id.type === "ObjectPattern")
          for (let i of o.id.properties) t.set(i.key.name, r(i.value));
        else if (o.id.type === "Identifier") t.set(o.id.name, r(o.init));
        return o;
      }),
      t
    );
  },
  ca = function (e) {
    const t = { type: "BlockStatement", body: [] },
      r = e.componentFnExpression?.body ?? t,
      n = la(r),
      o = e.actionFnExpression ?? fa(e),
      i = sa(o),
      a = new Set();
    for (let [u, s] of n) {
      if (!i.has(u)) continue;
      a.add(u);
      for (let c of s) a.add(c);
    }
    return {
      ...r,
      body: aa(r.body ?? [r]).filter((u) => {
        return u.__isActionFn || ua(u, a);
      }),
    };
  },
  ma = function (e) {
    let t = ba(e);
    (t = ga(t)), (t = pa(t));
    const r = oa(t);
    for (let n of r) {
      const o = ha(n);
      t.body.push(o);
    }
    return va(t);
  };
async function Ia({ actionsEntrypoints: e, define: t }) {
  const { BUILD_DIR: r, IS_PRODUCTION: n } = U(),
    o = Dr(r, "actions_raw"),
    i = await Bun.build({
      entrypoints: e,
      outdir: Dr(r, "actions"),
      sourcemap: n ? void 0 : "inline",
      root: o,
      target: "bun",
      minify: n,
      splitting: !0,
      define: t,
      plugins: [da({ actionsEntrypoints: e })],
    });
  return na.rmSync(o, { recursive: !0 }), i;
}
async function Aa(
  e,
  { allWebComponents: t, webComponentsPerEntrypoint: r, integrationsPath: n },
) {
  const { BUILD_DIR: o, I18N_CONFIG: i } = U(),
    a = J(o, "pages-client"),
    u = J(o, "_brisa");
  if (le.existsSync(a)) le.rmSync(a, { recursive: !0 });
  if ((le.mkdirSync(a), !le.existsSync(u))) le.mkdirSync(u);
  const s = {};
  for (let d of e) {
    const f = d.path.replace(o, ""),
      l = d.path,
      g = l.replace("pages", "pages-client"),
      p = await Vi(l, t, r[l], n);
    if (!p) return null;
    const {
      size: h,
      code: x,
      unsuspense: b,
      actionRPC: A,
      actionRPCLazy: w,
      useI18n: I,
      i18nKeys: S,
    } = p;
    if (((s[f] = h), !h)) continue;
    const P = Bun.hash(x),
      B = g.replace(".js", `-${P}.js`),
      E = Et(new TextEncoder().encode(x));
    if (
      ((s[f] = 0),
      (s[f] += vt(b, "_unsuspense", { pagesClientPath: a, pagePath: l })),
      (s[f] += vt(A, "_rpc", { pagesClientPath: a, pagePath: l })),
      (s[f] += vt(w, "_rpc-lazy", {
        pagesClientPath: a,
        pagePath: l,
        skipList: !0,
      })),
      !x)
    )
      continue;
    if (I && S.size && i?.messages)
      for (let R of i?.locales ?? []) {
        const N = B.replace(".js", `-${R}.js`),
          X = ra(R, S),
          K = `window.i18nMessages=${JSON.stringify(X)};`;
        Bun.write(N, K), Bun.write(`${N}.gz`, Et(new TextEncoder().encode(K)));
      }
    Bun.write(g.replace(".js", ".txt"), P.toString()),
      Bun.write(B, x),
      Bun.write(`${B}.gz`, E),
      (s[f] += E.length);
  }
  const c = `export interface IntrinsicCustomElements {
  ${Object.entries(t)
    .map(
      ([d, f]) =>
        `'${d}': JSX.WebComponentAttributes<typeof import("${f}").default>;`,
    )
    .join("\n")}
}`;
  return Bun.write(J(u, "types.ts"), c), s;
}
async function Na() {
  const {
      SRC_DIR: e,
      BUILD_DIR: t,
      CONFIG: r,
      IS_PRODUCTION: n,
      LOG_PREFIX: o,
      IS_STATIC_EXPORT: i,
    } = U(),
    a = J(e, "web-components"),
    u = J(e, "pages"),
    s = J(e, "api"),
    c = Rr(u),
    d = Rr(s),
    f = Pe("middleware", e),
    l = Pe("websocket", e),
    g = Pe("layout", e),
    p = Pe("i18n", e),
    h = Pe("_integrations", a),
    x = await Mi(e, h),
    b = [...c, ...d],
    A = {},
    w = [],
    I = { __DEV__: (!n).toString() };
  if (f) b.push(f);
  if (g) b.push(g);
  if (p) b.push(p);
  if (l) b.push(l);
  if (h) b.push(h);
  const {
    success: S,
    logs: P,
    outputs: B,
  } = await Bun.build({
    entrypoints: b,
    outdir: t,
    sourcemap: n ? void 0 : "inline",
    root: e,
    target: "bun",
    minify: n,
    splitting: !0,
    define: I,
    plugins: [
      {
        name: "server-components",
        setup(R) {
          let N = 1;
          R.onLoad(
            { filter: /\.(tsx|jsx)$/ },
            async ({ path: X, loader: K }) => {
              let L = await Bun.file(X).text();
              try {
                const Be = `a${N}`,
                  Xe = Ji(L, { path: X, allWebComponents: x, fileID: Be }),
                  Kn = X.replace(e, t).replace(/\.tsx?$/, ".js");
                if (Xe.hasActions) {
                  const Yt = J(t, "actions_raw", `${Be}.${K}`);
                  w.push(Yt), (N += 1), await Bun.write(Yt, Xe.code);
                }
                (L = Xe.code), (A[Kn] = Xe.detectedWebComponents);
              } catch (Be) {
                console.log(o.ERROR, `Error transforming ${X}`),
                  console.log(o.ERROR, Be.message);
              }
              return { contents: L, loader: K };
            },
          );
        },
      },
      On(),
      ...(r?.plugins ?? []),
    ],
  });
  if (!S) return { success: S, logs: P, pagesSize: {} };
  if (w.length) {
    const R = await Ia({ actionsEntrypoints: w, define: I });
    if (!R.success) P.push(...R.logs);
  }
  const E = await Aa(B, {
    allWebComponents: x,
    webComponentsPerEntrypoint: A,
    integrationsPath: h,
  });
  if (!E)
    return {
      success: !1,
      logs: ["Error compiling web components"],
      pagesSize: E,
    };
  if (!n || i) return { success: S, logs: P, pagesSize: E };
  if (
    (si(
      B.map((R) => {
        const N = R.path.replace(t, ""),
          X = N.startsWith("/chunk-"),
          K = N.startsWith("/pages");
        let L = "\u03BB";
        if (X) L = "\u03A6";
        else if (N.startsWith("/middleware")) L = "\u0192";
        else if (N.startsWith("/layout")) L = "\u0394";
        else if (N.startsWith("/i18n")) L = "\u03A9";
        else if (N.startsWith("/websocket")) L = "\u03A8";
        else if (N.startsWith("/web-components/_integrations")) L = "\u0398";
        return {
          Route: `${L} ${N.replace(".js", "")}`,
          "JS server": tr(R.size, 0),
          "JS client (gz)": K ? tr(E[N] ?? 0, 0, !0) : "",
        };
      }),
    ),
    console.log(o.INFO),
    console.log(o.INFO, "\u03BB  Server entry-points"),
    g)
  )
    console.log(o.INFO, "\u0394  Layout");
  if (f) console.log(o.INFO, "\u0192  Middleware");
  if (p) console.log(o.INFO, "\u03A9  i18n");
  if (l) console.log(o.INFO, "\u03A8  Websocket");
  if (h)
    console.log(o.INFO, "\u0398  Web components integrations"),
      console.log(o.INFO, "\t- client code already included in each page"),
      console.log(o.INFO, "\t- server code is used for SSR"),
      console.log(o.INFO);
  return (
    console.log(o.INFO, "\u03A6  JS shared by all"),
    console.log(o.INFO),
    { success: S, logs: P, pagesSize: E }
  );
}
async function Sa() {
  await ao();
  const { success: e, logs: t, pagesSize: r } = await Na();
  if (!e) t.forEach((n) => console.error(n));
  return { success: e, logs: t, pagesSize: r };
}
async function Xn(e) {
  (tt = !0), globalThis.Loader.registry.clear();
  const t = Bun.nanoseconds(),
    r = await Sa(),
    n = ((Bun.nanoseconds() - t) / 1e6).toFixed(2);
  if (!r) {
    console.log(ct.ERROR, `failed to recompile ${e}`), (tt = !1);
    return;
  }
  if (
    (console.log(ct.READY, `hot reloaded successfully in ${n}ms`),
    !globalThis.brisaServer)
  )
    return;
  if ((globalThis.brisaServer.publish("hot-reload", Ra), rt)) {
    let o = rt;
    (rt = ""), await Xn(o);
  }
  tt = !1;
}
var Or = (e) => e.replace(/\s*\n\s*/g, ""),
  _r = (e) => e.children;
_r.__isFragment = !0;
var Jt = "0.0.27",
  nt = (e) => (Bun.enableANSIColors ? `\x1B[32m${e}\x1B[0m` : e),
  Fr = (e) => (Bun.enableANSIColors ? `\x1B[33m${e}\x1B[0m` : e),
  Lr = (e) => (Bun.enableANSIColors ? `\x1B[31m${e}\x1B[0m` : e),
  Hn = (e) => (Bun.enableANSIColors ? `\x1B[34m${e}\x1B[0m` : e),
  Un = (e) => (Bun.enableANSIColors ? `\x1B[36m${e}\x1B[0m` : e),
  ft = process.cwd(),
  zn = new Set(["static", "desktop", "android", "ios"]),
  jn = Te.join(ft, "src"),
  Se = process.env.BRISA_BUILD_FOLDER ?? Te.join(ft, "build"),
  $t = "/_404",
  Zt = "/_500",
  Yn = await wt("_integrations", Te.join(Se, "web-components")),
  we = (await wt("i18n", Se))?.default,
  Qt = (await wt("brisa.config", ft))?.default ?? {};
if (we?.pages)
  we.pages = JSON.parse(
    JSON.stringify(we.pages, (e, t) =>
      typeof t === "string" && t.length > 1 ? t.replace(/\/$/g, "") : t,
    ),
  );
var Jn = { trailingSlash: !1, assetPrefix: "", plugins: [], output: "server" },
  $n = new Set([
    "allowfullscreen",
    "async",
    "autofocus",
    "autoplay",
    "checked",
    "controls",
    "default",
    "disabled",
    "formnovalidate",
    "hidden",
    "indeterminate",
    "ismap",
    "loop",
    "multiple",
    "muted",
    "nomodule",
    "novalidate",
    "open",
    "playsinline",
    "readonly",
    "required",
    "reversed",
    "seamless",
    "selected",
    "data-action",
  ]),
  { NODE_ENV: Vr } = process.env,
  Br = process.argv.some((e) => e === "PROD") || Vr === "production",
  Zn =
    '<script>(()=>{let u=new URL(location.href);u.searchParams.set("_not-found","1"),location.replace(u.toString())})()</script>',
  Qn = Br ? "public, max-age=31536000, immutable" : "no-store, must-revalidate",
  Xr = {
    PAGE_404: $t,
    PAGE_500: Zt,
    VERSION: Jt,
    VERSION_HASH: Bun.hash(Jt),
    WEB_CONTEXT_PLUGINS: Yn?.webContextPlugins ?? [],
    RESERVED_PAGES: [$t, Zt],
    IS_PRODUCTION: Br,
    IS_DEVELOPMENT:
      process.argv.some((e) => e === "DEV") || Vr === "development",
    PORT: parseInt(process.argv[2]) || 0,
    BUILD_DIR: Se,
    ROOT_DIR: ft,
    SRC_DIR: jn,
    ASSETS_DIR: Te.join(Se, "public"),
    PAGES_DIR: Te.join(Se, "pages"),
    I18N_CONFIG: we,
    LOG_PREFIX: {
      WAIT: Un("[ wait ]") + " ",
      READY: nt("[ ready ] ") + " ",
      INFO: Hn("[ info ] ") + " ",
      ERROR: Lr("[ error ] ") + " ",
      WARN: Fr("[ warn ] ") + " ",
      TICK: nt("\u2713 ") + " ",
    },
    LOCALES_SET: new Set(we?.locales || []),
    CONFIG: { ...Jn, ...Qt },
    IS_STATIC_EXPORT: zn.has(Qt?.output),
    REGEX: {
      CATCH_ALL: /\[\[\.{3}.*?\]\]/g,
      DYNAMIC: /\[.*?\]/g,
      REST_DYNAMIC: /\[\.{3}.*?\]/g,
    },
    SCRIPT_404: Zn,
    BOOLEANS_IN_HTML: $n,
    HEADERS: { CACHE_CONTROL: Qn },
  },
  U = () => (globalThis.mockConstants ? globalThis.mockConstants : Xr),
  Kr = Xr,
  Mr = (e) => e.children,
  ke = (e, t) => ({ type: e, props: t });
Mr.__isFragment = !0;
var eo = Symbol.for("AVOID_DECLARATIVE_SHADOW_DOM"),
  Ae = () => {};
Rt.__isWebComponent = !0;
var { gzipSync: no } = globalThis.Bun,
  { gzipSync: Et } = globalThis.Bun,
  uo = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
  ye = function (e, t) {
    const { generator: r } = e;
    if ((e.write("("), t != null && t.length > 0)) {
      r[t[0].type](t[0], e);
      const { length: n } = t;
      for (let o = 1; o < n; o++) {
        const i = t[o];
        e.write(", "), r[i.type](i, e);
      }
    }
    e.write(")");
  },
  Hr = function (e, t, r, n) {
    const o = e.expressionsPrecedence[t.type];
    if (o === te) return !0;
    const i = e.expressionsPrecedence[r.type];
    if (o !== i)
      return (!n && o === 15 && i === 14 && r.operator === "**") || o < i;
    if (o !== 13 && o !== 14) return !1;
    if (t.operator === "**" && r.operator === "**") return !n;
    if (o === 13 && i === 13 && (t.operator === "??" || r.operator === "??"))
      return !0;
    if (n) return We[t.operator] <= We[r.operator];
    return We[t.operator] < We[r.operator];
  },
  Me = function (e, t, r, n) {
    const { generator: o } = e;
    if (Hr(e, t, r, n)) e.write("("), o[t.type](t, e), e.write(")");
    else o[t.type](t, e);
  },
  co = function (e, t, r, n) {
    const o = t.split("\n"),
      i = o.length - 1;
    if ((e.write(o[0].trim()), i > 0)) {
      e.write(n);
      for (let a = 1; a < i; a++) e.write(r + o[a].trim() + n);
      e.write(r + o[i].trim());
    }
  },
  W = function (e, t, r, n) {
    const { length: o } = t;
    for (let i = 0; i < o; i++) {
      const a = t[i];
      if ((e.write(r), a.type[0] === "L"))
        e.write("// " + a.value.trim() + "\n", a);
      else e.write("/*"), co(e, a.value, r, n), e.write("*/" + n);
    }
  },
  fo = function (e) {
    let t = e;
    while (t != null) {
      const { type: r } = t;
      if (r[0] === "C" && r[1] === "a") return !0;
      else if (r[0] === "M" && r[1] === "e" && r[2] === "m") t = t.object;
      else return !1;
    }
  },
  Pt = function (e, t) {
    const { generator: r } = e,
      { declarations: n } = t;
    e.write(t.kind + " ");
    const { length: o } = n;
    if (o > 0) {
      r.VariableDeclarator(n[0], e);
      for (let i = 1; i < o; i++) e.write(", "), r.VariableDeclarator(n[i], e);
    }
  },
  { stringify: go } = JSON;
if (!String.prototype.repeat)
  throw new Error(
    "String.prototype.repeat is undefined, see https://github.com/davidbonnet/astring#installation",
  );
if (!String.prototype.endsWith)
  throw new Error(
    "String.prototype.endsWith is undefined, see https://github.com/davidbonnet/astring#installation",
  );
var We = {
    "||": 2,
    "??": 3,
    "&&": 4,
    "|": 5,
    "^": 6,
    "&": 7,
    "==": 8,
    "!=": 8,
    "===": 8,
    "!==": 8,
    "<": 9,
    ">": 9,
    "<=": 9,
    ">=": 9,
    in: 9,
    instanceof: 9,
    "<<": 10,
    ">>": 10,
    ">>>": 10,
    "+": 11,
    "-": 11,
    "*": 12,
    "%": 12,
    "/": 12,
    "**": 13,
  },
  te = 17,
  po = {
    ArrayExpression: 20,
    TaggedTemplateExpression: 20,
    ThisExpression: 20,
    Identifier: 20,
    PrivateIdentifier: 20,
    Literal: 18,
    TemplateLiteral: 20,
    Super: 20,
    SequenceExpression: 20,
    MemberExpression: 19,
    ChainExpression: 19,
    CallExpression: 19,
    NewExpression: 19,
    ArrowFunctionExpression: te,
    ClassExpression: te,
    FunctionExpression: te,
    ObjectExpression: te,
    UpdateExpression: 16,
    UnaryExpression: 15,
    AwaitExpression: 15,
    BinaryExpression: 14,
    LogicalExpression: 13,
    ConditionalExpression: 4,
    AssignmentExpression: 3,
    YieldExpression: 2,
    RestElement: 1,
  },
  nr,
  or,
  ir,
  ar,
  ur,
  sr,
  ho = {
    Program(e, t) {
      const r = t.indent.repeat(t.indentLevel),
        { lineEnd: n, writeComments: o } = t;
      if (o && e.comments != null) W(t, e.comments, r, n);
      const i = e.body,
        { length: a } = i;
      for (let u = 0; u < a; u++) {
        const s = i[u];
        if (o && s.comments != null) W(t, s.comments, r, n);
        t.write(r), this[s.type](s, t), t.write(n);
      }
      if (o && e.trailingComments != null) W(t, e.trailingComments, r, n);
    },
    BlockStatement: (sr = function (e, t) {
      const r = t.indent.repeat(t.indentLevel++),
        { lineEnd: n, writeComments: o } = t,
        i = r + t.indent;
      t.write("{");
      const a = e.body;
      if (a != null && a.length > 0) {
        if ((t.write(n), o && e.comments != null)) W(t, e.comments, i, n);
        const { length: u } = a;
        for (let s = 0; s < u; s++) {
          const c = a[s];
          if (o && c.comments != null) W(t, c.comments, i, n);
          t.write(i), this[c.type](c, t), t.write(n);
        }
        t.write(r);
      } else if (o && e.comments != null)
        t.write(n), W(t, e.comments, i, n), t.write(r);
      if (o && e.trailingComments != null) W(t, e.trailingComments, i, n);
      t.write("}"), t.indentLevel--;
    }),
    ClassBody: sr,
    StaticBlock(e, t) {
      t.write("static "), this.BlockStatement(e, t);
    },
    EmptyStatement(e, t) {
      t.write(";");
    },
    ExpressionStatement(e, t) {
      const r = t.expressionsPrecedence[e.expression.type];
      if (r === te || (r === 3 && e.expression.left.type[0] === "O"))
        t.write("("), this[e.expression.type](e.expression, t), t.write(")");
      else this[e.expression.type](e.expression, t);
      t.write(";");
    },
    IfStatement(e, t) {
      if (
        (t.write("if ("),
        this[e.test.type](e.test, t),
        t.write(") "),
        this[e.consequent.type](e.consequent, t),
        e.alternate != null)
      )
        t.write(" else "), this[e.alternate.type](e.alternate, t);
    },
    LabeledStatement(e, t) {
      this[e.label.type](e.label, t),
        t.write(": "),
        this[e.body.type](e.body, t);
    },
    BreakStatement(e, t) {
      if ((t.write("break"), e.label != null))
        t.write(" "), this[e.label.type](e.label, t);
      t.write(";");
    },
    ContinueStatement(e, t) {
      if ((t.write("continue"), e.label != null))
        t.write(" "), this[e.label.type](e.label, t);
      t.write(";");
    },
    WithStatement(e, t) {
      t.write("with ("),
        this[e.object.type](e.object, t),
        t.write(") "),
        this[e.body.type](e.body, t);
    },
    SwitchStatement(e, t) {
      const r = t.indent.repeat(t.indentLevel++),
        { lineEnd: n, writeComments: o } = t;
      t.indentLevel++;
      const i = r + t.indent,
        a = i + t.indent;
      t.write("switch ("),
        this[e.discriminant.type](e.discriminant, t),
        t.write(") {" + n);
      const { cases: u } = e,
        { length: s } = u;
      for (let c = 0; c < s; c++) {
        const d = u[c];
        if (o && d.comments != null) W(t, d.comments, i, n);
        if (d.test)
          t.write(i + "case "), this[d.test.type](d.test, t), t.write(":" + n);
        else t.write(i + "default:" + n);
        const { consequent: f } = d,
          { length: l } = f;
        for (let g = 0; g < l; g++) {
          const p = f[g];
          if (o && p.comments != null) W(t, p.comments, a, n);
          t.write(a), this[p.type](p, t), t.write(n);
        }
      }
      (t.indentLevel -= 2), t.write(r + "}");
    },
    ReturnStatement(e, t) {
      if ((t.write("return"), e.argument))
        t.write(" "), this[e.argument.type](e.argument, t);
      t.write(";");
    },
    ThrowStatement(e, t) {
      t.write("throw "), this[e.argument.type](e.argument, t), t.write(";");
    },
    TryStatement(e, t) {
      if ((t.write("try "), this[e.block.type](e.block, t), e.handler)) {
        const { handler: r } = e;
        if (r.param == null) t.write(" catch ");
        else t.write(" catch ("), this[r.param.type](r.param, t), t.write(") ");
        this[r.body.type](r.body, t);
      }
      if (e.finalizer)
        t.write(" finally "), this[e.finalizer.type](e.finalizer, t);
    },
    WhileStatement(e, t) {
      t.write("while ("),
        this[e.test.type](e.test, t),
        t.write(") "),
        this[e.body.type](e.body, t);
    },
    DoWhileStatement(e, t) {
      t.write("do "),
        this[e.body.type](e.body, t),
        t.write(" while ("),
        this[e.test.type](e.test, t),
        t.write(");");
    },
    ForStatement(e, t) {
      if ((t.write("for ("), e.init != null)) {
        const { init: r } = e;
        if (r.type[0] === "V") Pt(t, r);
        else this[r.type](r, t);
      }
      if ((t.write("; "), e.test)) this[e.test.type](e.test, t);
      if ((t.write("; "), e.update)) this[e.update.type](e.update, t);
      t.write(") "), this[e.body.type](e.body, t);
    },
    ForInStatement: (nr = function (e, t) {
      t.write(`for ${e.await ? "await " : ""}(`);
      const { left: r } = e;
      if (r.type[0] === "V") Pt(t, r);
      else this[r.type](r, t);
      t.write(e.type[3] === "I" ? " in " : " of "),
        this[e.right.type](e.right, t),
        t.write(") "),
        this[e.body.type](e.body, t);
    }),
    ForOfStatement: nr,
    DebuggerStatement(e, t) {
      t.write("debugger;", e);
    },
    FunctionDeclaration: (or = function (e, t) {
      t.write(
        (e.async ? "async " : "") +
          (e.generator ? "function* " : "function ") +
          (e.id ? e.id.name : ""),
        e,
      ),
        ye(t, e.params),
        t.write(" "),
        this[e.body.type](e.body, t);
    }),
    FunctionExpression: or,
    VariableDeclaration(e, t) {
      Pt(t, e), t.write(";");
    },
    VariableDeclarator(e, t) {
      if ((this[e.id.type](e.id, t), e.init != null))
        t.write(" = "), this[e.init.type](e.init, t);
    },
    ClassDeclaration(e, t) {
      if (
        (t.write("class " + (e.id ? `${e.id.name} ` : ""), e), e.superClass)
      ) {
        t.write("extends ");
        const { superClass: r } = e,
          { type: n } = r,
          o = t.expressionsPrecedence[n];
        if (
          (n[0] !== "C" || n[1] !== "l" || n[5] !== "E") &&
          (o === te || o < t.expressionsPrecedence.ClassExpression)
        )
          t.write("("), this[e.superClass.type](r, t), t.write(")");
        else this[r.type](r, t);
        t.write(" ");
      }
      this.ClassBody(e.body, t);
    },
    ImportDeclaration(e, t) {
      t.write("import ");
      const { specifiers: r } = e,
        { length: n } = r;
      let o = 0;
      if (n > 0) {
        for (; o < n; ) {
          if (o > 0) t.write(", ");
          const i = r[o],
            a = i.type[6];
          if (a === "D") t.write(i.local.name, i), o++;
          else if (a === "N") t.write("* as " + i.local.name, i), o++;
          else break;
        }
        if (o < n) {
          t.write("{");
          for (;;) {
            const i = r[o],
              { name: a } = i.imported;
            if ((t.write(a, i), a !== i.local.name))
              t.write(" as " + i.local.name);
            if (++o < n) t.write(", ");
            else break;
          }
          t.write("}");
        }
        t.write(" from ");
      }
      this.Literal(e.source, t), t.write(";");
    },
    ImportExpression(e, t) {
      t.write("import("), this[e.source.type](e.source, t), t.write(")");
    },
    ExportDefaultDeclaration(e, t) {
      if (
        (t.write("export default "),
        this[e.declaration.type](e.declaration, t),
        t.expressionsPrecedence[e.declaration.type] != null &&
          e.declaration.type[0] !== "F")
      )
        t.write(";");
    },
    ExportNamedDeclaration(e, t) {
      if ((t.write("export "), e.declaration))
        this[e.declaration.type](e.declaration, t);
      else {
        t.write("{");
        const { specifiers: r } = e,
          { length: n } = r;
        if (n > 0)
          for (let o = 0; ; ) {
            const i = r[o],
              { name: a } = i.local;
            if ((t.write(a, i), a !== i.exported.name))
              t.write(" as " + i.exported.name);
            if (++o < n) t.write(", ");
            else break;
          }
        if ((t.write("}"), e.source))
          t.write(" from "), this.Literal(e.source, t);
        t.write(";");
      }
    },
    ExportAllDeclaration(e, t) {
      if (e.exported != null)
        t.write("export * as " + e.exported.name + " from ");
      else t.write("export * from ");
      this.Literal(e.source, t), t.write(";");
    },
    MethodDefinition(e, t) {
      if (e.static) t.write("static ");
      const r = e.kind[0];
      if (r === "g" || r === "s") t.write(e.kind + " ");
      if (e.value.async) t.write("async ");
      if (e.value.generator) t.write("*");
      if (e.computed) t.write("["), this[e.key.type](e.key, t), t.write("]");
      else this[e.key.type](e.key, t);
      ye(t, e.value.params),
        t.write(" "),
        this[e.value.body.type](e.value.body, t);
    },
    ClassExpression(e, t) {
      this.ClassDeclaration(e, t);
    },
    ArrowFunctionExpression(e, t) {
      t.write(e.async ? "async " : "", e);
      const { params: r } = e;
      if (r != null)
        if (r.length === 1 && r[0].type[0] === "I") t.write(r[0].name, r[0]);
        else ye(t, e.params);
      if ((t.write(" => "), e.body.type[0] === "O"))
        t.write("("), this.ObjectExpression(e.body, t), t.write(")");
      else this[e.body.type](e.body, t);
    },
    ThisExpression(e, t) {
      t.write("this", e);
    },
    Super(e, t) {
      t.write("super", e);
    },
    RestElement: (ir = function (e, t) {
      t.write("..."), this[e.argument.type](e.argument, t);
    }),
    SpreadElement: ir,
    YieldExpression(e, t) {
      if ((t.write(e.delegate ? "yield*" : "yield"), e.argument))
        t.write(" "), this[e.argument.type](e.argument, t);
    },
    AwaitExpression(e, t) {
      t.write("await ", e), Me(t, e.argument, e);
    },
    TemplateLiteral(e, t) {
      const { quasis: r, expressions: n } = e;
      t.write("`");
      const { length: o } = n;
      for (let a = 0; a < o; a++) {
        const u = n[a],
          s = r[a];
        t.write(s.value.raw, s),
          t.write("${"),
          this[u.type](u, t),
          t.write("}");
      }
      const i = r[r.length - 1];
      t.write(i.value.raw, i), t.write("`");
    },
    TemplateElement(e, t) {
      t.write(e.value.raw, e);
    },
    TaggedTemplateExpression(e, t) {
      Me(t, e.tag, e), this[e.quasi.type](e.quasi, t);
    },
    ArrayExpression: (ur = function (e, t) {
      if ((t.write("["), e.elements.length > 0)) {
        const { elements: r } = e,
          { length: n } = r;
        for (let o = 0; ; ) {
          const i = r[o];
          if (i != null) this[i.type](i, t);
          if (++o < n) t.write(", ");
          else {
            if (i == null) t.write(", ");
            break;
          }
        }
      }
      t.write("]");
    }),
    ArrayPattern: ur,
    ObjectExpression(e, t) {
      const r = t.indent.repeat(t.indentLevel++),
        { lineEnd: n, writeComments: o } = t,
        i = r + t.indent;
      if ((t.write("{"), e.properties.length > 0)) {
        if ((t.write(n), o && e.comments != null)) W(t, e.comments, i, n);
        const a = "," + n,
          { properties: u } = e,
          { length: s } = u;
        for (let c = 0; ; ) {
          const d = u[c];
          if (o && d.comments != null) W(t, d.comments, i, n);
          if ((t.write(i), this[d.type](d, t), ++c < s)) t.write(a);
          else break;
        }
        if ((t.write(n), o && e.trailingComments != null))
          W(t, e.trailingComments, i, n);
        t.write(r + "}");
      } else if (o)
        if (e.comments != null) {
          if ((t.write(n), W(t, e.comments, i, n), e.trailingComments != null))
            W(t, e.trailingComments, i, n);
          t.write(r + "}");
        } else if (e.trailingComments != null)
          t.write(n), W(t, e.trailingComments, i, n), t.write(r + "}");
        else t.write("}");
      else t.write("}");
      t.indentLevel--;
    },
    Property(e, t) {
      if (e.method || e.kind[0] !== "i") this.MethodDefinition(e, t);
      else {
        if (!e.shorthand) {
          if (e.computed)
            t.write("["), this[e.key.type](e.key, t), t.write("]");
          else this[e.key.type](e.key, t);
          t.write(": ");
        }
        this[e.value.type](e.value, t);
      }
    },
    PropertyDefinition(e, t) {
      if (e.static) t.write("static ");
      if (e.computed) t.write("[");
      if ((this[e.key.type](e.key, t), e.computed)) t.write("]");
      if (e.value == null) {
        if (e.key.type[0] !== "F") t.write(";");
        return;
      }
      t.write(" = "), this[e.value.type](e.value, t), t.write(";");
    },
    ObjectPattern(e, t) {
      if ((t.write("{"), e.properties.length > 0)) {
        const { properties: r } = e,
          { length: n } = r;
        for (let o = 0; ; )
          if ((this[r[o].type](r[o], t), ++o < n)) t.write(", ");
          else break;
      }
      t.write("}");
    },
    SequenceExpression(e, t) {
      ye(t, e.expressions);
    },
    UnaryExpression(e, t) {
      if (e.prefix) {
        const {
          operator: r,
          argument: n,
          argument: { type: o },
        } = e;
        t.write(r);
        const i = Hr(t, n, e);
        if (
          !i &&
          (r.length > 1 ||
            (o[0] === "U" &&
              (o[1] === "n" || o[1] === "p") &&
              n.prefix &&
              n.operator[0] === r &&
              (r === "+" || r === "-")))
        )
          t.write(" ");
        if (i) t.write(r.length > 1 ? " (" : "("), this[o](n, t), t.write(")");
        else this[o](n, t);
      } else this[e.argument.type](e.argument, t), t.write(e.operator);
    },
    UpdateExpression(e, t) {
      if (e.prefix) t.write(e.operator), this[e.argument.type](e.argument, t);
      else this[e.argument.type](e.argument, t), t.write(e.operator);
    },
    AssignmentExpression(e, t) {
      this[e.left.type](e.left, t),
        t.write(" " + e.operator + " "),
        this[e.right.type](e.right, t);
    },
    AssignmentPattern(e, t) {
      this[e.left.type](e.left, t),
        t.write(" = "),
        this[e.right.type](e.right, t);
    },
    BinaryExpression: (ar = function (e, t) {
      const r = e.operator === "in";
      if (r) t.write("(");
      if (
        (Me(t, e.left, e, !1),
        t.write(" " + e.operator + " "),
        Me(t, e.right, e, !0),
        r)
      )
        t.write(")");
    }),
    LogicalExpression: ar,
    ConditionalExpression(e, t) {
      const { test: r } = e,
        n = t.expressionsPrecedence[r.type];
      if (n === te || n <= t.expressionsPrecedence.ConditionalExpression)
        t.write("("), this[r.type](r, t), t.write(")");
      else this[r.type](r, t);
      t.write(" ? "),
        this[e.consequent.type](e.consequent, t),
        t.write(" : "),
        this[e.alternate.type](e.alternate, t);
    },
    NewExpression(e, t) {
      t.write("new ");
      const r = t.expressionsPrecedence[e.callee.type];
      if (
        r === te ||
        r < t.expressionsPrecedence.CallExpression ||
        fo(e.callee)
      )
        t.write("("), this[e.callee.type](e.callee, t), t.write(")");
      else this[e.callee.type](e.callee, t);
      ye(t, e.arguments);
    },
    CallExpression(e, t) {
      const r = t.expressionsPrecedence[e.callee.type];
      if (r === te || r < t.expressionsPrecedence.CallExpression)
        t.write("("), this[e.callee.type](e.callee, t), t.write(")");
      else this[e.callee.type](e.callee, t);
      if (e.optional) t.write("?.");
      ye(t, e.arguments);
    },
    ChainExpression(e, t) {
      this[e.expression.type](e.expression, t);
    },
    MemberExpression(e, t) {
      const r = t.expressionsPrecedence[e.object.type];
      if (r === te || r < t.expressionsPrecedence.MemberExpression)
        t.write("("), this[e.object.type](e.object, t), t.write(")");
      else this[e.object.type](e.object, t);
      if (e.computed) {
        if (e.optional) t.write("?.");
        t.write("["), this[e.property.type](e.property, t), t.write("]");
      } else {
        if (e.optional) t.write("?.");
        else t.write(".");
        this[e.property.type](e.property, t);
      }
    },
    MetaProperty(e, t) {
      t.write(e.meta.name + "." + e.property.name, e);
    },
    Identifier(e, t) {
      t.write(e.name, e);
    },
    PrivateIdentifier(e, t) {
      t.write(`#${e.name}`, e);
    },
    Literal(e, t) {
      if (e.raw != null) t.write(e.raw, e);
      else if (e.regex != null) this.RegExpLiteral(e, t);
      else if (e.bigint != null) t.write(e.bigint + "n", e);
      else t.write(go(e.value), e);
    },
    RegExpLiteral(e, t) {
      const { regex: r } = e;
      t.write(`/${r.pattern}/${r.flags}`, e);
    },
  },
  yo = {};
class Ur {
  constructor(e) {
    const t = e == null ? yo : e;
    if (((this.output = ""), t.output != null))
      (this.output = t.output), (this.write = this.writeToStream);
    else this.output = "";
    if (
      ((this.generator = t.generator != null ? t.generator : ho),
      (this.expressionsPrecedence =
        t.expressionsPrecedence != null ? t.expressionsPrecedence : po),
      (this.indent = t.indent != null ? t.indent : "  "),
      (this.lineEnd = t.lineEnd != null ? t.lineEnd : "\n"),
      (this.indentLevel =
        t.startingIndentLevel != null ? t.startingIndentLevel : 0),
      (this.writeComments = t.comments ? t.comments : !1),
      t.sourceMap != null)
    )
      (this.write =
        t.output == null ? this.writeAndMap : this.writeToStreamAndMap),
        (this.sourceMap = t.sourceMap),
        (this.line = 1),
        (this.column = 0),
        (this.lineEndSize = this.lineEnd.split("\n").length - 1),
        (this.mapping = {
          original: null,
          generated: this,
          name: void 0,
          source: t.sourceMap.file || t.sourceMap._file,
        });
  }
  write(e) {
    this.output += e;
  }
  writeToStream(e) {
    this.output.write(e);
  }
  writeAndMap(e, t) {
    (this.output += e), this.map(e, t);
  }
  writeToStreamAndMap(e, t) {
    this.output.write(e), this.map(e, t);
  }
  map(e, t) {
    if (t != null) {
      const { type: o } = t;
      if (o[0] === "L" && o[2] === "n") {
        (this.column = 0), this.line++;
        return;
      }
      if (t.loc != null) {
        const { mapping: i } = this;
        (i.original = t.loc.start),
          (i.name = t.name),
          this.sourceMap.addMapping(i);
      }
      if (
        (o[0] === "T" && o[8] === "E") ||
        (o[0] === "L" && o[1] === "i" && typeof t.value === "string")
      ) {
        const { length: i } = e;
        let { column: a, line: u } = this;
        for (let s = 0; s < i; s++)
          if (e[s] === "\n") (a = 0), u++;
          else a++;
        (this.column = a), (this.line = u);
        return;
      }
    }
    const { length: r } = e,
      { lineEnd: n } = this;
    if (r > 0)
      if (
        this.lineEndSize > 0 &&
        (n.length === 1 ? e[r - 1] === n : e.endsWith(n))
      )
        (this.line += this.lineEndSize), (this.column = 0);
      else this.column += r;
  }
  toString() {
    return this.output;
  }
}
var m = function (e, t, ...r) {
    throw new Le(e.index, e.line, e.column, t, ...r);
  },
  dt = function (e) {
    throw new Le(e.index, e.line, e.column, e.type, e.params);
  },
  ve = function (e, t, r, n, ...o) {
    throw new Le(e, t, r, n, ...o);
  },
  Ee = function (e, t, r, n) {
    throw new Le(e, t, r, n);
  },
  k = function (e) {
    return e.column++, (e.currentChar = e.source.charCodeAt(++e.index));
  },
  Po = function (e, t) {
    if ((t & 64512) !== 55296) return 0;
    const r = e.source.charCodeAt(e.index + 1);
    if ((r & 64512) !== 56320) return 0;
    if (
      ((t = e.currentChar = 65536 + ((t & 1023) << 10) + (r & 1023)),
      ((Ge[(t >>> 5) + 0] >>> t) & 31 & 1) === 0)
    )
      m(e, 18, ne(t));
    return e.index++, e.column++, 1;
  },
  Tt = function (e, t) {
    if (
      ((e.currentChar = e.source.charCodeAt(++e.index)),
      (e.flags |= 1),
      (t & 4) === 0)
    )
      (e.column = 0), e.line++;
  },
  me = function (e) {
    (e.flags |= 1),
      (e.currentChar = e.source.charCodeAt(++e.index)),
      (e.column = 0),
      e.line++;
  },
  ko = function (e) {
    return (
      e === 160 ||
      e === 65279 ||
      e === 133 ||
      e === 5760 ||
      (e >= 8192 && e <= 8203) ||
      e === 8239 ||
      e === 8287 ||
      e === 12288 ||
      e === 8201 ||
      e === 65519
    );
  },
  ne = function (e) {
    return e <= 65535
      ? String.fromCharCode(e)
      : String.fromCharCode(e >>> 10) + String.fromCharCode(e & 1023);
  },
  j = function (e) {
    return e < 65 ? e - 48 : (e - 65 + 10) & 15;
  },
  xo = function (e) {
    switch (e) {
      case 134283266:
        return "NumericLiteral";
      case 134283267:
        return "StringLiteral";
      case 86021:
      case 86022:
        return "BooleanLiteral";
      case 86023:
        return "NullLiteral";
      case 65540:
        return "RegularExpression";
      case 67174408:
      case 67174409:
      case 132:
        return "TemplateLiteral";
      default:
        if ((e & 143360) === 143360) return "Identifier";
        if ((e & 4096) === 4096) return "Keyword";
        return "Punctuator";
    }
  },
  Ct = function (e) {
    return e <= 127 ? U0[e] : (Ge[(e >>> 5) + 34816] >>> e) & 31 & 1;
  },
  ot = function (e) {
    return e <= 127
      ? En[e]
      : (Ge[(e >>> 5) + 0] >>> e) & 31 & 1 || e === 8204 || e === 8205;
  },
  bo = function (e) {
    const t = e.source;
    if (e.currentChar === 35 && t.charCodeAt(e.index + 1) === 33)
      k(e), k(e), Dt(e, t, 0, 4, e.tokenPos, e.linePos, e.colPos);
  },
  lr = function (e, t, r, n, o, i, a, u) {
    if (n & 2048) m(e, 0);
    return Dt(e, t, r, o, i, a, u);
  },
  Dt = function (e, t, r, n, o, i, a) {
    const { index: u } = e;
    (e.tokenPos = e.index), (e.linePos = e.line), (e.colPos = e.column);
    while (e.index < e.end) {
      if (D[e.currentChar] & 8) {
        const s = e.currentChar === 13;
        if ((me(e), s && e.index < e.end && e.currentChar === 10))
          e.currentChar = t.charCodeAt(++e.index);
        break;
      } else if ((e.currentChar ^ 8232) <= 1) {
        me(e);
        break;
      }
      k(e), (e.tokenPos = e.index), (e.linePos = e.line), (e.colPos = e.column);
    }
    if (e.onComment) {
      const s = {
        start: { line: i, column: a },
        end: { line: e.linePos, column: e.colPos },
      };
      e.onComment(Cn[n & 255], t.slice(u, e.tokenPos), o, e.tokenPos, s);
    }
    return r | 1;
  },
  vo = function (e, t, r) {
    const { index: n } = e;
    while (e.index < e.end)
      if (e.currentChar < 43) {
        let o = !1;
        while (e.currentChar === 42) {
          if (!o) (r &= ~4), (o = !0);
          if (k(e) === 47) {
            if ((k(e), e.onComment)) {
              const i = {
                start: { line: e.linePos, column: e.colPos },
                end: { line: e.line, column: e.column },
              };
              e.onComment(
                Cn[1 & 255],
                t.slice(n, e.index - 2),
                n - 2,
                e.index,
                i,
              );
            }
            return (
              (e.tokenPos = e.index),
              (e.linePos = e.line),
              (e.colPos = e.column),
              r
            );
          }
        }
        if (o) continue;
        if (D[e.currentChar] & 8)
          if (e.currentChar === 13) (r |= 1 | 4), me(e);
          else Tt(e, r), (r = (r & ~4) | 1);
        else k(e);
      } else if ((e.currentChar ^ 8232) <= 1) (r = (r & ~4) | 1), me(e);
      else (r &= ~4), k(e);
    m(e, 16);
  },
  Eo = function (e, t) {
    const r = e.index;
    let n = 0;
    e: while (!0) {
      const d = e.currentChar;
      if ((k(e), n & 1)) n &= ~1;
      else
        switch (d) {
          case 47:
            if (!n) break e;
            else break;
          case 92:
            n |= 1;
            break;
          case 91:
            n |= 2;
            break;
          case 93:
            n &= 1;
            break;
          case 13:
          case 10:
          case 8232:
          case 8233:
            m(e, 32);
        }
      if (e.index >= e.source.length) return m(e, 32);
    }
    const o = e.index - 1;
    let i = 0,
      a = e.currentChar;
    const { index: u } = e;
    while (ot(a)) {
      switch (a) {
        case 103:
          if (i & 2) m(e, 34, "g");
          i |= 2;
          break;
        case 105:
          if (i & 1) m(e, 34, "i");
          i |= 1;
          break;
        case 109:
          if (i & 4) m(e, 34, "m");
          i |= 4;
          break;
        case 117:
          if (i & 16) m(e, 34, "u");
          i |= 16;
          break;
        case 121:
          if (i & 8) m(e, 34, "y");
          i |= 8;
          break;
        case 115:
          if (i & 32) m(e, 34, "s");
          i |= 32;
          break;
        case 100:
          if (i & 64) m(e, 34, "d");
          i |= 64;
          break;
        default:
          m(e, 33);
      }
      a = k(e);
    }
    const s = e.source.slice(u, e.index),
      c = e.source.slice(r, o);
    if (((e.tokenRegExp = { pattern: c, flags: s }), t & 512))
      e.tokenRaw = e.source.slice(e.tokenPos, e.index);
    return (e.tokenValue = Co(e, c, s)), 65540;
  },
  Co = function (e, t, r) {
    try {
      return new RegExp(t, r);
    } catch (n) {
      try {
        return new RegExp(t, r.replace("d", "")), null;
      } catch (o) {
        m(e, 32);
      }
    }
  },
  Io = function (e, t, r) {
    const { index: n } = e;
    let o = "",
      i = k(e),
      a = e.index;
    while ((D[i] & 8) === 0) {
      if (i === r) {
        if (((o += e.source.slice(a, e.index)), k(e), t & 512))
          e.tokenRaw = e.source.slice(n, e.index);
        return (e.tokenValue = o), 134283267;
      }
      if ((i & 8) === 8 && i === 92) {
        if (
          ((o += e.source.slice(a, e.index)),
          (i = k(e)),
          i < 127 || i === 8232 || i === 8233)
        ) {
          const u = zr(e, t, i);
          if (u >= 0) o += ne(u);
          else jr(e, u, 0);
        } else o += ne(i);
        a = e.index + 1;
      }
      if (e.index >= e.end) m(e, 14);
      i = k(e);
    }
    m(e, 14);
  },
  zr = function (e, t, r) {
    switch (r) {
      case 98:
        return 8;
      case 102:
        return 12;
      case 114:
        return 13;
      case 110:
        return 10;
      case 116:
        return 9;
      case 118:
        return 11;
      case 13:
        if (e.index < e.end) {
          const n = e.source.charCodeAt(e.index + 1);
          if (n === 10) (e.index = e.index + 1), (e.currentChar = n);
        }
      case 10:
      case 8232:
      case 8233:
        return (e.column = -1), e.line++, -1;
      case 48:
      case 49:
      case 50:
      case 51: {
        let n = r - 48,
          o = e.index + 1,
          i = e.column + 1;
        if (o < e.end) {
          const a = e.source.charCodeAt(o);
          if ((D[a] & 32) === 0) {
            if ((n !== 0 || D[a] & 512) && t & 1024) return -2;
          } else if (t & 1024) return -2;
          else {
            if (
              ((e.currentChar = a),
              (n = (n << 3) | (a - 48)),
              o++,
              i++,
              o < e.end)
            ) {
              const u = e.source.charCodeAt(o);
              if (D[u] & 32)
                (e.currentChar = u), (n = (n << 3) | (u - 48)), o++, i++;
            }
            (e.flags |= 64), (e.index = o - 1), (e.column = i - 1);
          }
        }
        return n;
      }
      case 52:
      case 53:
      case 54:
      case 55: {
        if (t & 1024) return -2;
        let n = r - 48;
        const o = e.index + 1,
          i = e.column + 1;
        if (o < e.end) {
          const a = e.source.charCodeAt(o);
          if (D[a] & 32)
            (n = (n << 3) | (a - 48)),
              (e.currentChar = a),
              (e.index = o),
              (e.column = i);
        }
        return (e.flags |= 64), n;
      }
      case 120: {
        const n = k(e);
        if ((D[n] & 64) === 0) return -4;
        const o = j(n),
          i = k(e);
        if ((D[i] & 64) === 0) return -4;
        const a = j(i);
        return (o << 4) | a;
      }
      case 117: {
        const n = k(e);
        if (e.currentChar === 123) {
          let o = 0;
          while ((D[k(e)] & 64) !== 0)
            if (((o = (o << 4) | j(e.currentChar)), o > 1114111)) return -5;
          if (e.currentChar < 1 || e.currentChar !== 125) return -4;
          return o;
        } else {
          if ((D[n] & 64) === 0) return -4;
          const o = e.source.charCodeAt(e.index + 1);
          if ((D[o] & 64) === 0) return -4;
          const i = e.source.charCodeAt(e.index + 2);
          if ((D[i] & 64) === 0) return -4;
          const a = e.source.charCodeAt(e.index + 3);
          if ((D[a] & 64) === 0) return -4;
          return (
            (e.index += 3),
            (e.column += 3),
            (e.currentChar = e.source.charCodeAt(e.index)),
            (j(n) << 12) | (j(o) << 8) | (j(i) << 4) | j(a)
          );
        }
      }
      case 56:
      case 57:
        if ((t & 256) === 0) return -3;
      default:
        return r;
    }
  },
  jr = function (e, t, r) {
    switch (t) {
      case -1:
        return;
      case -2:
        m(e, r ? 2 : 1);
      case -3:
        m(e, 13);
      case -4:
        m(e, 6);
      case -5:
        m(e, 102);
    }
  },
  Yr = function (e, t) {
    const { index: r } = e;
    let n = 67174409,
      o = "",
      i = k(e);
    while (i !== 96) {
      if (i === 36 && e.source.charCodeAt(e.index + 1) === 123) {
        k(e), (n = 67174408);
        break;
      } else if ((i & 8) === 8 && i === 92)
        if (((i = k(e)), i > 126)) o += ne(i);
        else {
          const a = zr(e, t | 1024, i);
          if (a >= 0) o += ne(a);
          else if (a !== -1 && t & 65536) {
            if (((o = void 0), (i = Ao(e, i)), i < 0)) n = 67174408;
            break;
          } else jr(e, a, 1);
        }
      else {
        if (e.index < e.end && i === 13 && e.source.charCodeAt(e.index) === 10)
          (o += ne(i)), (e.currentChar = e.source.charCodeAt(++e.index));
        if (((i & 83) < 3 && i === 10) || (i ^ 8232) <= 1)
          (e.column = -1), e.line++;
        o += ne(i);
      }
      if (e.index >= e.end) m(e, 15);
      i = k(e);
    }
    return (
      k(e),
      (e.tokenValue = o),
      (e.tokenRaw = e.source.slice(r + 1, e.index - (n === 67174409 ? 1 : 2))),
      n
    );
  },
  Ao = function (e, t) {
    while (t !== 96) {
      switch (t) {
        case 36: {
          const r = e.index + 1;
          if (r < e.end && e.source.charCodeAt(r) === 123)
            return (e.index = r), e.column++, -t;
          break;
        }
        case 10:
        case 8232:
        case 8233:
          (e.column = -1), e.line++;
      }
      if (e.index >= e.end) m(e, 15);
      t = k(e);
    }
    return t;
  },
  No = function (e, t) {
    if (e.index >= e.end) m(e, 0);
    return e.index--, e.column--, Yr(e, t);
  },
  cr = function (e, t, r) {
    let n = e.currentChar,
      o = 0,
      i = 9,
      a = r & 64 ? 0 : 1,
      u = 0,
      s = 0;
    if (r & 64) {
      if (((o = "." + He(e, n)), (n = e.currentChar), n === 110)) m(e, 11);
    } else {
      if (n === 48) {
        if (((n = k(e)), (n | 32) === 120)) {
          (r = 8 | 128), (n = k(e));
          while (D[n] & (64 | 4096)) {
            if (n === 95) {
              if (!s) m(e, 147);
              (s = 0), (n = k(e));
              continue;
            }
            (s = 1), (o = o * 16 + j(n)), u++, (n = k(e));
          }
          if (u === 0 || !s) m(e, u === 0 ? 19 : 148);
        } else if ((n | 32) === 111) {
          (r = 4 | 128), (n = k(e));
          while (D[n] & (32 | 4096)) {
            if (n === 95) {
              if (!s) m(e, 147);
              (s = 0), (n = k(e));
              continue;
            }
            (s = 1), (o = o * 8 + (n - 48)), u++, (n = k(e));
          }
          if (u === 0 || !s) m(e, u === 0 ? 0 : 148);
        } else if ((n | 32) === 98) {
          (r = 2 | 128), (n = k(e));
          while (D[n] & (128 | 4096)) {
            if (n === 95) {
              if (!s) m(e, 147);
              (s = 0), (n = k(e));
              continue;
            }
            (s = 1), (o = o * 2 + (n - 48)), u++, (n = k(e));
          }
          if (u === 0 || !s) m(e, u === 0 ? 0 : 148);
        } else if (D[n] & 32) {
          if (t & 1024) m(e, 1);
          r = 1;
          while (D[n] & 16) {
            if (D[n] & 512) {
              (r = 32), (a = 0);
              break;
            }
            (o = o * 8 + (n - 48)), (n = k(e));
          }
        } else if (D[n] & 512) {
          if (t & 1024) m(e, 1);
          (e.flags |= 64), (r = 32);
        } else if (n === 95) m(e, 0);
      }
      if (r & 48) {
        if (a) {
          while (i >= 0 && D[n] & (16 | 4096)) {
            if (n === 95) {
              if (((n = k(e)), n === 95 || r & 32))
                Ee(e.index, e.line, e.index + 1, 147);
              s = 1;
              continue;
            }
            (s = 0), (o = 10 * o + (n - 48)), (n = k(e)), --i;
          }
          if (s) Ee(e.index, e.line, e.index + 1, 148);
          if (i >= 0 && !Ct(n) && n !== 46) {
            if (((e.tokenValue = o), t & 512))
              e.tokenRaw = e.source.slice(e.tokenPos, e.index);
            return 134283266;
          }
        }
        if (((o += He(e, n)), (n = e.currentChar), n === 46)) {
          if (k(e) === 95) m(e, 0);
          (r = 64), (o += "." + He(e, e.currentChar)), (n = e.currentChar);
        }
      }
    }
    const c = e.index;
    let d = 0;
    if (n === 110 && r & 128) (d = 1), (n = k(e));
    else if ((n | 32) === 101) {
      if (((n = k(e)), D[n] & 256)) n = k(e);
      const { index: f } = e;
      if ((D[n] & 16) === 0) m(e, 10);
      (o += e.source.substring(c, f) + He(e, n)), (n = e.currentChar);
    }
    if ((e.index < e.end && D[n] & 16) || Ct(n)) m(e, 12);
    if (d)
      return (
        (e.tokenRaw = e.source.slice(e.tokenPos, e.index)),
        (e.tokenValue = BigInt(o)),
        134283389
      );
    if (
      ((e.tokenValue =
        r & (1 | 2 | 8 | 4)
          ? o
          : r & 32
            ? parseFloat(e.source.substring(e.tokenPos, e.index))
            : +o),
      t & 512)
    )
      e.tokenRaw = e.source.slice(e.tokenPos, e.index);
    return 134283266;
  },
  He = function (e, t) {
    let r = 0,
      n = e.index,
      o = "";
    while (D[t] & (16 | 4096)) {
      if (t === 95) {
        const { index: i } = e;
        if (((t = k(e)), t === 95)) Ee(e.index, e.line, e.index + 1, 147);
        (r = 1), (o += e.source.substring(n, i)), (n = e.index);
        continue;
      }
      (r = 0), (t = k(e));
    }
    if (r) Ee(e.index, e.line, e.index + 1, 148);
    return o + e.source.substring(n, e.index);
  },
  fr = function (e, t, r) {
    while (En[k(e)]);
    return (
      (e.tokenValue = e.source.slice(e.tokenPos, e.index)),
      e.currentChar !== 92 && e.currentChar <= 126
        ? In[e.tokenValue] || 208897
        : Gt(e, t, 0, r)
    );
  },
  So = function (e, t) {
    const r = Jr(e);
    if (!ot(r)) m(e, 4);
    return (e.tokenValue = ne(r)), Gt(e, t, 1, D[r] & 4);
  },
  Gt = function (e, t, r, n) {
    let o = e.index;
    while (e.index < e.end)
      if (e.currentChar === 92) {
        (e.tokenValue += e.source.slice(o, e.index)), (r = 1);
        const a = Jr(e);
        if (!ot(a)) m(e, 4);
        (n = n && D[a] & 4), (e.tokenValue += ne(a)), (o = e.index);
      } else if (ot(e.currentChar) || Po(e, e.currentChar)) k(e);
      else break;
    if (e.index <= e.end) e.tokenValue += e.source.slice(o, e.index);
    const i = e.tokenValue.length;
    if (n && i >= 2 && i <= 11) {
      const a = In[e.tokenValue];
      if (a === void 0) return 208897;
      if (!r) return a;
      if (a === 209008) {
        if ((t & (2048 | 4194304)) === 0) return a;
        return 121;
      }
      if (t & 1024) {
        if (a === 36972) return 122;
        if ((a & 36864) === 36864) return 122;
        if ((a & 20480) === 20480)
          if (t & 1073741824 && (t & 8192) === 0) return a;
          else return 121;
        return 143483;
      }
      if (t & 1073741824 && (t & 8192) === 0 && (a & 20480) === 20480) return a;
      if (a === 241773) return t & 1073741824 ? 143483 : t & 2097152 ? 121 : a;
      if (a === 209007) return 143483;
      if ((a & 36864) === 36864) return a;
      return 121;
    }
    return 208897;
  },
  wo = function (e) {
    if (!Ct(k(e))) m(e, 94);
    return 131;
  },
  Jr = function (e) {
    if (e.source.charCodeAt(e.index + 1) !== 117) m(e, 4);
    return (e.currentChar = e.source.charCodeAt((e.index += 2))), Ro(e);
  },
  Ro = function (e) {
    let t = 0;
    const r = e.currentChar;
    if (r === 123) {
      const a = e.index - 2;
      while (D[k(e)] & 64)
        if (((t = (t << 4) | j(e.currentChar)), t > 1114111))
          Ee(a, e.line, e.index + 1, 102);
      if (e.currentChar !== 125) Ee(a, e.line, e.index - 1, 6);
      return k(e), t;
    }
    if ((D[r] & 64) === 0) m(e, 6);
    const n = e.source.charCodeAt(e.index + 1);
    if ((D[n] & 64) === 0) m(e, 6);
    const o = e.source.charCodeAt(e.index + 2);
    if ((D[o] & 64) === 0) m(e, 6);
    const i = e.source.charCodeAt(e.index + 3);
    if ((D[i] & 64) === 0) m(e, 6);
    return (
      (t = (j(r) << 12) | (j(n) << 8) | (j(o) << 4) | j(i)),
      (e.currentChar = e.source.charCodeAt((e.index += 4))),
      t
    );
  },
  v = function (e, t) {
    if (
      ((e.flags = (e.flags | 1) ^ 1),
      (e.startPos = e.index),
      (e.startColumn = e.column),
      (e.startLine = e.line),
      (e.token = $r(e, t, 0)),
      e.onToken && e.token !== 1048576)
    ) {
      const r = {
        start: { line: e.linePos, column: e.colPos },
        end: { line: e.line, column: e.column },
      };
      e.onToken(xo(e.token), e.tokenPos, e.index, r);
    }
  },
  $r = function (e, t, r) {
    const n = e.index === 0,
      o = e.source;
    let { index: i, line: a, column: u } = e;
    while (e.index < e.end) {
      (e.tokenPos = e.index), (e.colPos = e.column), (e.linePos = e.line);
      let s = e.currentChar;
      if (s <= 126) {
        const c = An[s];
        switch (c) {
          case 67174411:
          case 16:
          case 2162700:
          case 1074790415:
          case 69271571:
          case 20:
          case 21:
          case 1074790417:
          case 18:
          case 16842801:
          case 133:
          case 129:
            return k(e), c;
          case 208897:
            return fr(e, t, 0);
          case 4096:
            return fr(e, t, 1);
          case 134283266:
            return cr(e, t, 16 | 128);
          case 134283267:
            return Io(e, t, s);
          case 132:
            return Yr(e, t);
          case 137:
            return So(e, t);
          case 131:
            return wo(e);
          case 128:
            k(e);
            break;
          case 130:
            (r |= 1 | 4), me(e);
            break;
          case 136:
            Tt(e, r), (r = (r & ~4) | 1);
            break;
          case 8456258:
            let d = k(e);
            if (e.index < e.end) {
              if (d === 60) {
                if (e.index < e.end && k(e) === 61) return k(e), 4194334;
                return 8456516;
              } else if (d === 61) return k(e), 8456256;
              if (d === 33) {
                const l = e.index + 1;
                if (
                  l + 1 < e.end &&
                  o.charCodeAt(l) === 45 &&
                  o.charCodeAt(l + 1) == 45
                ) {
                  (e.column += 3),
                    (e.currentChar = o.charCodeAt((e.index += 3))),
                    (r = lr(e, o, r, t, 2, e.tokenPos, e.linePos, e.colPos)),
                    (i = e.tokenPos),
                    (a = e.linePos),
                    (u = e.colPos);
                  continue;
                }
                return 8456258;
              }
              if (d === 47) {
                if ((t & 16) === 0) return 8456258;
                const l = e.index + 1;
                if (l < e.end) {
                  if (((d = o.charCodeAt(l)), d === 42 || d === 47)) break;
                }
                return k(e), 25;
              }
            }
            return 8456258;
          case 1077936157: {
            k(e);
            const l = e.currentChar;
            if (l === 61) {
              if (k(e) === 61) return k(e), 8455996;
              return 8455998;
            }
            if (l === 62) return k(e), 10;
            return 1077936157;
          }
          case 16842800:
            if (k(e) !== 61) return 16842800;
            if (k(e) !== 61) return 8455999;
            return k(e), 8455997;
          case 8457015:
            if (k(e) !== 61) return 8457015;
            return k(e), 4194342;
          case 8457014: {
            if ((k(e), e.index >= e.end)) return 8457014;
            const l = e.currentChar;
            if (l === 61) return k(e), 4194340;
            if (l !== 42) return 8457014;
            if (k(e) !== 61) return 8457273;
            return k(e), 4194337;
          }
          case 8455497:
            if (k(e) !== 61) return 8455497;
            return k(e), 4194343;
          case 25233970: {
            k(e);
            const l = e.currentChar;
            if (l === 43) return k(e), 33619995;
            if (l === 61) return k(e), 4194338;
            return 25233970;
          }
          case 25233971: {
            k(e);
            const l = e.currentChar;
            if (l === 45) {
              if ((k(e), (r & 1 || n) && e.currentChar === 62)) {
                if ((t & 256) === 0) m(e, 109);
                k(e),
                  (r = lr(e, o, r, t, 3, i, a, u)),
                  (i = e.tokenPos),
                  (a = e.linePos),
                  (u = e.colPos);
                continue;
              }
              return 33619996;
            }
            if (l === 61) return k(e), 4194339;
            return 25233971;
          }
          case 8457016: {
            if ((k(e), e.index < e.end)) {
              const l = e.currentChar;
              if (l === 47) {
                k(e),
                  (r = Dt(e, o, r, 0, e.tokenPos, e.linePos, e.colPos)),
                  (i = e.tokenPos),
                  (a = e.linePos),
                  (u = e.colPos);
                continue;
              }
              if (l === 42) {
                k(e),
                  (r = vo(e, o, r)),
                  (i = e.tokenPos),
                  (a = e.linePos),
                  (u = e.colPos);
                continue;
              }
              if (t & 32768) return Eo(e, t);
              if (l === 61) return k(e), 4259877;
            }
            return 8457016;
          }
          case 67108877:
            const f = k(e);
            if (f >= 48 && f <= 57) return cr(e, t, 64 | 16);
            if (f === 46) {
              const l = e.index + 1;
              if (l < e.end && o.charCodeAt(l) === 46)
                return (
                  (e.column += 2),
                  (e.currentChar = o.charCodeAt((e.index += 2))),
                  14
                );
            }
            return 67108877;
          case 8455240: {
            k(e);
            const l = e.currentChar;
            if (l === 124) {
              if ((k(e), e.currentChar === 61)) return k(e), 4194346;
              return 8979003;
            }
            if (l === 61) return k(e), 4194344;
            return 8455240;
          }
          case 8456259: {
            k(e);
            const l = e.currentChar;
            if (l === 61) return k(e), 8456257;
            if (l !== 62) return 8456259;
            if ((k(e), e.index < e.end)) {
              const g = e.currentChar;
              if (g === 62) {
                if (k(e) === 61) return k(e), 4194336;
                return 8456518;
              }
              if (g === 61) return k(e), 4194335;
            }
            return 8456517;
          }
          case 8455751: {
            k(e);
            const l = e.currentChar;
            if (l === 38) {
              if ((k(e), e.currentChar === 61)) return k(e), 4194347;
              return 8979258;
            }
            if (l === 61) return k(e), 4194345;
            return 8455751;
          }
          case 22: {
            let l = k(e);
            if (l === 63) {
              if ((k(e), e.currentChar === 61)) return k(e), 4194348;
              return 276889982;
            }
            if (l === 46) {
              const g = e.index + 1;
              if (g < e.end) {
                if (((l = o.charCodeAt(g)), !(l >= 48 && l <= 57)))
                  return k(e), 67108991;
              }
            }
            return 22;
          }
        }
      } else {
        if ((s ^ 8232) <= 1) {
          (r = (r & ~4) | 1), me(e);
          continue;
        }
        if (
          (s & 64512) === 55296 ||
          ((Ge[(s >>> 5) + 34816] >>> s) & 31 & 1) !== 0
        ) {
          if ((s & 64512) === 56320) {
            if (
              ((s = ((s & 1023) << 10) | (s & 1023) | 65536),
              ((Ge[(s >>> 5) + 0] >>> s) & 31 & 1) === 0)
            )
              m(e, 18, ne(s));
            e.index++, (e.currentChar = s);
          }
          return e.column++, (e.tokenValue = ""), Gt(e, t, 0, 0);
        }
        if (ko(s)) {
          k(e);
          continue;
        }
        m(e, 18, ne(s));
      }
    }
    return 1048576;
  },
  To = function (e) {
    return e.replace(/&(?:[a-zA-Z]+|#[xX][\da-fA-F]+|#\d+);/g, (t) => {
      if (t.charAt(1) === "#") {
        const r = t.charAt(2),
          n =
            r === "X" || r === "x"
              ? parseInt(t.slice(3), 16)
              : parseInt(t.slice(2), 10);
        return Do(n);
      }
      return z0[t.slice(1, -1)] || t;
    });
  },
  Do = function (e) {
    if ((e >= 55296 && e <= 57343) || e > 1114111) return "\uFFFD";
    if (e in yr) e = yr[e];
    return String.fromCodePoint(e);
  },
  Go = function (e, t) {
    return (
      (e.startPos = e.tokenPos = e.index),
      (e.startColumn = e.colPos = e.column),
      (e.startLine = e.linePos = e.line),
      (e.token = D[e.currentChar] & 8192 ? qo(e, t) : $r(e, t, 0)),
      e.token
    );
  },
  qo = function (e, t) {
    const r = e.currentChar;
    let n = k(e);
    const o = e.index;
    while (n !== r) {
      if (e.index >= e.end) m(e, 14);
      n = k(e);
    }
    if (n !== r) m(e, 14);
    if (((e.tokenValue = e.source.slice(o, e.index)), k(e), t & 512))
      e.tokenRaw = e.source.slice(e.tokenPos, e.index);
    return 134283267;
  },
  ge = function (e, t) {
    if (
      ((e.startPos = e.tokenPos = e.index),
      (e.startColumn = e.colPos = e.column),
      (e.startLine = e.linePos = e.line),
      e.index >= e.end)
    )
      return (e.token = 1048576);
    switch (An[e.source.charCodeAt(e.index)]) {
      case 8456258: {
        if ((k(e), e.currentChar === 47)) k(e), (e.token = 25);
        else e.token = 8456258;
        break;
      }
      case 2162700: {
        k(e), (e.token = 2162700);
        break;
      }
      default: {
        let r = 0;
        while (e.index < e.end) {
          const o = D[e.source.charCodeAt(e.index)];
          if (o & 1024) (r |= 1 | 4), me(e);
          else if (o & 2048) Tt(e, r), (r = (r & ~4) | 1);
          else k(e);
          if (D[e.currentChar] & 16384) break;
        }
        const n = e.source.slice(e.tokenPos, e.index);
        if (t & 512) e.tokenRaw = n;
        (e.tokenValue = To(n)), (e.token = 138);
      }
    }
    return e.token;
  },
  It = function (e) {
    if ((e.token & 143360) === 143360) {
      const { index: t } = e;
      let r = e.currentChar;
      while (D[r] & (32768 | 2)) r = k(e);
      e.tokenValue += e.source.slice(t, e.index);
    }
    return (e.token = 208897), e.token;
  },
  z = function (e, t, r) {
    if ((e.flags & 1) === 0 && (e.token & 1048576) !== 1048576 && !r)
      m(e, 28, F[e.token & 255]);
    if (!T(e, t, 1074790417)) e.onInsertedSemicolon?.(e.startPos);
  },
  Zr = function (e, t, r, n) {
    if (t - r < 13 && n === "use strict") {
      if ((e.token & 1048576) === 1048576 || e.flags & 1) return 1;
    }
    return 0;
  },
  qt = function (e, t, r) {
    if (e.token !== r) return 0;
    return v(e, t), 1;
  },
  T = function (e, t, r) {
    if (e.token !== r) return !1;
    return v(e, t), !0;
  },
  C = function (e, t, r) {
    if (e.token !== r) m(e, 23, F[r & 255]);
    v(e, t);
  },
  re = function (e, t) {
    switch (t.type) {
      case "ArrayExpression":
        t.type = "ArrayPattern";
        const r = t.elements;
        for (let o = 0, i = r.length; o < i; ++o) {
          const a = r[o];
          if (a) re(e, a);
        }
        return;
      case "ObjectExpression":
        t.type = "ObjectPattern";
        const n = t.properties;
        for (let o = 0, i = n.length; o < i; ++o) re(e, n[o]);
        return;
      case "AssignmentExpression":
        if (((t.type = "AssignmentPattern"), t.operator !== "=")) m(e, 69);
        delete t.operator, re(e, t.left);
        return;
      case "Property":
        re(e, t.value);
        return;
      case "SpreadElement":
        (t.type = "RestElement"), re(e, t.argument);
    }
  },
  it = function (e, t, r, n, o) {
    if (t & 1024) {
      if ((n & 36864) === 36864) m(e, 115);
      if (!o && (n & 537079808) === 537079808) m(e, 116);
    }
    if ((n & 20480) === 20480) m(e, 100);
    if (r & (8 | 16) && n === 241739) m(e, 98);
    if (t & (4194304 | 2048) && n === 209008) m(e, 96);
    if (t & (2097152 | 1024) && n === 241773) m(e, 95, "yield");
  },
  Qr = function (e, t, r) {
    if (t & 1024) {
      if ((r & 36864) === 36864) m(e, 115);
      if ((r & 537079808) === 537079808) m(e, 116);
      if (r === 122) m(e, 93);
      if (r === 121) m(e, 93);
    }
    if ((r & 20480) === 20480) m(e, 100);
    if (t & (4194304 | 2048) && r === 209008) m(e, 96);
    if (t & (2097152 | 1024) && r === 241773) m(e, 95, "yield");
  },
  en = function (e, t, r) {
    if (r === 209008) {
      if (t & (4194304 | 2048)) m(e, 96);
      e.destructible |= 128;
    }
    if (r === 241773 && t & 2097152) m(e, 95, "yield");
    return (r & 20480) === 20480 || (r & 36864) === 36864 || r == 122;
  },
  Oo = function (e) {
    return !e.property ? !1 : e.property.type === "PrivateIdentifier";
  },
  tn = function (e, t, r, n) {
    while (t) {
      if (t["$" + r]) {
        if (n) m(e, 134);
        return 1;
      }
      if (n && t.loop) n = 0;
      t = t.$;
    }
    return 0;
  },
  _o = function (e, t, r) {
    let n = t;
    while (n) {
      if (n["$" + r]) m(e, 133, r);
      n = n.$;
    }
    t["$" + r] = 1;
  },
  y = function (e, t, r, n, o, i) {
    if (t & 2) (i.start = r), (i.end = e.startPos), (i.range = [r, e.startPos]);
    if (t & 4) {
      if (
        ((i.loc = {
          start: { line: n, column: o },
          end: { line: e.startLine, column: e.startColumn },
        }),
        e.sourceFile)
      )
        i.loc.source = e.sourceFile;
    }
    return i;
  },
  at = function (e) {
    switch (e.type) {
      case "JSXIdentifier":
        return e.name;
      case "JSXNamespacedName":
        return e.namespace + ":" + e.name;
      case "JSXMemberExpression":
        return at(e.object) + "." + at(e.property);
    }
  },
  mt = function (e, t, r) {
    const n = V(pe(), 1024);
    return se(e, t, n, r, 1, 0), n;
  },
  At = function (e, t, ...r) {
    const { index: n, line: o, column: i } = e;
    return { type: t, params: r, index: n, line: o, column: i };
  },
  pe = function () {
    return { parent: void 0, type: 2 };
  },
  V = function (e, t) {
    return { parent: e, type: t, scopeError: void 0 };
  },
  oe = function (e, t, r, n, o, i) {
    if (o & 4) rn(e, t, r, n, o);
    else se(e, t, r, n, o, i);
    if (i & 64) ce(e, n);
  },
  se = function (e, t, r, n, o, i) {
    const a = r["#" + n];
    if (a && (a & 2) === 0)
      if (o & 1) r.scopeError = At(e, 141, n);
      else if (t & 256 && a & 64 && i & 2);
      else m(e, 141, n);
    if (r.type & 128 && r.parent["#" + n] && (r.parent["#" + n] & 2) === 0)
      m(e, 141, n);
    if (r.type & 1024 && a && (a & 2) === 0) {
      if (o & 1) r.scopeError = At(e, 141, n);
    }
    if (r.type & 64) {
      if (r.parent["#" + n] & 768) m(e, 154, n);
    }
    r["#" + n] = o;
  },
  rn = function (e, t, r, n, o) {
    let i = r;
    while (i && (i.type & 256) === 0) {
      const a = i["#" + n];
      if (a & 248)
        if (
          t & 256 &&
          (t & 1024) === 0 &&
          ((o & 128 && a & 68) || (a & 128 && o & 68))
        );
        else m(e, 141, n);
      if (i === r) {
        if (a & 1 && o & 1) i.scopeError = At(e, 141, n);
      }
      if (a & (512 | 256)) {
        if ((a & 512) === 0 || (t & 256) === 0 || t & 1024) m(e, 141, n);
      }
      (i["#" + n] = o), (i = i.parent);
    }
  },
  ce = function (e, t) {
    if (e.exportedNames !== void 0 && t !== "") {
      if (e.exportedNames["#" + t]) m(e, 142, t);
      e.exportedNames["#" + t] = 1;
    }
  },
  Fo = function (e, t) {
    if (e.exportedBindings !== void 0 && t !== "")
      e.exportedBindings["#" + t] = 1;
  },
  Lo = function (e, t) {
    return function (r, n, o, i, a) {
      const u = { type: r, value: n };
      if (e & 2) (u.start = o), (u.end = i), (u.range = [o, i]);
      if (e & 4) u.loc = a;
      t.push(u);
    };
  },
  Vo = function (e, t) {
    return function (r, n, o, i) {
      const a = { token: r };
      if (e & 2) (a.start = n), (a.end = o), (a.range = [n, o]);
      if (e & 4) a.loc = i;
      t.push(a);
    };
  },
  Ot = function (e, t) {
    if (e & (1024 | 2097152)) {
      if (e & 2048 && t === 209008) return !1;
      if (e & 2097152 && t === 241773) return !1;
      return (t & 143360) === 143360 || (t & 12288) === 12288;
    }
    return (
      (t & 143360) === 143360 || (t & 12288) === 12288 || (t & 36864) === 36864
    );
  },
  _t = function (e, t, r, n) {
    if ((r & 537079808) === 537079808) {
      if (t & 1024) m(e, 116);
      if (n) e.flags |= 512;
    }
    if (!Ot(t, r)) m(e, 0);
  },
  Bo = function (e, t, r, n, o) {
    return {
      source: e,
      flags: 0,
      index: 0,
      line: 1,
      column: 0,
      startPos: 0,
      end: e.length,
      tokenPos: 0,
      startColumn: 0,
      colPos: 0,
      linePos: 1,
      startLine: 1,
      sourceFile: t,
      tokenValue: "",
      token: 1048576,
      tokenRaw: "",
      tokenRegExp: void 0,
      currentChar: e.charCodeAt(0),
      exportedNames: [],
      exportedBindings: [],
      assignable: 1,
      destructible: 0,
      onComment: r,
      onToken: n,
      onInsertedSemicolon: o,
      leadingDecorators: [],
    };
  },
  Xo = function (e, t, r) {
    let n = "",
      o,
      i,
      a;
    if (t != null) {
      if (t.module) r |= 2048 | 1024;
      if (t.next) r |= 1;
      if (t.loc) r |= 4;
      if (t.ranges) r |= 2;
      if (t.uniqueKeyInPattern) r |= -2147483648;
      if (t.lexical) r |= 64;
      if (t.webcompat) r |= 256;
      if (t.directives) r |= 8 | 512;
      if (t.globalReturn) r |= 32;
      if (t.raw) r |= 512;
      if (t.preserveParens) r |= 128;
      if (t.impliedStrict) r |= 1024;
      if (t.jsx) r |= 16;
      if (t.identifierPattern) r |= 268435456;
      if (t.specDeviation) r |= 536870912;
      if (t.source) n = t.source;
      if (t.onComment != null)
        o = Array.isArray(t.onComment) ? Lo(r, t.onComment) : t.onComment;
      if (t.onInsertedSemicolon != null) i = t.onInsertedSemicolon;
      if (t.onToken != null)
        a = Array.isArray(t.onToken) ? Vo(r, t.onToken) : t.onToken;
    }
    const u = Bo(e, n, o, a, i);
    if (r & 1) bo(u);
    const s = r & 64 ? pe() : void 0;
    let c = [],
      d = "script";
    if (r & 2048) {
      if (((d = "module"), (c = Mo(u, r | 8192, s)), s)) {
        for (let l in u.exportedBindings)
          if (l[0] === "#" && !s[l]) m(u, 143, l.slice(1));
      }
    } else c = Ko(u, r | 8192, s);
    const f = { type: "Program", sourceType: d, body: c };
    if (r & 2) (f.start = 0), (f.end = e.length), (f.range = [0, e.length]);
    if (r & 4) {
      if (
        ((f.loc = {
          start: { line: 1, column: 0 },
          end: { line: u.line, column: u.column },
        }),
        u.sourceFile)
      )
        f.loc.source = n;
    }
    return f;
  },
  Ko = function (e, t, r) {
    v(e, t | 32768 | 1073741824);
    const n = [];
    while (e.token === 134283267) {
      const {
          index: o,
          tokenPos: i,
          tokenValue: a,
          linePos: u,
          colPos: s,
          token: c,
        } = e,
        d = H(e, t);
      if (Zr(e, o, i, a)) t |= 1024;
      n.push(Lt(e, t, d, c, i, u, s));
    }
    while (e.token !== 1048576) n.push(Oe(e, t, r, 4, {}));
    return n;
  },
  Mo = function (e, t, r) {
    v(e, t | 32768);
    const n = [];
    if (t & 8)
      while (e.token === 134283267) {
        const { tokenPos: o, linePos: i, colPos: a, token: u } = e;
        n.push(Lt(e, t, H(e, t), u, o, i, a));
      }
    while (e.token !== 1048576) n.push(Wo(e, t, r));
    return n;
  },
  Wo = function (e, t, r) {
    e.leadingDecorators = ht(e, t);
    let n;
    switch (e.token) {
      case 20566:
        n = c0(e, t, r);
        break;
      case 86108:
        n = s0(e, t, r);
        break;
      default:
        n = Oe(e, t, r, 4, {});
    }
    if (e.leadingDecorators.length) m(e, 165);
    return n;
  },
  Oe = function (e, t, r, n, o) {
    const { tokenPos: i, linePos: a, colPos: u } = e;
    switch (e.token) {
      case 86106:
        return ue(e, t, r, n, 1, 0, 0, i, a, u);
      case 133:
      case 86096:
        return St(e, t, r, 0, i, a, u);
      case 86092:
        return Nt(e, t, r, 16, 0, i, a, u);
      case 241739:
        return a0(e, t, r, n, i, a, u);
      case 20566:
        m(e, 101, "export");
      case 86108:
        switch ((v(e, t), e.token)) {
          case 67174411:
            return sn(e, t, i, a, u);
          case 67108877:
            return un(e, t, i, a, u);
          default:
            m(e, 101, "import");
        }
      case 209007:
        return nn(e, t, r, n, o, 1, i, a, u);
      default:
        return _e(e, t, r, n, o, 1, i, a, u);
    }
  },
  _e = function (e, t, r, n, o, i, a, u, s) {
    switch (e.token) {
      case 86090:
        return on(e, t, r, 0, a, u, s);
      case 20574:
        return Uo(e, t, a, u, s);
      case 20571:
        return Yo(e, t, r, o, a, u, s);
      case 20569:
        return u0(e, t, r, o, a, u, s);
      case 20564:
        return i0(e, t, r, o, a, u, s);
      case 20580:
        return $o(e, t, r, o, a, u, s);
      case 86112:
        return Jo(e, t, r, o, a, u, s);
      case 1074790417:
        return zo(e, t, a, u, s);
      case 2162700:
        return De(e, t, r ? V(r, 2) : r, o, a, u, s);
      case 86114:
        return jo(e, t, a, u, s);
      case 20557:
        return Qo(e, t, o, a, u, s);
      case 20561:
        return Zo(e, t, o, a, u, s);
      case 20579:
        return r0(e, t, r, o, a, u, s);
      case 20581:
        return e0(e, t, r, o, a, u, s);
      case 20562:
        return t0(e, t, a, u, s);
      case 209007:
        return nn(e, t, r, n, o, 0, a, u, s);
      case 20559:
        m(e, 157);
      case 20568:
        m(e, 158);
      case 86106:
        m(e, t & 1024 ? 74 : (t & 256) === 0 ? 76 : 75);
      case 86096:
        m(e, 77);
      default:
        return Ho(e, t, r, n, o, i, a, u, s);
    }
  },
  Ho = function (e, t, r, n, o, i, a, u, s) {
    const { tokenValue: c, token: d } = e;
    let f;
    switch (d) {
      case 241739:
        if (((f = G(e, t, 0)), t & 1024)) m(e, 83);
        if (e.token === 69271571) m(e, 82);
        break;
      default:
        f = Y(e, t, 2, 0, 1, 0, 0, 1, e.tokenPos, e.linePos, e.colPos);
    }
    if (d & 143360 && e.token === 21)
      return Ft(e, t, r, n, o, c, f, d, i, a, u, s);
    if (
      ((f = q(e, t, f, 0, 0, a, u, s)),
      (f = _(e, t, 0, 0, a, u, s, f)),
      e.token === 18)
    )
      f = ie(e, t, 0, a, u, s, f);
    return Ce(e, t, f, a, u, s);
  },
  De = function (e, t, r, n, o, i, a) {
    const u = [];
    C(e, t | 32768, 2162700);
    while (e.token !== 1074790415) u.push(Oe(e, t, r, 2, { $: n }));
    return (
      C(e, t | 32768, 1074790415),
      y(e, t, o, i, a, { type: "BlockStatement", body: u })
    );
  },
  Uo = function (e, t, r, n, o) {
    if ((t & 32) === 0 && t & 8192) m(e, 90);
    v(e, t | 32768);
    const i =
      e.flags & 1 || e.token & 1048576
        ? null
        : M(e, t, 0, 1, e.tokenPos, e.linePos, e.colPos);
    return (
      z(e, t | 32768),
      y(e, t, r, n, o, { type: "ReturnStatement", argument: i })
    );
  },
  Ce = function (e, t, r, n, o, i) {
    return (
      z(e, t | 32768),
      y(e, t, n, o, i, { type: "ExpressionStatement", expression: r })
    );
  },
  Ft = function (e, t, r, n, o, i, a, u, s, c, d, f) {
    it(e, t, 0, u, 1), _o(e, o, i), v(e, t | 32768);
    const l =
      s && (t & 1024) === 0 && t & 256 && e.token === 86106
        ? ue(e, t, V(r, 2), n, 0, 0, 0, e.tokenPos, e.linePos, e.colPos)
        : _e(e, t, r, n, o, s, e.tokenPos, e.linePos, e.colPos);
    return y(e, t, c, d, f, { type: "LabeledStatement", label: a, body: l });
  },
  nn = function (e, t, r, n, o, i, a, u, s) {
    const { token: c, tokenValue: d } = e;
    let f = G(e, t, 0);
    if (e.token === 21) return Ft(e, t, r, n, o, d, f, c, 1, a, u, s);
    const l = e.flags & 1;
    if (!l) {
      if (e.token === 86106) {
        if (!i) m(e, 120);
        return ue(e, t, r, n, 1, 0, 1, a, u, s);
      }
      if ((e.token & 143360) === 143360) {
        if (((f = hn(e, t, 1, a, u, s)), e.token === 18))
          f = ie(e, t, 0, a, u, s, f);
        return Ce(e, t, f, a, u, s);
      }
    }
    if (e.token === 67174411) f = Mt(e, t, f, 1, 1, 0, l, a, u, s);
    else {
      if (e.token === 10)
        _t(e, t, c, 1), (f = pt(e, t, e.tokenValue, f, 0, 1, 0, a, u, s));
      e.assignable = 1;
    }
    if (((f = q(e, t, f, 0, 0, a, u, s)), e.token === 18))
      f = ie(e, t, 0, a, u, s, f);
    return (
      (f = _(e, t, 0, 0, a, u, s, f)), (e.assignable = 1), Ce(e, t, f, a, u, s)
    );
  },
  Lt = function (e, t, r, n, o, i, a) {
    if (n !== 1074790417) {
      if (
        ((e.assignable = 2),
        (r = q(e, t, r, 0, 0, o, i, a)),
        e.token !== 1074790417)
      ) {
        if (((r = _(e, t, 0, 0, o, i, a, r)), e.token === 18))
          r = ie(e, t, 0, o, i, a, r);
      }
      z(e, t | 32768);
    }
    return t & 8 && r.type === "Literal" && typeof r.value === "string"
      ? y(e, t, o, i, a, {
          type: "ExpressionStatement",
          expression: r,
          directive: r.raw.slice(1, -1),
        })
      : y(e, t, o, i, a, { type: "ExpressionStatement", expression: r });
  },
  zo = function (e, t, r, n, o) {
    return v(e, t | 32768), y(e, t, r, n, o, { type: "EmptyStatement" });
  },
  jo = function (e, t, r, n, o) {
    if ((v(e, t | 32768), e.flags & 1)) m(e, 88);
    const i = M(e, t, 0, 1, e.tokenPos, e.linePos, e.colPos);
    return (
      z(e, t | 32768), y(e, t, r, n, o, { type: "ThrowStatement", argument: i })
    );
  },
  Yo = function (e, t, r, n, o, i, a) {
    v(e, t), C(e, t | 32768, 67174411), (e.assignable = 1);
    const u = M(e, t, 0, 1, e.tokenPos, e.line, e.colPos);
    C(e, t | 32768, 16);
    const s = dr(e, t, r, n, e.tokenPos, e.linePos, e.colPos);
    let c = null;
    if (e.token === 20565)
      v(e, t | 32768), (c = dr(e, t, r, n, e.tokenPos, e.linePos, e.colPos));
    return y(e, t, o, i, a, {
      type: "IfStatement",
      test: u,
      consequent: s,
      alternate: c,
    });
  },
  dr = function (e, t, r, n, o, i, a) {
    return t & 1024 || (t & 256) === 0 || e.token !== 86106
      ? _e(e, t, r, 0, { $: n }, 0, e.tokenPos, e.linePos, e.colPos)
      : ue(e, t, V(r, 2), 0, 0, 0, 0, o, i, a);
  },
  Jo = function (e, t, r, n, o, i, a) {
    v(e, t), C(e, t | 32768, 67174411);
    const u = M(e, t, 0, 1, e.tokenPos, e.linePos, e.colPos);
    C(e, t, 16), C(e, t, 2162700);
    const s = [];
    let c = 0;
    if (r) r = V(r, 8);
    while (e.token !== 1074790415) {
      const { tokenPos: d, linePos: f, colPos: l } = e;
      let g = null;
      const p = [];
      if (T(e, t | 32768, 20558))
        g = M(e, t, 0, 1, e.tokenPos, e.linePos, e.colPos);
      else {
        if ((C(e, t | 32768, 20563), c)) m(e, 87);
        c = 1;
      }
      C(e, t | 32768, 21);
      while (e.token !== 20558 && e.token !== 1074790415 && e.token !== 20563)
        p.push(Oe(e, t | 4096, r, 2, { $: n }));
      s.push(y(e, t, d, f, l, { type: "SwitchCase", test: g, consequent: p }));
    }
    return (
      C(e, t | 32768, 1074790415),
      y(e, t, o, i, a, { type: "SwitchStatement", discriminant: u, cases: s })
    );
  },
  $o = function (e, t, r, n, o, i, a) {
    v(e, t), C(e, t | 32768, 67174411);
    const u = M(e, t, 0, 1, e.tokenPos, e.linePos, e.colPos);
    C(e, t | 32768, 16);
    const s = Re(e, t, r, n);
    return y(e, t, o, i, a, { type: "WhileStatement", test: u, body: s });
  },
  Re = function (e, t, r, n) {
    return _e(
      e,
      ((t | 134217728) ^ 134217728) | 131072,
      r,
      0,
      { loop: 1, $: n },
      0,
      e.tokenPos,
      e.linePos,
      e.colPos,
    );
  },
  Zo = function (e, t, r, n, o, i) {
    if ((t & 131072) === 0) m(e, 66);
    v(e, t);
    let a = null;
    if ((e.flags & 1) === 0 && e.token & 143360) {
      const { tokenValue: u } = e;
      if (((a = G(e, t | 32768, 0)), !tn(e, r, u, 1))) m(e, 135, u);
    }
    return (
      z(e, t | 32768), y(e, t, n, o, i, { type: "ContinueStatement", label: a })
    );
  },
  Qo = function (e, t, r, n, o, i) {
    v(e, t | 32768);
    let a = null;
    if ((e.flags & 1) === 0 && e.token & 143360) {
      const { tokenValue: u } = e;
      if (((a = G(e, t | 32768, 0)), !tn(e, r, u, 0))) m(e, 135, u);
    } else if ((t & (4096 | 131072)) === 0) m(e, 67);
    return (
      z(e, t | 32768), y(e, t, n, o, i, { type: "BreakStatement", label: a })
    );
  },
  e0 = function (e, t, r, n, o, i, a) {
    if ((v(e, t), t & 1024)) m(e, 89);
    C(e, t | 32768, 67174411);
    const u = M(e, t, 0, 1, e.tokenPos, e.linePos, e.colPos);
    C(e, t | 32768, 16);
    const s = _e(e, t, r, 2, n, 0, e.tokenPos, e.linePos, e.colPos);
    return y(e, t, o, i, a, { type: "WithStatement", object: u, body: s });
  },
  t0 = function (e, t, r, n, o) {
    return (
      v(e, t | 32768),
      z(e, t | 32768),
      y(e, t, r, n, o, { type: "DebuggerStatement" })
    );
  },
  r0 = function (e, t, r, n, o, i, a) {
    v(e, t | 32768);
    const u = r ? V(r, 32) : void 0,
      s = De(e, t, u, { $: n }, e.tokenPos, e.linePos, e.colPos),
      { tokenPos: c, linePos: d, colPos: f } = e,
      l = T(e, t | 32768, 20559) ? n0(e, t, r, n, c, d, f) : null;
    let g = null;
    if (e.token === 20568) {
      v(e, t | 32768);
      const p = u ? V(r, 4) : void 0;
      g = De(e, t, p, { $: n }, e.tokenPos, e.linePos, e.colPos);
    }
    if (!l && !g) m(e, 86);
    return y(e, t, o, i, a, {
      type: "TryStatement",
      block: s,
      handler: l,
      finalizer: g,
    });
  },
  n0 = function (e, t, r, n, o, i, a) {
    let u = null,
      s = r;
    if (T(e, t, 67174411)) {
      if (r) r = V(r, 4);
      if (
        ((u = kn(
          e,
          t,
          r,
          (e.token & 2097152) === 2097152 ? 256 : 512,
          0,
          e.tokenPos,
          e.linePos,
          e.colPos,
        )),
        e.token === 18)
      )
        m(e, 84);
      else if (e.token === 1077936157) m(e, 85);
      if ((C(e, t | 32768, 16), r)) s = V(r, 64);
    }
    const c = De(e, t, s, { $: n }, e.tokenPos, e.linePos, e.colPos);
    return y(e, t, o, i, a, { type: "CatchClause", param: u, body: c });
  },
  o0 = function (e, t, r, n, o, i) {
    if (r) r = V(r, 2);
    const a = 16384 | 524288;
    t = ((t | a) ^ a) | 262144;
    const { body: u } = De(e, t, r, {}, n, o, i);
    return y(e, t, n, o, i, { type: "StaticBlock", body: u });
  },
  i0 = function (e, t, r, n, o, i, a) {
    v(e, t | 32768);
    const u = Re(e, t, r, n);
    C(e, t, 20580), C(e, t | 32768, 67174411);
    const s = M(e, t, 0, 1, e.tokenPos, e.linePos, e.colPos);
    return (
      C(e, t | 32768, 16),
      T(e, t | 32768, 1074790417),
      y(e, t, o, i, a, { type: "DoWhileStatement", body: u, test: s })
    );
  },
  a0 = function (e, t, r, n, o, i, a) {
    const { token: u, tokenValue: s } = e;
    let c = G(e, t, 0);
    if (e.token & (143360 | 2097152)) {
      const d = be(e, t, r, 8, 0);
      return (
        z(e, t | 32768),
        y(e, t, o, i, a, {
          type: "VariableDeclaration",
          kind: "let",
          declarations: d,
        })
      );
    }
    if (((e.assignable = 1), t & 1024)) m(e, 83);
    if (e.token === 21) return Ft(e, t, r, n, {}, s, c, u, 0, o, i, a);
    if (e.token === 10) {
      let d = void 0;
      if (t & 64) d = mt(e, t, s);
      (e.flags = (e.flags | 128) ^ 128), (c = Fe(e, t, d, [c], 0, o, i, a));
    } else (c = q(e, t, c, 0, 0, o, i, a)), (c = _(e, t, 0, 0, o, i, a, c));
    if (e.token === 18) c = ie(e, t, 0, o, i, a, c);
    return Ce(e, t, c, o, i, a);
  },
  Nt = function (e, t, r, n, o, i, a, u) {
    v(e, t);
    const s = be(e, t, r, n, o);
    return (
      z(e, t | 32768),
      y(e, t, i, a, u, {
        type: "VariableDeclaration",
        kind: n & 8 ? "let" : "const",
        declarations: s,
      })
    );
  },
  on = function (e, t, r, n, o, i, a) {
    v(e, t);
    const u = be(e, t, r, 4, n);
    return (
      z(e, t | 32768),
      y(e, t, o, i, a, {
        type: "VariableDeclaration",
        kind: "var",
        declarations: u,
      })
    );
  },
  be = function (e, t, r, n, o) {
    let i = 1;
    const a = [mr(e, t, r, n, o)];
    while (T(e, t, 18)) i++, a.push(mr(e, t, r, n, o));
    if (i > 1 && o & 32 && e.token & 262144) m(e, 59, F[e.token & 255]);
    return a;
  },
  mr = function (e, t, r, n, o) {
    const { token: i, tokenPos: a, linePos: u, colPos: s } = e;
    let c = null;
    const d = kn(e, t, r, n, o, a, u, s);
    if (e.token === 1077936157) {
      if (
        (v(e, t | 32768),
        (c = O(e, t, 1, 0, 0, e.tokenPos, e.linePos, e.colPos)),
        o & 32 || (i & 2097152) === 0)
      ) {
        if (
          e.token === 274549 ||
          (e.token === 8738868 && (i & 2097152 || (n & 4) === 0 || t & 1024))
        )
          ve(a, e.line, e.index - 3, 58, e.token === 274549 ? "of" : "in");
      }
    } else if ((n & 16 || (i & 2097152) > 0) && (e.token & 262144) !== 262144)
      m(e, 57, n & 16 ? "const" : "destructuring");
    return y(e, t, a, u, s, { type: "VariableDeclarator", id: d, init: c });
  },
  u0 = function (e, t, r, n, o, i, a) {
    v(e, t);
    const u =
      ((t & 4194304) > 0 || ((t & 2048) > 0 && (t & 8192) > 0)) &&
      T(e, t, 209008);
    if ((C(e, t | 32768, 67174411), r)) r = V(r, 1);
    let s = null,
      c = null,
      d = 0,
      f = null,
      l = e.token === 86090 || e.token === 241739 || e.token === 86092,
      g;
    const { token: p, tokenPos: h, linePos: x, colPos: b } = e;
    if (l)
      if (p === 241739) {
        if (((f = G(e, t, 0)), e.token & (143360 | 2097152))) {
          if (e.token === 8738868) {
            if (t & 1024) m(e, 65);
          } else
            f = y(e, t, h, x, b, {
              type: "VariableDeclaration",
              kind: "let",
              declarations: be(e, t | 134217728, r, 8, 32),
            });
          e.assignable = 1;
        } else if (t & 1024) m(e, 65);
        else if (
          ((l = !1),
          (e.assignable = 1),
          (f = q(e, t, f, 0, 0, h, x, b)),
          e.token === 274549)
        )
          m(e, 112);
      } else
        v(e, t),
          (f = y(
            e,
            t,
            h,
            x,
            b,
            p === 86090
              ? {
                  type: "VariableDeclaration",
                  kind: "var",
                  declarations: be(e, t | 134217728, r, 4, 32),
                }
              : {
                  type: "VariableDeclaration",
                  kind: "const",
                  declarations: be(e, t | 134217728, r, 16, 32),
                },
          )),
          (e.assignable = 1);
    else if (p === 1074790417) {
      if (u) m(e, 80);
    } else if ((p & 2097152) === 2097152) {
      if (
        ((f =
          p === 2162700
            ? Q(e, t, void 0, 1, 0, 0, 2, 32, h, x, b)
            : Z(e, t, void 0, 1, 0, 0, 2, 32, h, x, b)),
        (d = e.destructible),
        t & 256 && d & 64)
      )
        m(e, 61);
      (e.assignable = d & 16 ? 2 : 1),
        (f = q(e, t | 134217728, f, 0, 0, e.tokenPos, e.linePos, e.colPos));
    } else f = $(e, t | 134217728, 1, 0, 1, h, x, b);
    if ((e.token & 262144) === 262144) {
      if (e.token === 274549) {
        if (e.assignable & 2) m(e, 78, u ? "await" : "of");
        re(e, f),
          v(e, t | 32768),
          (g = O(e, t, 1, 0, 0, e.tokenPos, e.linePos, e.colPos)),
          C(e, t | 32768, 16);
        const I = Re(e, t, r, n);
        return y(e, t, o, i, a, {
          type: "ForOfStatement",
          left: f,
          right: g,
          body: I,
          await: u,
        });
      }
      if (e.assignable & 2) m(e, 78, "in");
      if ((re(e, f), v(e, t | 32768), u)) m(e, 80);
      (g = M(e, t, 0, 1, e.tokenPos, e.linePos, e.colPos)), C(e, t | 32768, 16);
      const w = Re(e, t, r, n);
      return y(e, t, o, i, a, {
        type: "ForInStatement",
        body: w,
        left: f,
        right: g,
      });
    }
    if (u) m(e, 80);
    if (!l) {
      if (d & 8 && e.token !== 1077936157) m(e, 78, "loop");
      f = _(e, t | 134217728, 0, 0, h, x, b, f);
    }
    if (e.token === 18) f = ie(e, t, 0, e.tokenPos, e.linePos, e.colPos, f);
    if ((C(e, t | 32768, 1074790417), e.token !== 1074790417))
      s = M(e, t, 0, 1, e.tokenPos, e.linePos, e.colPos);
    if ((C(e, t | 32768, 1074790417), e.token !== 16))
      c = M(e, t, 0, 1, e.tokenPos, e.linePos, e.colPos);
    C(e, t | 32768, 16);
    const A = Re(e, t, r, n);
    return y(e, t, o, i, a, {
      type: "ForStatement",
      init: f,
      test: s,
      update: c,
      body: A,
    });
  },
  an = function (e, t, r) {
    if (!Ot(t, e.token)) m(e, 115);
    if ((e.token & 537079808) === 537079808) m(e, 116);
    if (r) se(e, t, r, e.tokenValue, 8, 0);
    return G(e, t, 0);
  },
  s0 = function (e, t, r) {
    const { tokenPos: n, linePos: o, colPos: i } = e;
    v(e, t);
    let a = null;
    const { tokenPos: u, linePos: s, colPos: c } = e;
    let d = [];
    if (e.token === 134283267) a = H(e, t);
    else {
      if (e.token & 143360) {
        const f = an(e, t, r);
        if (
          ((d = [
            y(e, t, u, s, c, { type: "ImportDefaultSpecifier", local: f }),
          ]),
          T(e, t, 18))
        )
          switch (e.token) {
            case 8457014:
              d.push(gr(e, t, r));
              break;
            case 2162700:
              pr(e, t, r, d);
              break;
            default:
              m(e, 105);
          }
      } else
        switch (e.token) {
          case 8457014:
            d = [gr(e, t, r)];
            break;
          case 2162700:
            pr(e, t, r, d);
            break;
          case 67174411:
            return sn(e, t, n, o, i);
          case 67108877:
            return un(e, t, n, o, i);
          default:
            m(e, 28, F[e.token & 255]);
        }
      a = l0(e, t);
    }
    return (
      z(e, t | 32768),
      y(e, t, n, o, i, { type: "ImportDeclaration", specifiers: d, source: a })
    );
  },
  gr = function (e, t, r) {
    const { tokenPos: n, linePos: o, colPos: i } = e;
    if ((v(e, t), C(e, t, 77934), (e.token & 134217728) === 134217728))
      ve(n, e.line, e.index, 28, F[e.token & 255]);
    return y(e, t, n, o, i, {
      type: "ImportNamespaceSpecifier",
      local: an(e, t, r),
    });
  },
  l0 = function (e, t) {
    if ((T(e, t, 12404), e.token !== 134283267)) m(e, 103, "Import");
    return H(e, t);
  },
  pr = function (e, t, r, n) {
    v(e, t);
    while (e.token & 143360) {
      let { token: o, tokenValue: i, tokenPos: a, linePos: u, colPos: s } = e;
      const c = G(e, t, 0);
      let d;
      if (T(e, t, 77934)) {
        if ((e.token & 134217728) === 134217728 || e.token === 18) m(e, 104);
        else it(e, t, 16, e.token, 0);
        (i = e.tokenValue), (d = G(e, t, 0));
      } else it(e, t, 16, o, 0), (d = c);
      if (r) se(e, t, r, i, 8, 0);
      if (
        (n.push(
          y(e, t, a, u, s, { type: "ImportSpecifier", local: d, imported: c }),
        ),
        e.token !== 1074790415)
      )
        C(e, t, 18);
    }
    return C(e, t, 1074790415), n;
  },
  un = function (e, t, r, n, o) {
    let i = cn(
      e,
      t,
      y(e, t, r, n, o, { type: "Identifier", name: "import" }),
      r,
      n,
      o,
    );
    return (
      (i = q(e, t, i, 0, 0, r, n, o)),
      (i = _(e, t, 0, 0, r, n, o, i)),
      Ce(e, t, i, r, n, o)
    );
  },
  sn = function (e, t, r, n, o) {
    let i = fn(e, t, 0, r, n, o);
    if (((i = q(e, t, i, 0, 0, r, n, o)), e.token === 18))
      i = ie(e, t, 0, r, n, o, i);
    return Ce(e, t, i, r, n, o);
  },
  c0 = function (e, t, r) {
    const { tokenPos: n, linePos: o, colPos: i } = e;
    v(e, t | 32768);
    const a = [];
    let u = null,
      s = null,
      c;
    if (T(e, t | 32768, 20563)) {
      switch (e.token) {
        case 86106: {
          u = ue(e, t, r, 4, 1, 1, 0, e.tokenPos, e.linePos, e.colPos);
          break;
        }
        case 133:
        case 86096:
          u = St(e, t, r, 1, e.tokenPos, e.linePos, e.colPos);
          break;
        case 209007:
          const { tokenPos: d, linePos: f, colPos: l } = e;
          u = G(e, t, 0);
          const { flags: g } = e;
          if ((g & 1) === 0) {
            if (e.token === 86106) u = ue(e, t, r, 4, 1, 1, 1, d, f, l);
            else if (e.token === 67174411)
              (u = Mt(e, t, u, 1, 1, 0, g, d, f, l)),
                (u = q(e, t, u, 0, 0, d, f, l)),
                (u = _(e, t, 0, 0, d, f, l, u));
            else if (e.token & 143360) {
              if (r) r = mt(e, t, e.tokenValue);
              (u = G(e, t, 0)), (u = Fe(e, t, r, [u], 1, d, f, l));
            }
          }
          break;
        default:
          (u = O(e, t, 1, 0, 0, e.tokenPos, e.linePos, e.colPos)),
            z(e, t | 32768);
      }
      if (r) ce(e, "default");
      return y(e, t, n, o, i, {
        type: "ExportDefaultDeclaration",
        declaration: u,
      });
    }
    switch (e.token) {
      case 8457014: {
        v(e, t);
        let g = null;
        if (T(e, t, 77934)) {
          if (r) ce(e, e.tokenValue);
          g = G(e, t, 0);
        }
        if ((C(e, t, 12404), e.token !== 134283267)) m(e, 103, "Export");
        return (
          (s = H(e, t)),
          z(e, t | 32768),
          y(e, t, n, o, i, {
            type: "ExportAllDeclaration",
            source: s,
            exported: g,
          })
        );
      }
      case 2162700: {
        v(e, t);
        const g = [],
          p = [];
        while (e.token & 143360) {
          const { tokenPos: h, tokenValue: x, linePos: b, colPos: A } = e,
            w = G(e, t, 0);
          let I;
          if (e.token === 77934) {
            if ((v(e, t), (e.token & 134217728) === 134217728)) m(e, 104);
            if (r) g.push(e.tokenValue), p.push(x);
            I = G(e, t, 0);
          } else {
            if (r) g.push(e.tokenValue), p.push(e.tokenValue);
            I = w;
          }
          if (
            (a.push(
              y(e, t, h, b, A, {
                type: "ExportSpecifier",
                local: w,
                exported: I,
              }),
            ),
            e.token !== 1074790415)
          )
            C(e, t, 18);
        }
        if ((C(e, t, 1074790415), T(e, t, 12404))) {
          if (e.token !== 134283267) m(e, 103, "Export");
          s = H(e, t);
        } else if (r) {
          let h = 0,
            x = g.length;
          for (; h < x; h++) ce(e, g[h]);
          (h = 0), (x = p.length);
          for (; h < x; h++) Fo(e, p[h]);
        }
        z(e, t | 32768);
        break;
      }
      case 86096:
        u = St(e, t, r, 2, e.tokenPos, e.linePos, e.colPos);
        break;
      case 86106:
        u = ue(e, t, r, 4, 1, 2, 0, e.tokenPos, e.linePos, e.colPos);
        break;
      case 241739:
        u = Nt(e, t, r, 8, 64, e.tokenPos, e.linePos, e.colPos);
        break;
      case 86092:
        u = Nt(e, t, r, 16, 64, e.tokenPos, e.linePos, e.colPos);
        break;
      case 86090:
        u = on(e, t, r, 64, e.tokenPos, e.linePos, e.colPos);
        break;
      case 209007:
        const { tokenPos: d, linePos: f, colPos: l } = e;
        if ((v(e, t), (e.flags & 1) === 0 && e.token === 86106)) {
          if (((u = ue(e, t, r, 4, 1, 2, 1, d, f, l)), r))
            (c = u.id ? u.id.name : ""), ce(e, c);
          break;
        }
      default:
        m(e, 28, F[e.token & 255]);
    }
    return y(e, t, n, o, i, {
      type: "ExportNamedDeclaration",
      declaration: u,
      specifiers: a,
      source: s,
    });
  },
  O = function (e, t, r, n, o, i, a, u) {
    let s = Y(e, t, 2, 0, r, n, o, 1, i, a, u);
    return (s = q(e, t, s, o, 0, i, a, u)), _(e, t, o, 0, i, a, u, s);
  },
  ie = function (e, t, r, n, o, i, a) {
    const u = [a];
    while (T(e, t | 32768, 18))
      u.push(O(e, t, 1, 0, r, e.tokenPos, e.linePos, e.colPos));
    return y(e, t, n, o, i, { type: "SequenceExpression", expressions: u });
  },
  M = function (e, t, r, n, o, i, a) {
    const u = O(e, t, n, 0, r, o, i, a);
    return e.token === 18 ? ie(e, t, r, o, i, a, u) : u;
  },
  _ = function (e, t, r, n, o, i, a, u) {
    const { token: s } = e;
    if ((s & 4194304) === 4194304) {
      if (e.assignable & 2) m(e, 24);
      if (
        (!n && s === 1077936157 && u.type === "ArrayExpression") ||
        u.type === "ObjectExpression"
      )
        re(e, u);
      v(e, t | 32768);
      const c = O(e, t, 1, 1, r, e.tokenPos, e.linePos, e.colPos);
      return (
        (e.assignable = 2),
        y(
          e,
          t,
          o,
          i,
          a,
          n
            ? { type: "AssignmentPattern", left: u, right: c }
            : {
                type: "AssignmentExpression",
                left: u,
                operator: F[s & 255],
                right: c,
              },
        )
      );
    }
    if ((s & 8454144) === 8454144) u = ae(e, t, r, o, i, a, 4, s, u);
    if (T(e, t | 32768, 22)) u = fe(e, t, u, o, i, a);
    return u;
  },
  Ue = function (e, t, r, n, o, i, a, u) {
    const { token: s } = e;
    v(e, t | 32768);
    const c = O(e, t, 1, 1, r, e.tokenPos, e.linePos, e.colPos);
    return (
      (u = y(
        e,
        t,
        o,
        i,
        a,
        n
          ? { type: "AssignmentPattern", left: u, right: c }
          : {
              type: "AssignmentExpression",
              left: u,
              operator: F[s & 255],
              right: c,
            },
      )),
      (e.assignable = 2),
      u
    );
  },
  fe = function (e, t, r, n, o, i) {
    const a = O(
      e,
      (t | 134217728) ^ 134217728,
      1,
      0,
      0,
      e.tokenPos,
      e.linePos,
      e.colPos,
    );
    C(e, t | 32768, 21), (e.assignable = 1);
    const u = O(e, t, 1, 0, 0, e.tokenPos, e.linePos, e.colPos);
    return (
      (e.assignable = 2),
      y(e, t, n, o, i, {
        type: "ConditionalExpression",
        test: r,
        consequent: a,
        alternate: u,
      })
    );
  },
  ae = function (e, t, r, n, o, i, a, u, s) {
    const c = -((t & 134217728) > 0) & 8738868;
    let d, f;
    e.assignable = 2;
    while (e.token & 8454144) {
      if (
        ((d = e.token),
        (f = d & 3840),
        (d & 524288 && u & 268435456) || (u & 524288 && d & 268435456))
      )
        m(e, 160);
      if (f + ((d === 8457273) << 8) - ((c === d) << 12) <= a) break;
      v(e, t | 32768),
        (s = y(e, t, n, o, i, {
          type:
            d & 524288 || d & 268435456
              ? "LogicalExpression"
              : "BinaryExpression",
          left: s,
          right: ae(
            e,
            t,
            r,
            e.tokenPos,
            e.linePos,
            e.colPos,
            f,
            d,
            $(e, t, 0, r, 1, e.tokenPos, e.linePos, e.colPos),
          ),
          operator: F[d & 255],
        }));
    }
    if (e.token === 1077936157) m(e, 24);
    return s;
  },
  f0 = function (e, t, r, n, o, i, a) {
    if (!r) m(e, 0);
    const u = e.token;
    v(e, t | 32768);
    const s = $(e, t, 0, a, 1, e.tokenPos, e.linePos, e.colPos);
    if (e.token === 8457273) m(e, 31);
    if (t & 1024 && u === 16863278) {
      if (s.type === "Identifier") m(e, 118);
      else if (Oo(s)) m(e, 124);
    }
    return (
      (e.assignable = 2),
      y(e, t, n, o, i, {
        type: "UnaryExpression",
        operator: F[u & 255],
        argument: s,
        prefix: !0,
      })
    );
  },
  d0 = function (e, t, r, n, o, i, a, u, s, c) {
    const { token: d } = e,
      f = G(e, t, i),
      { flags: l } = e;
    if ((l & 1) === 0) {
      if (e.token === 86106) return mn(e, t, 1, r, u, s, c);
      if ((e.token & 143360) === 143360) {
        if (!n) m(e, 0);
        return hn(e, t, o, u, s, c);
      }
    }
    if (!a && e.token === 67174411) return Mt(e, t, f, o, 1, 0, l, u, s, c);
    if (e.token === 10) {
      if ((_t(e, t, d, 1), a)) m(e, 49);
      return pt(e, t, e.tokenValue, f, a, o, 0, u, s, c);
    }
    return f;
  },
  m0 = function (e, t, r, n, o, i, a) {
    if (r) e.destructible |= 256;
    if (t & 2097152) {
      if ((v(e, t | 32768), t & 8388608)) m(e, 30);
      if (!n) m(e, 24);
      if (e.token === 22) m(e, 121);
      let u = null,
        s = !1;
      if ((e.flags & 1) === 0) {
        if (((s = T(e, t | 32768, 8457014)), e.token & (12288 | 65536) || s))
          u = O(e, t, 1, 0, 0, e.tokenPos, e.linePos, e.colPos);
      }
      return (
        (e.assignable = 2),
        y(e, t, o, i, a, { type: "YieldExpression", argument: u, delegate: s })
      );
    }
    if (t & 1024) m(e, 95, "yield");
    return Kt(e, t, o, i, a);
  },
  g0 = function (e, t, r, n, o, i, a) {
    if (n) e.destructible |= 128;
    if (t & 4194304 || (t & 2048 && t & 8192)) {
      if (r) m(e, 0);
      if (t & 8388608) ve(e.index, e.line, e.index, 29);
      v(e, t | 32768);
      const u = $(e, t, 0, 0, 1, e.tokenPos, e.linePos, e.colPos);
      if (e.token === 8457273) m(e, 31);
      return (
        (e.assignable = 2),
        y(e, t, o, i, a, { type: "AwaitExpression", argument: u })
      );
    }
    if (t & 2048) m(e, 96);
    return Kt(e, t, o, i, a);
  },
  gt = function (e, t, r, n, o, i) {
    const { tokenPos: a, linePos: u, colPos: s } = e;
    C(e, t | 32768, 2162700);
    const c = [],
      d = t;
    if (e.token !== 1074790415) {
      while (e.token === 134283267) {
        const { index: f, tokenPos: l, tokenValue: g, token: p } = e,
          h = H(e, t);
        if (Zr(e, f, l, g)) {
          if (((t |= 1024), e.flags & 128)) ve(e.index, e.line, e.tokenPos, 64);
          if (e.flags & 64) ve(e.index, e.line, e.tokenPos, 8);
        }
        c.push(Lt(e, t, h, p, l, e.linePos, e.colPos));
      }
      if (t & 1024) {
        if (o) {
          if ((o & 537079808) === 537079808) m(e, 116);
          if ((o & 36864) === 36864) m(e, 38);
        }
        if (e.flags & 512) m(e, 116);
        if (e.flags & 256) m(e, 115);
      }
      if (t & 64 && r && i !== void 0 && (d & 1024) === 0 && (t & 8192) === 0)
        dt(i);
    }
    (e.flags = (e.flags | 512 | 256 | 64) ^ (512 | 256 | 64)),
      (e.destructible = (e.destructible | 256) ^ 256);
    while (e.token !== 1074790415) c.push(Oe(e, t, r, 4, {}));
    if (
      (C(e, n & (16 | 8) ? t | 32768 : t, 1074790415),
      (e.flags &= ~(128 | 64)),
      e.token === 1077936157)
    )
      m(e, 24);
    return y(e, t, a, u, s, { type: "BlockStatement", body: c });
  },
  p0 = function (e, t, r, n, o) {
    switch ((v(e, t), e.token)) {
      case 67108991:
        m(e, 162);
      case 67174411: {
        if ((t & 524288) === 0) m(e, 26);
        if (t & 16384) m(e, 27);
        e.assignable = 2;
        break;
      }
      case 69271571:
      case 67108877: {
        if ((t & 262144) === 0) m(e, 27);
        if (t & 16384) m(e, 27);
        e.assignable = 1;
        break;
      }
      default:
        m(e, 28, "super");
    }
    return y(e, t, r, n, o, { type: "Super" });
  },
  $ = function (e, t, r, n, o, i, a, u) {
    const s = Y(e, t, 2, 0, r, 0, n, o, i, a, u);
    return q(e, t, s, n, 0, i, a, u);
  },
  h0 = function (e, t, r, n, o, i) {
    if (e.assignable & 2) m(e, 53);
    const { token: a } = e;
    return (
      v(e, t),
      (e.assignable = 2),
      y(e, t, n, o, i, {
        type: "UpdateExpression",
        argument: r,
        operator: F[a & 255],
        prefix: !1,
      })
    );
  },
  q = function (e, t, r, n, o, i, a, u) {
    if ((e.token & 33619968) === 33619968 && (e.flags & 1) === 0)
      r = h0(e, t, r, i, a, u);
    else if ((e.token & 67108864) === 67108864) {
      switch (((t = (t | 134217728) ^ 134217728), e.token)) {
        case 67108877: {
          v(e, (t | 1073741824 | 8192) ^ 8192), (e.assignable = 1);
          const s = ln(e, t);
          r = y(e, t, i, a, u, {
            type: "MemberExpression",
            object: r,
            computed: !1,
            property: s,
          });
          break;
        }
        case 69271571: {
          let s = !1;
          if ((e.flags & 2048) === 2048)
            (s = !0), (e.flags = (e.flags | 2048) ^ 2048);
          v(e, t | 32768);
          const { tokenPos: c, linePos: d, colPos: f } = e,
            l = M(e, t, n, 1, c, d, f);
          if (
            (C(e, t, 20),
            (e.assignable = 1),
            (r = y(e, t, i, a, u, {
              type: "MemberExpression",
              object: r,
              computed: !0,
              property: l,
            })),
            s)
          )
            e.flags |= 2048;
          break;
        }
        case 67174411: {
          if ((e.flags & 1024) === 1024)
            return (e.flags = (e.flags | 1024) ^ 1024), r;
          let s = !1;
          if ((e.flags & 2048) === 2048)
            (s = !0), (e.flags = (e.flags | 2048) ^ 2048);
          const c = Xt(e, t, n);
          if (
            ((e.assignable = 2),
            (r = y(e, t, i, a, u, {
              type: "CallExpression",
              callee: r,
              arguments: c,
            })),
            s)
          )
            e.flags |= 2048;
          break;
        }
        case 67108991: {
          v(e, (t | 1073741824 | 8192) ^ 8192),
            (e.flags |= 2048),
            (e.assignable = 2),
            (r = y0(e, t, r, i, a, u));
          break;
        }
        default:
          if ((e.flags & 2048) === 2048) m(e, 161);
          (e.assignable = 2),
            (r = y(e, t, i, a, u, {
              type: "TaggedTemplateExpression",
              tag: r,
              quasi:
                e.token === 67174408
                  ? Bt(e, t | 65536)
                  : Vt(e, t, e.tokenPos, e.linePos, e.colPos),
            }));
      }
      r = q(e, t, r, 0, 1, i, a, u);
    }
    if (o === 0 && (e.flags & 2048) === 2048)
      (e.flags = (e.flags | 2048) ^ 2048),
        (r = y(e, t, i, a, u, { type: "ChainExpression", expression: r }));
    return r;
  },
  y0 = function (e, t, r, n, o, i) {
    let a = !1,
      u;
    if (e.token === 69271571 || e.token === 67174411) {
      if ((e.flags & 2048) === 2048)
        (a = !0), (e.flags = (e.flags | 2048) ^ 2048);
    }
    if (e.token === 69271571) {
      v(e, t | 32768);
      const { tokenPos: s, linePos: c, colPos: d } = e,
        f = M(e, t, 0, 1, s, c, d);
      C(e, t, 20),
        (e.assignable = 2),
        (u = y(e, t, n, o, i, {
          type: "MemberExpression",
          object: r,
          computed: !0,
          optional: !0,
          property: f,
        }));
    } else if (e.token === 67174411) {
      const s = Xt(e, t, 0);
      (e.assignable = 2),
        (u = y(e, t, n, o, i, {
          type: "CallExpression",
          callee: r,
          arguments: s,
          optional: !0,
        }));
    } else {
      if ((e.token & (143360 | 4096)) === 0) m(e, 155);
      const s = G(e, t, 0);
      (e.assignable = 2),
        (u = y(e, t, n, o, i, {
          type: "MemberExpression",
          object: r,
          computed: !1,
          optional: !0,
          property: s,
        }));
    }
    if (a) e.flags |= 2048;
    return u;
  },
  ln = function (e, t) {
    if ((e.token & (143360 | 4096)) === 0 && e.token !== 131) m(e, 155);
    return t & 1 && e.token === 131
      ? st(e, t, e.tokenPos, e.linePos, e.colPos)
      : G(e, t, 0);
  },
  P0 = function (e, t, r, n, o, i, a) {
    if (r) m(e, 54);
    if (!n) m(e, 0);
    const { token: u } = e;
    v(e, t | 32768);
    const s = $(e, t, 0, 0, 1, e.tokenPos, e.linePos, e.colPos);
    if (e.assignable & 2) m(e, 53);
    return (
      (e.assignable = 2),
      y(e, t, o, i, a, {
        type: "UpdateExpression",
        argument: s,
        operator: F[u & 255],
        prefix: !0,
      })
    );
  },
  Y = function (e, t, r, n, o, i, a, u, s, c, d) {
    if ((e.token & 143360) === 143360) {
      switch (e.token) {
        case 209008:
          return g0(e, t, n, a, s, c, d);
        case 241773:
          return m0(e, t, a, o, s, c, d);
        case 209007:
          return d0(e, t, a, u, o, i, n, s, c, d);
      }
      const { token: f, tokenValue: l } = e,
        g = G(e, t | 65536, i);
      if (e.token === 10) {
        if (!u) m(e, 0);
        return _t(e, t, f, 1), pt(e, t, l, g, n, o, 0, s, c, d);
      }
      if (t & 16384 && f === 537079928) m(e, 127);
      if (f === 241739) {
        if (t & 1024) m(e, 110);
        if (r & (8 | 16)) m(e, 98);
      }
      return (
        (e.assignable = t & 1024 && (f & 537079808) === 537079808 ? 2 : 1), g
      );
    }
    if ((e.token & 134217728) === 134217728) return H(e, t);
    switch (e.token) {
      case 33619995:
      case 33619996:
        return P0(e, t, n, u, s, c, d);
      case 16863278:
      case 16842800:
      case 16842801:
      case 25233970:
      case 25233971:
      case 16863277:
      case 16863279:
        return f0(e, t, u, s, c, d, a);
      case 86106:
        return mn(e, t, 0, a, s, c, d);
      case 2162700:
        return C0(e, t, o ? 0 : 1, a, s, c, d);
      case 69271571:
        return E0(e, t, o ? 0 : 1, a, s, c, d);
      case 67174411:
        return A0(e, t, o, 1, 0, s, c, d);
      case 86021:
      case 86022:
      case 86023:
        return b0(e, t, s, c, d);
      case 86113:
        return v0(e, t);
      case 65540:
        return w0(e, t, s, c, d);
      case 133:
      case 86096:
        return R0(e, t, a, s, c, d);
      case 86111:
        return p0(e, t, s, c, d);
      case 67174409:
        return Vt(e, t, s, c, d);
      case 67174408:
        return Bt(e, t);
      case 86109:
        return N0(e, t, a, s, c, d);
      case 134283389:
        return dn(e, t, s, c, d);
      case 131:
        return st(e, t, s, c, d);
      case 86108:
        return k0(e, t, n, a, s, c, d);
      case 8456258:
        if (t & 16) return Ht(e, t, 1, s, c, d);
      default:
        if (Ot(t, e.token)) return Kt(e, t, s, c, d);
        m(e, 28, F[e.token & 255]);
    }
  },
  k0 = function (e, t, r, n, o, i, a) {
    let u = G(e, t, 0);
    if (e.token === 67108877) return cn(e, t, u, o, i, a);
    if (r) m(e, 138);
    return (
      (u = fn(e, t, n, o, i, a)), (e.assignable = 2), q(e, t, u, n, 0, o, i, a)
    );
  },
  cn = function (e, t, r, n, o, i) {
    if ((t & 2048) === 0) m(e, 164);
    if ((v(e, t), e.token !== 143495 && e.tokenValue !== "meta"))
      m(e, 28, F[e.token & 255]);
    return (
      (e.assignable = 2),
      y(e, t, n, o, i, { type: "MetaProperty", meta: r, property: G(e, t, 0) })
    );
  },
  fn = function (e, t, r, n, o, i) {
    if ((C(e, t | 32768, 67174411), e.token === 14)) m(e, 139);
    const a = O(e, t, 1, 0, r, e.tokenPos, e.linePos, e.colPos);
    return (
      C(e, t, 16), y(e, t, n, o, i, { type: "ImportExpression", source: a })
    );
  },
  dn = function (e, t, r, n, o) {
    const { tokenRaw: i, tokenValue: a } = e;
    return (
      v(e, t),
      (e.assignable = 2),
      y(
        e,
        t,
        r,
        n,
        o,
        t & 512
          ? { type: "Literal", value: a, bigint: i.slice(0, -1), raw: i }
          : { type: "Literal", value: a, bigint: i.slice(0, -1) },
      )
    );
  },
  Vt = function (e, t, r, n, o) {
    e.assignable = 2;
    const {
      tokenValue: i,
      tokenRaw: a,
      tokenPos: u,
      linePos: s,
      colPos: c,
    } = e;
    C(e, t, 67174409);
    const d = [Ze(e, t, i, a, u, s, c, !0)];
    return y(e, t, r, n, o, {
      type: "TemplateLiteral",
      expressions: [],
      quasis: d,
    });
  },
  Bt = function (e, t) {
    t = (t | 134217728) ^ 134217728;
    const {
      tokenValue: r,
      tokenRaw: n,
      tokenPos: o,
      linePos: i,
      colPos: a,
    } = e;
    C(e, t | 32768, 67174408);
    const u = [Ze(e, t, r, n, o, i, a, !1)],
      s = [M(e, t, 0, 1, e.tokenPos, e.linePos, e.colPos)];
    if (e.token !== 1074790415) m(e, 81);
    while ((e.token = No(e, t)) !== 67174409) {
      const {
        tokenValue: c,
        tokenRaw: d,
        tokenPos: f,
        linePos: l,
        colPos: g,
      } = e;
      if (
        (C(e, t | 32768, 67174408),
        u.push(Ze(e, t, c, d, f, l, g, !1)),
        s.push(M(e, t, 0, 1, e.tokenPos, e.linePos, e.colPos)),
        e.token !== 1074790415)
      )
        m(e, 81);
    }
    {
      const {
        tokenValue: c,
        tokenRaw: d,
        tokenPos: f,
        linePos: l,
        colPos: g,
      } = e;
      C(e, t, 67174409), u.push(Ze(e, t, c, d, f, l, g, !0));
    }
    return y(e, t, o, i, a, {
      type: "TemplateLiteral",
      expressions: s,
      quasis: u,
    });
  },
  Ze = function (e, t, r, n, o, i, a, u) {
    const s = y(e, t, o, i, a, {
        type: "TemplateElement",
        value: { cooked: r, raw: n },
        tail: u,
      }),
      c = u ? 1 : 2;
    if (t & 2)
      (s.start += 1), (s.range[0] += 1), (s.end -= c), (s.range[1] -= c);
    if (t & 4) (s.loc.start.column += 1), (s.loc.end.column -= c);
    return s;
  },
  x0 = function (e, t, r, n, o) {
    (t = (t | 134217728) ^ 134217728), C(e, t | 32768, 14);
    const i = O(e, t, 1, 0, 0, e.tokenPos, e.linePos, e.colPos);
    return (
      (e.assignable = 1),
      y(e, t, r, n, o, { type: "SpreadElement", argument: i })
    );
  },
  Xt = function (e, t, r) {
    v(e, t | 32768);
    const n = [];
    if (e.token === 16) return v(e, t), n;
    while (e.token !== 16) {
      if (e.token === 14) n.push(x0(e, t, e.tokenPos, e.linePos, e.colPos));
      else n.push(O(e, t, 1, 0, r, e.tokenPos, e.linePos, e.colPos));
      if (e.token !== 18) break;
      if ((v(e, t | 32768), e.token === 16)) break;
    }
    return C(e, t, 16), n;
  },
  G = function (e, t, r) {
    const { tokenValue: n, tokenPos: o, linePos: i, colPos: a } = e;
    return (
      v(e, t),
      y(
        e,
        t,
        o,
        i,
        a,
        t & 268435456
          ? { type: "Identifier", name: n, pattern: r === 1 }
          : { type: "Identifier", name: n },
      )
    );
  },
  H = function (e, t) {
    const {
      tokenValue: r,
      tokenRaw: n,
      tokenPos: o,
      linePos: i,
      colPos: a,
    } = e;
    if (e.token === 134283389) return dn(e, t, o, i, a);
    return (
      v(e, t),
      (e.assignable = 2),
      y(
        e,
        t,
        o,
        i,
        a,
        t & 512
          ? { type: "Literal", value: r, raw: n }
          : { type: "Literal", value: r },
      )
    );
  },
  b0 = function (e, t, r, n, o) {
    const i = F[e.token & 255],
      a = e.token === 86023 ? null : i === "true";
    return (
      v(e, t),
      (e.assignable = 2),
      y(
        e,
        t,
        r,
        n,
        o,
        t & 512
          ? { type: "Literal", value: a, raw: i }
          : { type: "Literal", value: a },
      )
    );
  },
  v0 = function (e, t) {
    const { tokenPos: r, linePos: n, colPos: o } = e;
    return (
      v(e, t), (e.assignable = 2), y(e, t, r, n, o, { type: "ThisExpression" })
    );
  },
  ue = function (e, t, r, n, o, i, a, u, s, c) {
    v(e, t | 32768);
    const d = o ? qt(e, t, 8457014) : 0;
    let f = null,
      l,
      g = r ? pe() : void 0;
    if (e.token === 67174411) {
      if ((i & 1) === 0) m(e, 37, "Function");
    } else {
      const x = n & 4 && ((t & 8192) === 0 || (t & 2048) === 0) ? 4 : 64;
      if ((Qr(e, t | ((t & 3072) << 11), e.token), r)) {
        if (x & 4) rn(e, t, r, e.tokenValue, x);
        else se(e, t, r, e.tokenValue, x, n);
        if (((g = V(g, 256)), i)) {
          if (i & 2) ce(e, e.tokenValue);
        }
      }
      if (((l = e.token), e.token & 143360)) f = G(e, t, 0);
      else m(e, 28, F[e.token & 255]);
    }
    if (
      ((t =
        ((t | 32243712) ^ 32243712) |
        67108864 |
        ((a * 2 + d) << 21) |
        (d ? 0 : 1073741824)),
      r)
    )
      g = V(g, 512);
    const p = pn(e, t | 8388608, g, 0, 1),
      h = gt(
        e,
        (t | 8192 | 4096 | 131072) ^ (8192 | 4096 | 131072),
        r ? V(g, 128) : g,
        8,
        l,
        r ? g.scopeError : void 0,
      );
    return y(e, t, u, s, c, {
      type: "FunctionDeclaration",
      id: f,
      params: p,
      body: h,
      async: a === 1,
      generator: d === 1,
    });
  },
  mn = function (e, t, r, n, o, i, a) {
    v(e, t | 32768);
    const u = qt(e, t, 8457014),
      s = (r * 2 + u) << 21;
    let c = null,
      d,
      f = t & 64 ? pe() : void 0;
    if ((e.token & (143360 | 4096 | 36864)) > 0) {
      if ((Qr(e, ((t | 32243712) ^ 32243712) | s, e.token), f)) f = V(f, 256);
      (d = e.token), (c = G(e, t, 0));
    }
    if (
      ((t = ((t | 32243712) ^ 32243712) | 67108864 | s | (u ? 0 : 1073741824)),
      f)
    )
      f = V(f, 512);
    const l = pn(e, t | 8388608, f, n, 1),
      g = gt(
        e,
        t & ~(134221824 | 8192 | 4096 | 131072 | 16384),
        f ? V(f, 128) : f,
        0,
        d,
        void 0,
      );
    return (
      (e.assignable = 2),
      y(e, t, o, i, a, {
        type: "FunctionExpression",
        id: c,
        params: l,
        body: g,
        async: r === 1,
        generator: u === 1,
      })
    );
  },
  E0 = function (e, t, r, n, o, i, a) {
    const u = Z(e, t, void 0, r, n, 0, 2, 0, o, i, a);
    if (t & 256 && e.destructible & 64) m(e, 61);
    if (e.destructible & 8) m(e, 60);
    return u;
  },
  Z = function (e, t, r, n, o, i, a, u, s, c, d) {
    v(e, t | 32768);
    const f = [];
    let l = 0;
    t = (t | 134217728) ^ 134217728;
    while (e.token !== 20)
      if (T(e, t | 32768, 18)) f.push(null);
      else {
        let p;
        const {
          token: h,
          tokenPos: x,
          linePos: b,
          colPos: A,
          tokenValue: w,
        } = e;
        if (h & 143360) {
          if (
            ((p = Y(e, t, a, 0, 1, 0, o, 1, x, b, A)), e.token === 1077936157)
          ) {
            if (e.assignable & 2) m(e, 24);
            if ((v(e, t | 32768), r)) oe(e, t, r, w, a, u);
            const I = O(e, t, 1, 1, o, e.tokenPos, e.linePos, e.colPos);
            (p = y(
              e,
              t,
              x,
              b,
              A,
              i
                ? { type: "AssignmentPattern", left: p, right: I }
                : {
                    type: "AssignmentExpression",
                    operator: "=",
                    left: p,
                    right: I,
                  },
            )),
              (l |=
                e.destructible & 256
                  ? 256
                  : 0 | (e.destructible & 128)
                    ? 128
                    : 0);
          } else if (e.token === 18 || e.token === 20) {
            if (e.assignable & 2) l |= 16;
            else if (r) oe(e, t, r, w, a, u);
            l |=
              e.destructible & 256 ? 256 : 0 | (e.destructible & 128) ? 128 : 0;
          } else if (
            ((l |= a & 1 ? 32 : (a & 2) === 0 ? 16 : 0),
            (p = q(e, t, p, o, 0, x, b, A)),
            e.token !== 18 && e.token !== 20)
          ) {
            if (e.token !== 1077936157) l |= 16;
            p = _(e, t, o, i, x, b, A, p);
          } else if (e.token !== 1077936157) l |= e.assignable & 2 ? 16 : 32;
        } else if (h & 2097152) {
          if (
            ((p =
              e.token === 2162700
                ? Q(e, t, r, 0, o, i, a, u, x, b, A)
                : Z(e, t, r, 0, o, i, a, u, x, b, A)),
            (l |= e.destructible),
            (e.assignable = e.destructible & 16 ? 2 : 1),
            e.token === 18 || e.token === 20)
          ) {
            if (e.assignable & 2) l |= 16;
          } else if (e.destructible & 8) m(e, 69);
          else if (
            ((p = q(e, t, p, o, 0, x, b, A)),
            (l = e.assignable & 2 ? 16 : 0),
            e.token !== 18 && e.token !== 20)
          )
            p = _(e, t, o, i, x, b, A, p);
          else if (e.token !== 1077936157) l |= e.assignable & 2 ? 16 : 32;
        } else if (h === 14) {
          if (
            ((p = Ie(e, t, r, 20, a, u, 0, o, i, x, b, A)),
            (l |= e.destructible),
            e.token !== 18 && e.token !== 20)
          )
            m(e, 28, F[e.token & 255]);
        } else if (
          ((p = $(e, t, 1, 0, 1, x, b, A)), e.token !== 18 && e.token !== 20)
        ) {
          if (
            ((p = _(e, t, o, i, x, b, A, p)),
            (a & (2 | 1)) === 0 && h === 67174411)
          )
            l |= 16;
        } else if (e.assignable & 2) l |= 16;
        else if (h === 67174411) l |= e.assignable & 1 && a & (2 | 1) ? 32 : 16;
        if ((f.push(p), T(e, t | 32768, 18))) {
          if (e.token === 20) break;
        } else break;
      }
    C(e, t, 20);
    const g = y(e, t, s, c, d, {
      type: i ? "ArrayPattern" : "ArrayExpression",
      elements: f,
    });
    if (!n && e.token & 4194304) return gn(e, t, l, o, i, s, c, d, g);
    return (e.destructible = l), g;
  },
  gn = function (e, t, r, n, o, i, a, u, s) {
    if (e.token !== 1077936157) m(e, 24);
    if ((v(e, t | 32768), r & 16)) m(e, 24);
    if (!o) re(e, s);
    const { tokenPos: c, linePos: d, colPos: f } = e,
      l = O(e, t, 1, 1, n, c, d, f);
    return (
      (e.destructible =
        ((r | 64 | 8) ^ (8 | 64)) |
        (e.destructible & 128 ? 128 : 0) |
        (e.destructible & 256 ? 256 : 0)),
      y(
        e,
        t,
        i,
        a,
        u,
        o
          ? { type: "AssignmentPattern", left: s, right: l }
          : { type: "AssignmentExpression", left: s, operator: "=", right: l },
      )
    );
  },
  Ie = function (e, t, r, n, o, i, a, u, s, c, d, f) {
    v(e, t | 32768);
    let l = null,
      g = 0,
      { token: p, tokenValue: h, tokenPos: x, linePos: b, colPos: A } = e;
    if (p & (4096 | 143360)) {
      if (
        ((e.assignable = 1),
        (l = Y(e, t, o, 0, 1, 0, u, 1, x, b, A)),
        (p = e.token),
        (l = q(e, t, l, u, 0, x, b, A)),
        e.token !== 18 && e.token !== n)
      ) {
        if (e.assignable & 2 && e.token === 1077936157) m(e, 69);
        (g |= 16), (l = _(e, t, u, s, x, b, A, l));
      }
      if (e.assignable & 2) g |= 16;
      else if (p === n || p === 18) {
        if (r) oe(e, t, r, h, o, i);
      } else g |= 32;
      g |= e.destructible & 128 ? 128 : 0;
    } else if (p === n) m(e, 39);
    else if (p & 2097152)
      if (
        ((l =
          e.token === 2162700
            ? Q(e, t, r, 1, u, s, o, i, x, b, A)
            : Z(e, t, r, 1, u, s, o, i, x, b, A)),
        (p = e.token),
        p !== 1077936157 && p !== n && p !== 18)
      ) {
        if (e.destructible & 8) m(e, 69);
        if (
          ((l = q(e, t, l, u, 0, x, b, A)),
          (g |= e.assignable & 2 ? 16 : 0),
          (e.token & 4194304) === 4194304)
        ) {
          if (e.token !== 1077936157) g |= 16;
          l = _(e, t, u, s, x, b, A, l);
        } else {
          if ((e.token & 8454144) === 8454144)
            l = ae(e, t, 1, x, b, A, 4, p, l);
          if (T(e, t | 32768, 22)) l = fe(e, t, l, x, b, A);
          g |= e.assignable & 2 ? 16 : 32;
        }
      } else g |= n === 1074790415 && p !== 1077936157 ? 16 : e.destructible;
    else {
      (g |= 32), (l = $(e, t, 1, u, 1, e.tokenPos, e.linePos, e.colPos));
      const { token: w, tokenPos: I, linePos: S, colPos: P } = e;
      if (w === 1077936157 && w !== n && w !== 18) {
        if (e.assignable & 2) m(e, 24);
        (l = _(e, t, u, s, I, S, P, l)), (g |= 16);
      } else {
        if (w === 18) g |= 16;
        else if (w !== n) l = _(e, t, u, s, I, S, P, l);
        g |= e.assignable & 1 ? 32 : 16;
      }
      if (((e.destructible = g), e.token !== n && e.token !== 18)) m(e, 156);
      return y(e, t, c, d, f, {
        type: s ? "RestElement" : "SpreadElement",
        argument: l,
      });
    }
    if (e.token !== n) {
      if (o & 1) g |= a ? 16 : 32;
      if (T(e, t | 32768, 1077936157)) {
        if (g & 16) m(e, 24);
        re(e, l);
        const w = O(e, t, 1, 1, u, e.tokenPos, e.linePos, e.colPos);
        (l = y(
          e,
          t,
          x,
          b,
          A,
          s
            ? { type: "AssignmentPattern", left: l, right: w }
            : {
                type: "AssignmentExpression",
                left: l,
                operator: "=",
                right: w,
              },
        )),
          (g = 16);
      } else g |= 16;
    }
    return (
      (e.destructible = g),
      y(e, t, c, d, f, {
        type: s ? "RestElement" : "SpreadElement",
        argument: l,
      })
    );
  },
  ee = function (e, t, r, n, o, i, a) {
    const u = (r & 64) === 0 ? 31981568 : 14680064;
    t = ((t | u) ^ u) | ((r & 88) << 18) | 100925440;
    let s = t & 64 ? V(pe(), 512) : void 0;
    const c = I0(e, t | 8388608, s, r, 1, n);
    if (s) s = V(s, 128);
    const d = gt(e, t & ~(134221824 | 8192), s, 0, void 0, void 0);
    return y(e, t, o, i, a, {
      type: "FunctionExpression",
      params: c,
      body: d,
      async: (r & 16) > 0,
      generator: (r & 8) > 0,
      id: null,
    });
  },
  C0 = function (e, t, r, n, o, i, a) {
    const u = Q(e, t, void 0, r, n, 0, 2, 0, o, i, a);
    if (t & 256 && e.destructible & 64) m(e, 61);
    if (e.destructible & 8) m(e, 60);
    return u;
  },
  Q = function (e, t, r, n, o, i, a, u, s, c, d) {
    v(e, t);
    const f = [];
    let l = 0,
      g = 0;
    t = (t | 134217728) ^ 134217728;
    while (e.token !== 1074790415) {
      const { token: h, tokenValue: x, linePos: b, colPos: A, tokenPos: w } = e;
      if (h === 14) f.push(Ie(e, t, r, 1074790415, a, u, 0, o, i, w, b, A));
      else {
        let I = 0,
          S = null,
          P;
        const B = e.token;
        if (e.token & (143360 | 4096) || e.token === 121)
          if (
            ((S = G(e, t, 0)),
            e.token === 18 || e.token === 1074790415 || e.token === 1077936157)
          ) {
            if (((I |= 4), t & 1024 && (h & 537079808) === 537079808)) l |= 16;
            else it(e, t, a, h, 0);
            if (r) oe(e, t, r, x, a, u);
            if (T(e, t | 32768, 1077936157)) {
              l |= 8;
              const E = O(e, t, 1, 1, o, e.tokenPos, e.linePos, e.colPos);
              (l |=
                e.destructible & 256
                  ? 256
                  : 0 | (e.destructible & 128)
                    ? 128
                    : 0),
                (P = y(e, t, w, b, A, {
                  type: "AssignmentPattern",
                  left: t & -2147483648 ? Object.assign({}, S) : S,
                  right: E,
                }));
            } else
              (l |= (h === 209008 ? 128 : 0) | (h === 121 ? 16 : 0)),
                (P = t & -2147483648 ? Object.assign({}, S) : S);
          } else if (T(e, t | 32768, 21)) {
            const { tokenPos: E, linePos: R, colPos: N } = e;
            if (x === "__proto__") g++;
            if (e.token & 143360) {
              const { token: X, tokenValue: K } = e;
              (l |= B === 121 ? 16 : 0),
                (P = Y(e, t, a, 0, 1, 0, o, 1, E, R, N));
              const { token: L } = e;
              if (
                ((P = q(e, t, P, o, 0, E, R, N)),
                e.token === 18 || e.token === 1074790415)
              )
                if (L === 1077936157 || L === 1074790415 || L === 18) {
                  if (((l |= e.destructible & 128 ? 128 : 0), e.assignable & 2))
                    l |= 16;
                  else if (r && (X & 143360) === 143360) oe(e, t, r, K, a, u);
                } else l |= e.assignable & 1 ? 32 : 16;
              else if ((e.token & 4194304) === 4194304) {
                if (e.assignable & 2) l |= 16;
                else if (L !== 1077936157) l |= 32;
                else if (r) oe(e, t, r, K, a, u);
                P = _(e, t, o, i, E, R, N, P);
              } else {
                if (((l |= 16), (e.token & 8454144) === 8454144))
                  P = ae(e, t, 1, E, R, N, 4, L, P);
                if (T(e, t | 32768, 22)) P = fe(e, t, P, E, R, N);
              }
            } else if ((e.token & 2097152) === 2097152)
              if (
                ((P =
                  e.token === 69271571
                    ? Z(e, t, r, 0, o, i, a, u, E, R, N)
                    : Q(e, t, r, 0, o, i, a, u, E, R, N)),
                (l = e.destructible),
                (e.assignable = l & 16 ? 2 : 1),
                e.token === 18 || e.token === 1074790415)
              ) {
                if (e.assignable & 2) l |= 16;
              } else if (e.destructible & 8) m(e, 69);
              else if (
                ((P = q(e, t, P, o, 0, E, R, N)),
                (l = e.assignable & 2 ? 16 : 0),
                (e.token & 4194304) === 4194304)
              )
                P = Ue(e, t, o, i, E, R, N, P);
              else {
                if ((e.token & 8454144) === 8454144)
                  P = ae(e, t, 1, E, R, N, 4, h, P);
                if (T(e, t | 32768, 22)) P = fe(e, t, P, E, R, N);
                l |= e.assignable & 2 ? 16 : 32;
              }
            else if (
              ((P = $(e, t, 1, o, 1, E, R, N)),
              (l |= e.assignable & 1 ? 32 : 16),
              e.token === 18 || e.token === 1074790415)
            ) {
              if (e.assignable & 2) l |= 16;
            } else if (
              ((P = q(e, t, P, o, 0, E, R, N)),
              (l = e.assignable & 2 ? 16 : 0),
              e.token !== 18 && h !== 1074790415)
            ) {
              if (e.token !== 1077936157) l |= 16;
              P = _(e, t, o, i, E, R, N, P);
            }
          } else if (e.token === 69271571) {
            if (((l |= 16), h === 209007)) I |= 16;
            (I |= (h === 12402 ? 256 : h === 12403 ? 512 : 1) | 2),
              (S = xe(e, t, o)),
              (l |= e.assignable),
              (P = ee(e, t, I, o, e.tokenPos, e.linePos, e.colPos));
          } else if (e.token & (143360 | 4096)) {
            if (((l |= 16), h === 121)) m(e, 93);
            if (h === 209007) {
              if (e.flags & 1) m(e, 129);
              I |= 16;
            }
            (S = G(e, t, 0)),
              (I |= h === 12402 ? 256 : h === 12403 ? 512 : 1),
              (P = ee(e, t, I, o, e.tokenPos, e.linePos, e.colPos));
          } else if (e.token === 67174411)
            (l |= 16),
              (I |= 1),
              (P = ee(e, t, I, o, e.tokenPos, e.linePos, e.colPos));
          else if (e.token === 8457014) {
            if (((l |= 16), h === 12402)) m(e, 40);
            else if (h === 12403) m(e, 41);
            else if (h === 143483) m(e, 93);
            if (
              (v(e, t),
              (I |= 8 | 1 | (h === 209007 ? 16 : 0)),
              e.token & 143360)
            )
              S = G(e, t, 0);
            else if ((e.token & 134217728) === 134217728) S = H(e, t);
            else if (e.token === 69271571)
              (I |= 2), (S = xe(e, t, o)), (l |= e.assignable);
            else m(e, 28, F[e.token & 255]);
            P = ee(e, t, I, o, e.tokenPos, e.linePos, e.colPos);
          } else if ((e.token & 134217728) === 134217728) {
            if (h === 209007) I |= 16;
            (I |= h === 12402 ? 256 : h === 12403 ? 512 : 1),
              (l |= 16),
              (S = H(e, t)),
              (P = ee(e, t, I, o, e.tokenPos, e.linePos, e.colPos));
          } else m(e, 130);
        else if ((e.token & 134217728) === 134217728)
          if (((S = H(e, t)), e.token === 21)) {
            C(e, t | 32768, 21);
            const { tokenPos: E, linePos: R, colPos: N } = e;
            if (x === "__proto__") g++;
            if (e.token & 143360) {
              P = Y(e, t, a, 0, 1, 0, o, 1, E, R, N);
              const { token: X, tokenValue: K } = e;
              if (
                ((P = q(e, t, P, o, 0, E, R, N)),
                e.token === 18 || e.token === 1074790415)
              )
                if (X === 1077936157 || X === 1074790415 || X === 18) {
                  if (e.assignable & 2) l |= 16;
                  else if (r) oe(e, t, r, K, a, u);
                } else l |= e.assignable & 1 ? 32 : 16;
              else if (e.token === 1077936157) {
                if (e.assignable & 2) l |= 16;
                P = _(e, t, o, i, E, R, N, P);
              } else (l |= 16), (P = _(e, t, o, i, E, R, N, P));
            } else if ((e.token & 2097152) === 2097152) {
              if (
                ((P =
                  e.token === 69271571
                    ? Z(e, t, r, 0, o, i, a, u, E, R, N)
                    : Q(e, t, r, 0, o, i, a, u, E, R, N)),
                (l = e.destructible),
                (e.assignable = l & 16 ? 2 : 1),
                e.token === 18 || e.token === 1074790415)
              ) {
                if (e.assignable & 2) l |= 16;
              } else if ((e.destructible & 8) !== 8)
                if (
                  ((P = q(e, t, P, o, 0, E, R, N)),
                  (l = e.assignable & 2 ? 16 : 0),
                  (e.token & 4194304) === 4194304)
                )
                  P = Ue(e, t, o, i, E, R, N, P);
                else {
                  if ((e.token & 8454144) === 8454144)
                    P = ae(e, t, 1, E, R, N, 4, h, P);
                  if (T(e, t | 32768, 22)) P = fe(e, t, P, E, R, N);
                  l |= e.assignable & 2 ? 16 : 32;
                }
            } else if (
              ((P = $(e, t, 1, 0, 1, E, R, N)),
              (l |= e.assignable & 1 ? 32 : 16),
              e.token === 18 || e.token === 1074790415)
            ) {
              if (e.assignable & 2) l |= 16;
            } else if (
              ((P = q(e, t, P, o, 0, E, R, N)),
              (l = e.assignable & 1 ? 0 : 16),
              e.token !== 18 && e.token !== 1074790415)
            ) {
              if (e.token !== 1077936157) l |= 16;
              P = _(e, t, o, i, E, R, N, P);
            }
          } else if (e.token === 67174411)
            (I |= 1),
              (P = ee(e, t, I, o, e.tokenPos, e.linePos, e.colPos)),
              (l = e.assignable | 16);
          else m(e, 131);
        else if (e.token === 69271571)
          if (
            ((S = xe(e, t, o)),
            (l |= e.destructible & 256 ? 256 : 0),
            (I |= 2),
            e.token === 21)
          ) {
            v(e, t | 32768);
            const {
              tokenPos: E,
              linePos: R,
              colPos: N,
              tokenValue: X,
              token: K,
            } = e;
            if (e.token & 143360) {
              P = Y(e, t, a, 0, 1, 0, o, 1, E, R, N);
              const { token: L } = e;
              if (
                ((P = q(e, t, P, o, 0, E, R, N)),
                (e.token & 4194304) === 4194304)
              )
                (l |= e.assignable & 2 ? 16 : L === 1077936157 ? 0 : 32),
                  (P = Ue(e, t, o, i, E, R, N, P));
              else if (e.token === 18 || e.token === 1074790415)
                if (L === 1077936157 || L === 1074790415 || L === 18) {
                  if (e.assignable & 2) l |= 16;
                  else if (r && (K & 143360) === 143360) oe(e, t, r, X, a, u);
                } else l |= e.assignable & 1 ? 32 : 16;
              else (l |= 16), (P = _(e, t, o, i, E, R, N, P));
            } else if ((e.token & 2097152) === 2097152)
              if (
                ((P =
                  e.token === 69271571
                    ? Z(e, t, r, 0, o, i, a, u, E, R, N)
                    : Q(e, t, r, 0, o, i, a, u, E, R, N)),
                (l = e.destructible),
                (e.assignable = l & 16 ? 2 : 1),
                e.token === 18 || e.token === 1074790415)
              ) {
                if (e.assignable & 2) l |= 16;
              } else if (l & 8) m(e, 60);
              else if (
                ((P = q(e, t, P, o, 0, E, R, N)),
                (l = e.assignable & 2 ? l | 16 : 0),
                (e.token & 4194304) === 4194304)
              ) {
                if (e.token !== 1077936157) l |= 16;
                P = Ue(e, t, o, i, E, R, N, P);
              } else {
                if ((e.token & 8454144) === 8454144)
                  P = ae(e, t, 1, E, R, N, 4, h, P);
                if (T(e, t | 32768, 22)) P = fe(e, t, P, E, R, N);
                l |= e.assignable & 2 ? 16 : 32;
              }
            else if (
              ((P = $(e, t, 1, 0, 1, E, R, N)),
              (l |= e.assignable & 1 ? 32 : 16),
              e.token === 18 || e.token === 1074790415)
            ) {
              if (e.assignable & 2) l |= 16;
            } else if (
              ((P = q(e, t, P, o, 0, E, R, N)),
              (l = e.assignable & 1 ? 0 : 16),
              e.token !== 18 && e.token !== 1074790415)
            ) {
              if (e.token !== 1077936157) l |= 16;
              P = _(e, t, o, i, E, R, N, P);
            }
          } else if (e.token === 67174411)
            (I |= 1), (P = ee(e, t, I, o, e.tokenPos, b, A)), (l = 16);
          else m(e, 42);
        else if (h === 8457014)
          if ((C(e, t | 32768, 8457014), (I |= 8), e.token & 143360)) {
            const { token: E, line: R, index: N } = e;
            if (((S = G(e, t, 0)), (I |= 1), e.token === 67174411))
              (l |= 16), (P = ee(e, t, I, o, e.tokenPos, e.linePos, e.colPos));
            else
              ve(
                N,
                R,
                N,
                E === 209007 ? 44 : E === 12402 || e.token === 12403 ? 43 : 45,
                F[E & 255],
              );
          } else if ((e.token & 134217728) === 134217728)
            (l |= 16), (S = H(e, t)), (I |= 1), (P = ee(e, t, I, o, w, b, A));
          else if (e.token === 69271571)
            (l |= 16),
              (I |= 2 | 1),
              (S = xe(e, t, o)),
              (P = ee(e, t, I, o, e.tokenPos, e.linePos, e.colPos));
          else m(e, 123);
        else m(e, 28, F[h & 255]);
        (l |= e.destructible & 128 ? 128 : 0),
          (e.destructible = l),
          f.push(
            y(e, t, w, b, A, {
              type: "Property",
              key: S,
              value: P,
              kind: !(I & 768) ? "init" : I & 512 ? "set" : "get",
              computed: (I & 2) > 0,
              method: (I & 1) > 0,
              shorthand: (I & 4) > 0,
            }),
          );
      }
      if (((l |= e.destructible), e.token !== 18)) break;
      v(e, t);
    }
    if ((C(e, t, 1074790415), g > 1)) l |= 64;
    const p = y(e, t, s, c, d, {
      type: i ? "ObjectPattern" : "ObjectExpression",
      properties: f,
    });
    if (!n && e.token & 4194304) return gn(e, t, l, o, i, s, c, d, p);
    return (e.destructible = l), p;
  },
  I0 = function (e, t, r, n, o, i) {
    C(e, t, 67174411);
    const a = [];
    if (((e.flags = (e.flags | 128) ^ 128), e.token === 16)) {
      if (n & 512) m(e, 35, "Setter", "one", "");
      return v(e, t), a;
    }
    if (n & 256) m(e, 35, "Getter", "no", "s");
    if (n & 512 && e.token === 14) m(e, 36);
    t = (t | 134217728) ^ 134217728;
    let u = 0,
      s = 0;
    while (e.token !== 18) {
      let c = null;
      const { tokenPos: d, linePos: f, colPos: l } = e;
      if (e.token & 143360) {
        if ((t & 1024) === 0) {
          if ((e.token & 36864) === 36864) e.flags |= 256;
          if ((e.token & 537079808) === 537079808) e.flags |= 512;
        }
        c = Wt(e, t, r, n | 1, 0, d, f, l);
      } else {
        if (e.token === 2162700) c = Q(e, t, r, 1, i, 1, o, 0, d, f, l);
        else if (e.token === 69271571) c = Z(e, t, r, 1, i, 1, o, 0, d, f, l);
        else if (e.token === 14) c = Ie(e, t, r, 16, o, 0, 0, i, 1, d, f, l);
        if (((s = 1), e.destructible & (32 | 16))) m(e, 48);
      }
      if (e.token === 1077936157) {
        v(e, t | 32768), (s = 1);
        const g = O(e, t, 1, 1, 0, e.tokenPos, e.linePos, e.colPos);
        c = y(e, t, d, f, l, { type: "AssignmentPattern", left: c, right: g });
      }
      if ((u++, a.push(c), !T(e, t, 18))) break;
      if (e.token === 16) break;
    }
    if (n & 512 && u !== 1) m(e, 35, "Setter", "one", "");
    if (r && r.scopeError !== void 0) dt(r.scopeError);
    if (s) e.flags |= 128;
    return C(e, t, 16), a;
  },
  xe = function (e, t, r) {
    v(e, t | 32768);
    const n = O(
      e,
      (t | 134217728) ^ 134217728,
      1,
      0,
      r,
      e.tokenPos,
      e.linePos,
      e.colPos,
    );
    return C(e, t, 20), n;
  },
  A0 = function (e, t, r, n, o, i, a, u) {
    e.flags = (e.flags | 128) ^ 128;
    const { tokenPos: s, linePos: c, colPos: d } = e;
    v(e, t | 32768 | 1073741824);
    const f = t & 64 ? V(pe(), 1024) : void 0;
    if (((t = (t | 134217728) ^ 134217728), T(e, t, 16)))
      return ut(e, t, f, [], r, 0, i, a, u);
    let l = 0;
    e.destructible &= ~(256 | 128);
    let g,
      p = [],
      h = 0,
      x = 0;
    const { tokenPos: b, linePos: A, colPos: w } = e;
    e.assignable = 1;
    while (e.token !== 16) {
      const { token: I, tokenPos: S, linePos: P, colPos: B } = e;
      if (I & (143360 | 4096)) {
        if (f) se(e, t, f, e.tokenValue, 1, 0);
        if (
          ((g = Y(e, t, n, 0, 1, 0, 1, 1, S, P, B)),
          e.token === 16 || e.token === 18)
        ) {
          if (e.assignable & 2) (l |= 16), (x = 1);
          else if ((I & 537079808) === 537079808 || (I & 36864) === 36864)
            x = 1;
        } else {
          if (e.token === 1077936157) x = 1;
          else l |= 16;
          if (
            ((g = q(e, t, g, 1, 0, S, P, B)), e.token !== 16 && e.token !== 18)
          )
            g = _(e, t, 1, 0, S, P, B, g);
        }
      } else if ((I & 2097152) === 2097152) {
        if (
          ((g =
            I === 2162700
              ? Q(e, t | 1073741824, f, 0, 1, 0, n, o, S, P, B)
              : Z(e, t | 1073741824, f, 0, 1, 0, n, o, S, P, B)),
          (l |= e.destructible),
          (x = 1),
          (e.assignable = 2),
          e.token !== 16 && e.token !== 18)
        ) {
          if (l & 8) m(e, 119);
          if (
            ((g = q(e, t, g, 0, 0, S, P, B)),
            (l |= 16),
            e.token !== 16 && e.token !== 18)
          )
            g = _(e, t, 0, 0, S, P, B, g);
        }
      } else if (I === 14) {
        if (
          ((g = Ie(e, t, f, 16, n, o, 0, 1, 0, S, P, B)), e.destructible & 16)
        )
          m(e, 72);
        if (((x = 1), h && (e.token === 16 || e.token === 18))) p.push(g);
        l |= 8;
        break;
      } else {
        if (
          ((l |= 16),
          (g = O(e, t, 1, 0, 1, S, P, B)),
          h && (e.token === 16 || e.token === 18))
        )
          p.push(g);
        if (e.token === 18) {
          if (!h) (h = 1), (p = [g]);
        }
        if (h) {
          while (T(e, t | 32768, 18))
            p.push(O(e, t, 1, 0, 1, e.tokenPos, e.linePos, e.colPos));
          (e.assignable = 2),
            (g = y(e, t, b, A, w, {
              type: "SequenceExpression",
              expressions: p,
            }));
        }
        return C(e, t, 16), (e.destructible = l), g;
      }
      if (h && (e.token === 16 || e.token === 18)) p.push(g);
      if (!T(e, t | 32768, 18)) break;
      if (!h) (h = 1), (p = [g]);
      if (e.token === 16) {
        l |= 8;
        break;
      }
    }
    if (h)
      (e.assignable = 2),
        (g = y(e, t, b, A, w, { type: "SequenceExpression", expressions: p }));
    if ((C(e, t, 16), l & 16 && l & 8)) m(e, 146);
    if (
      ((l |= e.destructible & 256 ? 256 : 0 | (e.destructible & 128) ? 128 : 0),
      e.token === 10)
    ) {
      if (l & (32 | 16)) m(e, 47);
      if (t & (4194304 | 2048) && l & 128) m(e, 29);
      if (t & (1024 | 2097152) && l & 256) m(e, 30);
      if (x) e.flags |= 128;
      return ut(e, t, f, h ? p : [g], r, 0, i, a, u);
    } else if (l & 8) m(e, 140);
    return (
      (e.destructible = ((e.destructible | 256) ^ 256) | l),
      t & 128
        ? y(e, t, s, c, d, { type: "ParenthesizedExpression", expression: g })
        : g
    );
  },
  Kt = function (e, t, r, n, o) {
    const { tokenValue: i } = e,
      a = G(e, t, 0);
    if (((e.assignable = 1), e.token === 10)) {
      let u = void 0;
      if (t & 64) u = mt(e, t, i);
      return (e.flags = (e.flags | 128) ^ 128), Fe(e, t, u, [a], 0, r, n, o);
    }
    return a;
  },
  pt = function (e, t, r, n, o, i, a, u, s, c) {
    if (!i) m(e, 55);
    if (o) m(e, 49);
    e.flags &= ~128;
    const d = t & 64 ? mt(e, t, r) : void 0;
    return Fe(e, t, d, [n], a, u, s, c);
  },
  ut = function (e, t, r, n, o, i, a, u, s) {
    if (!o) m(e, 55);
    for (let c = 0; c < n.length; ++c) re(e, n[c]);
    return Fe(e, t, r, n, i, a, u, s);
  },
  Fe = function (e, t, r, n, o, i, a, u) {
    if (e.flags & 1) m(e, 46);
    C(e, t | 32768, 10), (t = ((t | 15728640) ^ 15728640) | (o << 22));
    const s = e.token !== 2162700;
    let c;
    if (r && r.scopeError !== void 0) dt(r.scopeError);
    if (s) c = O(e, t, 1, 0, 0, e.tokenPos, e.linePos, e.colPos);
    else {
      if (r) r = V(r, 128);
      switch (
        ((c = gt(
          e,
          (t | 134221824 | 8192 | 16384) ^ (134221824 | 8192 | 16384),
          r,
          16,
          void 0,
          void 0,
        )),
        e.token)
      ) {
        case 69271571:
          if ((e.flags & 1) === 0) m(e, 113);
          break;
        case 67108877:
        case 67174409:
        case 22:
          m(e, 114);
        case 67174411:
          if ((e.flags & 1) === 0) m(e, 113);
          e.flags |= 1024;
          break;
      }
      if ((e.token & 8454144) === 8454144 && (e.flags & 1) === 0)
        m(e, 28, F[e.token & 255]);
      if ((e.token & 33619968) === 33619968) m(e, 122);
    }
    return (
      (e.assignable = 2),
      y(e, t, i, a, u, {
        type: "ArrowFunctionExpression",
        params: n,
        body: c,
        async: o === 1,
        expression: s,
      })
    );
  },
  pn = function (e, t, r, n, o) {
    C(e, t, 67174411), (e.flags = (e.flags | 128) ^ 128);
    const i = [];
    if (T(e, t, 16)) return i;
    t = (t | 134217728) ^ 134217728;
    let a = 0;
    while (e.token !== 18) {
      let u;
      const { tokenPos: s, linePos: c, colPos: d } = e;
      if (e.token & 143360) {
        if ((t & 1024) === 0) {
          if ((e.token & 36864) === 36864) e.flags |= 256;
          if ((e.token & 537079808) === 537079808) e.flags |= 512;
        }
        u = Wt(e, t, r, o | 1, 0, s, c, d);
      } else {
        if (e.token === 2162700) u = Q(e, t, r, 1, n, 1, o, 0, s, c, d);
        else if (e.token === 69271571) u = Z(e, t, r, 1, n, 1, o, 0, s, c, d);
        else if (e.token === 14) u = Ie(e, t, r, 16, o, 0, 0, n, 1, s, c, d);
        else m(e, 28, F[e.token & 255]);
        if (((a = 1), e.destructible & (32 | 16))) m(e, 48);
      }
      if (e.token === 1077936157) {
        v(e, t | 32768), (a = 1);
        const f = O(e, t, 1, 1, n, e.tokenPos, e.linePos, e.colPos);
        u = y(e, t, s, c, d, { type: "AssignmentPattern", left: u, right: f });
      }
      if ((i.push(u), !T(e, t, 18))) break;
      if (e.token === 16) break;
    }
    if (a) e.flags |= 128;
    if (r && (a || t & 1024) && r.scopeError !== void 0) dt(r.scopeError);
    return C(e, t, 16), i;
  },
  Qe = function (e, t, r, n, o, i, a) {
    const { token: u } = e;
    if (u & 67108864) {
      if (u === 67108877) {
        v(e, t | 1073741824), (e.assignable = 1);
        const s = ln(e, t);
        return Qe(
          e,
          t,
          y(e, t, o, i, a, {
            type: "MemberExpression",
            object: r,
            computed: !1,
            property: s,
          }),
          0,
          o,
          i,
          a,
        );
      } else if (u === 69271571) {
        v(e, t | 32768);
        const { tokenPos: s, linePos: c, colPos: d } = e,
          f = M(e, t, n, 1, s, c, d);
        return (
          C(e, t, 20),
          (e.assignable = 1),
          Qe(
            e,
            t,
            y(e, t, o, i, a, {
              type: "MemberExpression",
              object: r,
              computed: !0,
              property: f,
            }),
            0,
            o,
            i,
            a,
          )
        );
      } else if (u === 67174408 || u === 67174409)
        return (
          (e.assignable = 2),
          Qe(
            e,
            t,
            y(e, t, o, i, a, {
              type: "TaggedTemplateExpression",
              tag: r,
              quasi:
                e.token === 67174408
                  ? Bt(e, t | 65536)
                  : Vt(e, t, e.tokenPos, e.linePos, e.colPos),
            }),
            0,
            o,
            i,
            a,
          )
        );
    }
    return r;
  },
  N0 = function (e, t, r, n, o, i) {
    const a = G(e, t | 32768, 0),
      { tokenPos: u, linePos: s, colPos: c } = e;
    if (T(e, t, 67108877)) {
      if (t & 67108864 && e.token === 143494)
        return (e.assignable = 2), S0(e, t, a, n, o, i);
      m(e, 92);
    }
    if (((e.assignable = 2), (e.token & 16842752) === 16842752))
      m(e, 63, F[e.token & 255]);
    const d = Y(e, t, 2, 1, 0, 0, r, 1, u, s, c);
    if (((t = (t | 134217728) ^ 134217728), e.token === 67108991)) m(e, 163);
    const f = Qe(e, t, d, r, u, s, c);
    return (
      (e.assignable = 2),
      y(e, t, n, o, i, {
        type: "NewExpression",
        callee: f,
        arguments: e.token === 67174411 ? Xt(e, t, r) : [],
      })
    );
  },
  S0 = function (e, t, r, n, o, i) {
    const a = G(e, t, 0);
    return y(e, t, n, o, i, { type: "MetaProperty", meta: r, property: a });
  },
  hn = function (e, t, r, n, o, i) {
    if (e.token === 209008) m(e, 29);
    if (t & (1024 | 2097152) && e.token === 241773) m(e, 30);
    if ((e.token & 537079808) === 537079808) e.flags |= 512;
    return pt(e, t, e.tokenValue, G(e, t, 0), 0, r, 1, n, o, i);
  },
  Mt = function (e, t, r, n, o, i, a, u, s, c) {
    v(e, t | 32768);
    const d = t & 64 ? V(pe(), 1024) : void 0;
    if (((t = (t | 134217728) ^ 134217728), T(e, t, 16))) {
      if (e.token === 10) {
        if (a & 1) m(e, 46);
        return ut(e, t, d, [], n, 1, u, s, c);
      }
      return y(e, t, u, s, c, {
        type: "CallExpression",
        callee: r,
        arguments: [],
      });
    }
    let f = 0,
      l = null,
      g = 0;
    e.destructible = (e.destructible | 256 | 128) ^ (256 | 128);
    const p = [];
    while (e.token !== 16) {
      const { token: h, tokenPos: x, linePos: b, colPos: A } = e;
      if (h & (143360 | 4096)) {
        if (d) se(e, t, d, e.tokenValue, o, 0);
        if (
          ((l = Y(e, t, o, 0, 1, 0, 1, 1, x, b, A)),
          e.token === 16 || e.token === 18)
        ) {
          if (e.assignable & 2) (f |= 16), (g = 1);
          else if ((h & 537079808) === 537079808) e.flags |= 512;
          else if ((h & 36864) === 36864) e.flags |= 256;
        } else {
          if (e.token === 1077936157) g = 1;
          else f |= 16;
          if (
            ((l = q(e, t, l, 1, 0, x, b, A)), e.token !== 16 && e.token !== 18)
          )
            l = _(e, t, 1, 0, x, b, A, l);
        }
      } else if (h & 2097152) {
        if (
          ((l =
            h === 2162700
              ? Q(e, t, d, 0, 1, 0, o, i, x, b, A)
              : Z(e, t, d, 0, 1, 0, o, i, x, b, A)),
          (f |= e.destructible),
          (g = 1),
          e.token !== 16 && e.token !== 18)
        ) {
          if (f & 8) m(e, 119);
          if (
            ((l = q(e, t, l, 0, 0, x, b, A)),
            (f |= 16),
            (e.token & 8454144) === 8454144)
          )
            l = ae(e, t, 1, u, s, c, 4, h, l);
          if (T(e, t | 32768, 22)) l = fe(e, t, l, u, s, c);
        }
      } else if (h === 14)
        (l = Ie(e, t, d, 16, o, i, 1, 1, 0, x, b, A)),
          (f |= (e.token === 16 ? 0 : 16) | e.destructible),
          (g = 1);
      else {
        (l = O(e, t, 1, 0, 0, x, b, A)), (f = e.assignable), p.push(l);
        while (T(e, t | 32768, 18)) p.push(O(e, t, 1, 0, 0, x, b, A));
        return (
          (f |= e.assignable),
          C(e, t, 16),
          (e.destructible = f | 16),
          (e.assignable = 2),
          y(e, t, u, s, c, { type: "CallExpression", callee: r, arguments: p })
        );
      }
      if ((p.push(l), !T(e, t | 32768, 18))) break;
    }
    if (
      (C(e, t, 16),
      (f |= e.destructible & 256 ? 256 : 0 | (e.destructible & 128) ? 128 : 0),
      e.token === 10)
    ) {
      if (f & (32 | 16)) m(e, 25);
      if (e.flags & 1 || a & 1) m(e, 46);
      if (f & 128) m(e, 29);
      if (t & (1024 | 2097152) && f & 256) m(e, 30);
      if (g) e.flags |= 128;
      return ut(e, t, d, p, n, 1, u, s, c);
    } else if (f & 8) m(e, 60);
    return (
      (e.assignable = 2),
      y(e, t, u, s, c, { type: "CallExpression", callee: r, arguments: p })
    );
  },
  w0 = function (e, t, r, n, o) {
    const { tokenRaw: i, tokenRegExp: a, tokenValue: u } = e;
    return (
      v(e, t),
      (e.assignable = 2),
      t & 512
        ? y(e, t, r, n, o, { type: "Literal", value: u, regex: a, raw: i })
        : y(e, t, r, n, o, { type: "Literal", value: u, regex: a })
    );
  },
  St = function (e, t, r, n, o, i, a) {
    t = (t | 16777216 | 1024) ^ 16777216;
    let u = ht(e, t);
    if (u.length) (o = e.tokenPos), (i = e.linePos), (a = e.colPos);
    if (e.leadingDecorators.length)
      e.leadingDecorators.push(...u),
        (u = e.leadingDecorators),
        (e.leadingDecorators = []);
    v(e, t);
    let s = null,
      c = null;
    const { tokenValue: d } = e;
    if (e.token & 4096 && e.token !== 20567) {
      if (en(e, t, e.token)) m(e, 115);
      if ((e.token & 537079808) === 537079808) m(e, 116);
      if (r) {
        if ((se(e, t, r, d, 32, 0), n)) {
          if (n & 2) ce(e, d);
        }
      }
      s = G(e, t, 0);
    } else if ((n & 1) === 0) m(e, 37, "Class");
    let f = t;
    if (T(e, t | 32768, 20567))
      (c = $(e, t, 0, 0, 0, e.tokenPos, e.linePos, e.colPos)), (f |= 524288);
    else f = (f | 524288) ^ 524288;
    const l = yn(e, f, t, r, 2, 8, 0);
    return y(
      e,
      t,
      o,
      i,
      a,
      t & 1
        ? {
            type: "ClassDeclaration",
            id: s,
            superClass: c,
            decorators: u,
            body: l,
          }
        : { type: "ClassDeclaration", id: s, superClass: c, body: l },
    );
  },
  R0 = function (e, t, r, n, o, i) {
    let a = null,
      u = null;
    t = (t | 1024 | 16777216) ^ 16777216;
    const s = ht(e, t);
    if (s.length) (n = e.tokenPos), (o = e.linePos), (i = e.colPos);
    if ((v(e, t), e.token & 4096 && e.token !== 20567)) {
      if (en(e, t, e.token)) m(e, 115);
      if ((e.token & 537079808) === 537079808) m(e, 116);
      a = G(e, t, 0);
    }
    let c = t;
    if (T(e, t | 32768, 20567))
      (u = $(e, t, 0, r, 0, e.tokenPos, e.linePos, e.colPos)), (c |= 524288);
    else c = (c | 524288) ^ 524288;
    const d = yn(e, c, t, void 0, 2, 0, r);
    return (
      (e.assignable = 2),
      y(
        e,
        t,
        n,
        o,
        i,
        t & 1
          ? {
              type: "ClassExpression",
              id: a,
              superClass: u,
              decorators: s,
              body: d,
            }
          : { type: "ClassExpression", id: a, superClass: u, body: d },
      )
    );
  },
  ht = function (e, t) {
    const r = [];
    if (t & 1)
      while (e.token === 133) r.push(T0(e, t, e.tokenPos, e.linePos, e.colPos));
    return r;
  },
  T0 = function (e, t, r, n, o) {
    v(e, t | 32768);
    let i = Y(e, t, 2, 0, 1, 0, 0, 1, r, n, o);
    return (
      (i = q(e, t, i, 0, 0, r, n, o)),
      y(e, t, r, n, o, { type: "Decorator", expression: i })
    );
  },
  yn = function (e, t, r, n, o, i, a) {
    const { tokenPos: u, linePos: s, colPos: c } = e;
    C(e, t | 32768, 2162700), (t = (t | 134217728) ^ 134217728);
    let d = e.flags & 32;
    e.flags = (e.flags | 32) ^ 32;
    const f = [];
    let l;
    while (e.token !== 1074790415) {
      let g = 0;
      if (
        ((l = ht(e, t)),
        (g = l.length),
        g > 0 && e.tokenValue === "constructor")
      )
        m(e, 107);
      if (e.token === 1074790415) m(e, 106);
      if (T(e, t, 1074790417)) {
        if (g > 0) m(e, 117);
        continue;
      }
      f.push(Pn(e, t, n, r, o, l, 0, a, e.tokenPos, e.linePos, e.colPos));
    }
    return (
      C(e, i & 8 ? t | 32768 : t, 1074790415),
      (e.flags = (e.flags & ~32) | d),
      y(e, t, u, s, c, { type: "ClassBody", body: f })
    );
  },
  Pn = function (e, t, r, n, o, i, a, u, s, c, d) {
    let f = a ? 32 : 0,
      l = null;
    const { token: g, tokenPos: p, linePos: h, colPos: x } = e;
    if (g & (143360 | 36864))
      switch (((l = G(e, t, 0)), g)) {
        case 36972:
          if (
            !a &&
            e.token !== 67174411 &&
            (e.token & 1048576) !== 1048576 &&
            e.token !== 1077936157
          )
            return Pn(e, t, r, n, o, i, 1, u, s, c, d);
          break;
        case 209007:
          if (e.token !== 67174411 && (e.flags & 1) === 0) {
            if (t & 1 && (e.token & 1073741824) === 1073741824)
              return ze(e, t, l, f, i, p, h, x);
            f |= 16 | (qt(e, t, 8457014) ? 8 : 0);
          }
          break;
        case 12402:
          if (e.token !== 67174411) {
            if (t & 1 && (e.token & 1073741824) === 1073741824)
              return ze(e, t, l, f, i, p, h, x);
            f |= 256;
          }
          break;
        case 12403:
          if (e.token !== 67174411) {
            if (t & 1 && (e.token & 1073741824) === 1073741824)
              return ze(e, t, l, f, i, p, h, x);
            f |= 512;
          }
          break;
      }
    else if (g === 69271571) (f |= 2), (l = xe(e, n, u));
    else if ((g & 134217728) === 134217728) l = H(e, t);
    else if (g === 8457014) (f |= 8), v(e, t);
    else if (t & 1 && e.token === 131)
      (f |= 4096), (l = st(e, t | 16384, p, h, x));
    else if (t & 1 && (e.token & 1073741824) === 1073741824) f |= 128;
    else if (a && g === 2162700) return o0(e, t, r, p, h, x);
    else if (g === 122) {
      if (((l = G(e, t, 0)), e.token !== 67174411)) m(e, 28, F[e.token & 255]);
    } else m(e, 28, F[e.token & 255]);
    if (f & (8 | 16 | 768))
      if (e.token & 143360) l = G(e, t, 0);
      else if ((e.token & 134217728) === 134217728) l = H(e, t);
      else if (e.token === 69271571) (f |= 2), (l = xe(e, t, 0));
      else if (e.token === 122) l = G(e, t, 0);
      else if (t & 1 && e.token === 131) (f |= 4096), (l = st(e, t, p, h, x));
      else m(e, 132);
    if ((f & 2) === 0) {
      if (e.tokenValue === "constructor") {
        if ((e.token & 1073741824) === 1073741824) m(e, 126);
        else if ((f & 32) === 0 && e.token === 67174411) {
          if (f & (768 | 16 | 128 | 8)) m(e, 51, "accessor");
          else if ((t & 524288) === 0)
            if (e.flags & 32) m(e, 52);
            else e.flags |= 32;
        }
        f |= 64;
      } else if (
        (f & 4096) === 0 &&
        f & (32 | 768 | 8 | 16) &&
        e.tokenValue === "prototype"
      )
        m(e, 50);
    }
    if (t & 1 && e.token !== 67174411) return ze(e, t, l, f, i, p, h, x);
    const b = ee(e, t, f, u, e.tokenPos, e.linePos, e.colPos);
    return y(
      e,
      t,
      s,
      c,
      d,
      t & 1
        ? {
            type: "MethodDefinition",
            kind:
              (f & 32) === 0 && f & 64
                ? "constructor"
                : f & 256
                  ? "get"
                  : f & 512
                    ? "set"
                    : "method",
            static: (f & 32) > 0,
            computed: (f & 2) > 0,
            key: l,
            decorators: i,
            value: b,
          }
        : {
            type: "MethodDefinition",
            kind:
              (f & 32) === 0 && f & 64
                ? "constructor"
                : f & 256
                  ? "get"
                  : f & 512
                    ? "set"
                    : "method",
            static: (f & 32) > 0,
            computed: (f & 2) > 0,
            key: l,
            value: b,
          },
    );
  },
  st = function (e, t, r, n, o) {
    v(e, t);
    const { tokenValue: i } = e;
    if (i === "constructor") m(e, 125);
    return v(e, t), y(e, t, r, n, o, { type: "PrivateIdentifier", name: i });
  },
  ze = function (e, t, r, n, o, i, a, u) {
    let s = null;
    if (n & 8) m(e, 0);
    if (e.token === 1077936157) {
      v(e, t | 32768);
      const { tokenPos: c, linePos: d, colPos: f } = e;
      if (e.token === 537079928) m(e, 116);
      if (
        ((s = Y(e, t | 16384, 2, 0, 1, 0, 0, 1, c, d, f)),
        (e.token & 1073741824) !== 1073741824 ||
          (e.token & 4194304) === 4194304)
      ) {
        if (
          ((s = q(e, t | 16384, s, 0, 0, c, d, f)),
          (s = _(e, t | 16384, 0, 0, c, d, f, s)),
          e.token === 18)
        )
          s = ie(e, t, 0, i, a, u, s);
      }
    }
    return y(e, t, i, a, u, {
      type: "PropertyDefinition",
      key: r,
      value: s,
      static: (n & 32) > 0,
      computed: (n & 2) > 0,
      decorators: o,
    });
  },
  kn = function (e, t, r, n, o, i, a, u) {
    if (e.token & 143360) return Wt(e, t, r, n, o, i, a, u);
    if ((e.token & 2097152) !== 2097152) m(e, 28, F[e.token & 255]);
    const s =
      e.token === 69271571
        ? Z(e, t, r, 1, 0, 1, n, o, i, a, u)
        : Q(e, t, r, 1, 0, 1, n, o, i, a, u);
    if (e.destructible & 16) m(e, 48);
    if (e.destructible & 32) m(e, 48);
    return s;
  },
  Wt = function (e, t, r, n, o, i, a, u) {
    const { tokenValue: s, token: c } = e;
    if (t & 1024) {
      if ((c & 537079808) === 537079808) m(e, 116);
      else if ((c & 36864) === 36864) m(e, 115);
    }
    if ((c & 20480) === 20480) m(e, 100);
    if (t & (2048 | 2097152) && c === 241773) m(e, 30);
    if (c === 241739) {
      if (n & (8 | 16)) m(e, 98);
    }
    if (t & (4194304 | 2048) && c === 209008) m(e, 96);
    if ((v(e, t), r)) oe(e, t, r, s, n, o);
    return y(e, t, i, a, u, { type: "Identifier", name: s });
  },
  Ht = function (e, t, r, n, o, i) {
    if ((v(e, t), e.token === 8456259))
      return y(e, t, n, o, i, {
        type: "JSXFragment",
        openingFragment: D0(e, t, n, o, i),
        children: hr(e, t),
        closingFragment: q0(e, t, r, e.tokenPos, e.linePos, e.colPos),
      });
    let a = null,
      u = [];
    const s = F0(e, t, r, n, o, i);
    if (!s.selfClosing) {
      (u = hr(e, t)), (a = G0(e, t, r, e.tokenPos, e.linePos, e.colPos));
      const c = at(a.name);
      if (at(s.name) !== c) m(e, 150, c);
    }
    return y(e, t, n, o, i, {
      type: "JSXElement",
      children: u,
      openingElement: s,
      closingElement: a,
    });
  },
  D0 = function (e, t, r, n, o) {
    return ge(e, t), y(e, t, r, n, o, { type: "JSXOpeningFragment" });
  },
  G0 = function (e, t, r, n, o, i) {
    C(e, t, 25);
    const a = xn(e, t, e.tokenPos, e.linePos, e.colPos);
    if (r) C(e, t, 8456259);
    else e.token = ge(e, t);
    return y(e, t, n, o, i, { type: "JSXClosingElement", name: a });
  },
  q0 = function (e, t, r, n, o, i) {
    if ((C(e, t, 25), r)) C(e, t, 8456259);
    else C(e, t, 8456259);
    return y(e, t, n, o, i, { type: "JSXClosingFragment" });
  },
  hr = function (e, t) {
    const r = [];
    while (e.token !== 25)
      (e.index = e.tokenPos = e.startPos),
        (e.column = e.colPos = e.startColumn),
        (e.line = e.linePos = e.startLine),
        ge(e, t),
        r.push(O0(e, t, e.tokenPos, e.linePos, e.colPos));
    return r;
  },
  O0 = function (e, t, r, n, o) {
    if (e.token === 138) return _0(e, t, r, n, o);
    if (e.token === 2162700) return vn(e, t, 0, 0, r, n, o);
    if (e.token === 8456258) return Ht(e, t, 0, r, n, o);
    m(e, 0);
  },
  _0 = function (e, t, r, n, o) {
    ge(e, t);
    const i = { type: "JSXText", value: e.tokenValue };
    if (t & 512) i.raw = e.tokenRaw;
    return y(e, t, r, n, o, i);
  },
  F0 = function (e, t, r, n, o, i) {
    if ((e.token & 143360) !== 143360 && (e.token & 4096) !== 4096) m(e, 0);
    const a = xn(e, t, e.tokenPos, e.linePos, e.colPos),
      u = V0(e, t),
      s = e.token === 8457016;
    if (e.token === 8456259) ge(e, t);
    else if ((C(e, t, 8457016), r)) C(e, t, 8456259);
    else ge(e, t);
    return y(e, t, n, o, i, {
      type: "JSXOpeningElement",
      name: a,
      attributes: u,
      selfClosing: s,
    });
  },
  xn = function (e, t, r, n, o) {
    It(e);
    let i = yt(e, t, r, n, o);
    if (e.token === 21) return bn(e, t, i, r, n, o);
    while (T(e, t, 67108877)) It(e), (i = L0(e, t, i, r, n, o));
    return i;
  },
  L0 = function (e, t, r, n, o, i) {
    const a = yt(e, t, e.tokenPos, e.linePos, e.colPos);
    return y(e, t, n, o, i, {
      type: "JSXMemberExpression",
      object: r,
      property: a,
    });
  },
  V0 = function (e, t) {
    const r = [];
    while (e.token !== 8457016 && e.token !== 8456259 && e.token !== 1048576)
      r.push(X0(e, t, e.tokenPos, e.linePos, e.colPos));
    return r;
  },
  B0 = function (e, t, r, n, o) {
    v(e, t), C(e, t, 14);
    const i = O(e, t, 1, 0, 0, e.tokenPos, e.linePos, e.colPos);
    return (
      C(e, t, 1074790415),
      y(e, t, r, n, o, { type: "JSXSpreadAttribute", argument: i })
    );
  },
  X0 = function (e, t, r, n, o) {
    if (e.token === 2162700) return B0(e, t, r, n, o);
    It(e);
    let i = null,
      a = yt(e, t, r, n, o);
    if (e.token === 21) a = bn(e, t, a, r, n, o);
    if (e.token === 1077936157) {
      const u = Go(e, t),
        { tokenPos: s, linePos: c, colPos: d } = e;
      switch (u) {
        case 134283267:
          i = H(e, t);
          break;
        case 8456258:
          i = Ht(e, t, 1, s, c, d);
          break;
        case 2162700:
          i = vn(e, t, 1, 1, s, c, d);
          break;
        default:
          m(e, 149);
      }
    }
    return y(e, t, r, n, o, { type: "JSXAttribute", value: i, name: a });
  },
  bn = function (e, t, r, n, o, i) {
    C(e, t, 21);
    const a = yt(e, t, e.tokenPos, e.linePos, e.colPos);
    return y(e, t, n, o, i, {
      type: "JSXNamespacedName",
      namespace: r,
      name: a,
    });
  },
  vn = function (e, t, r, n, o, i, a) {
    v(e, t | 32768);
    const { tokenPos: u, linePos: s, colPos: c } = e;
    if (e.token === 14) return K0(e, t, o, i, a);
    let d = null;
    if (e.token === 1074790415) {
      if (n) m(e, 152);
      d = M0(e, t, e.startPos, e.startLine, e.startColumn);
    } else d = O(e, t, 1, 0, 0, u, s, c);
    if (r) C(e, t, 1074790415);
    else ge(e, t);
    return y(e, t, o, i, a, { type: "JSXExpressionContainer", expression: d });
  },
  K0 = function (e, t, r, n, o) {
    C(e, t, 14);
    const i = O(e, t, 1, 0, 0, e.tokenPos, e.linePos, e.colPos);
    return (
      C(e, t, 1074790415),
      y(e, t, r, n, o, { type: "JSXSpreadChild", expression: i })
    );
  },
  M0 = function (e, t, r, n, o) {
    return (
      (e.startPos = e.tokenPos),
      (e.startLine = e.linePos),
      (e.startColumn = e.colPos),
      y(e, t, r, n, o, { type: "JSXEmptyExpression" })
    );
  },
  yt = function (e, t, r, n, o) {
    const { tokenValue: i } = e;
    return v(e, t), y(e, t, r, n, o, { type: "JSXIdentifier", name: i });
  },
  W0 = function (e, t) {
    return Xo(e, t, 0);
  },
  H0 = {
    [0]: "Unexpected token",
    [28]: "Unexpected token: '%0'",
    [1]: "Octal escape sequences are not allowed in strict mode",
    [2]: "Octal escape sequences are not allowed in template strings",
    [3]: "Unexpected token `#`",
    [4]: "Illegal Unicode escape sequence",
    [5]: "Invalid code point %0",
    [6]: "Invalid hexadecimal escape sequence",
    [8]: "Octal literals are not allowed in strict mode",
    [7]: "Decimal integer literals with a leading zero are forbidden in strict mode",
    [9]: "Expected number in radix %0",
    [146]:
      "Invalid left-hand side assignment to a destructible right-hand side",
    [10]: "Non-number found after exponent indicator",
    [11]: "Invalid BigIntLiteral",
    [12]: "No identifiers allowed directly after numeric literal",
    [13]: "Escapes \\8 or \\9 are not syntactically valid escapes",
    [14]: "Unterminated string literal",
    [15]: "Unterminated template literal",
    [16]: "Multiline comment was not closed properly",
    [17]: "The identifier contained dynamic unicode escape that was not closed",
    [18]: "Illegal character '%0'",
    [19]: "Missing hexadecimal digits",
    [20]: "Invalid implicit octal",
    [21]: "Invalid line break in string literal",
    [22]: "Only unicode escapes are legal in identifier names",
    [23]: "Expected '%0'",
    [24]: "Invalid left-hand side in assignment",
    [25]: "Invalid left-hand side in async arrow",
    [26]: 'Calls to super must be in the "constructor" method of a class expression or class declaration that has a superclass',
    [27]: "Member access on super must be in a method",
    [29]: "Await expression not allowed in formal parameter",
    [30]: "Yield expression not allowed in formal parameter",
    [93]: "Unexpected token: 'escaped keyword'",
    [31]: "Unary expressions as the left operand of an exponentiation expression must be disambiguated with parentheses",
    [120]:
      "Async functions can only be declared at the top level or inside a block",
    [32]: "Unterminated regular expression",
    [33]: "Unexpected regular expression flag",
    [34]: "Duplicate regular expression flag '%0'",
    [35]: "%0 functions must have exactly %1 argument%2",
    [36]: "Setter function argument must not be a rest parameter",
    [37]: "%0 declaration must have a name in this context",
    [38]: "Function name may not contain any reserved words or be eval or arguments in strict mode",
    [39]: "The rest operator is missing an argument",
    [40]: "A getter cannot be a generator",
    [41]: "A setter cannot be a generator",
    [42]: "A computed property name must be followed by a colon or paren",
    [131]:
      "Object literal keys that are strings or numbers must be a method or have a colon",
    [44]: "Found `* async x(){}` but this should be `async * x(){}`",
    [43]: "Getters and setters can not be generators",
    [45]: "'%0' can not be generator method",
    [46]: "No line break is allowed after '=>'",
    [47]: "The left-hand side of the arrow can only be destructed through assignment",
    [48]: "The binding declaration is not destructible",
    [49]: "Async arrow can not be followed by new expression",
    [50]: "Classes may not have a static property named 'prototype'",
    [51]: "Class constructor may not be a %0",
    [52]: "Duplicate constructor method in class",
    [53]: "Invalid increment/decrement operand",
    [54]: "Invalid use of `new` keyword on an increment/decrement expression",
    [55]: "`=>` is an invalid assignment target",
    [56]: "Rest element may not have a trailing comma",
    [57]: "Missing initializer in %0 declaration",
    [58]: "'for-%0' loop head declarations can not have an initializer",
    [59]: "Invalid left-hand side in for-%0 loop: Must have a single binding",
    [60]: "Invalid shorthand property initializer",
    [61]: "Property name __proto__ appears more than once in object literal",
    [62]: "Let is disallowed as a lexically bound name",
    [63]: "Invalid use of '%0' inside new expression",
    [64]: "Illegal 'use strict' directive in function with non-simple parameter list",
    [65]: 'Identifier "let" disallowed as left-hand side expression in strict mode',
    [66]: "Illegal continue statement",
    [67]: "Illegal break statement",
    [68]: "Cannot have `let[...]` as a var name in strict mode",
    [69]: "Invalid destructuring assignment target",
    [70]: "Rest parameter may not have a default initializer",
    [71]: "The rest argument must the be last parameter",
    [72]: "Invalid rest argument",
    [74]: "In strict mode code, functions can only be declared at top level or inside a block",
    [75]: "In non-strict mode code, functions can only be declared at top level, inside a block, or as the body of an if statement",
    [76]: "Without web compatibility enabled functions can not be declared at top level, inside a block, or as the body of an if statement",
    [77]: "Class declaration can't appear in single-statement context",
    [78]: "Invalid left-hand side in for-%0",
    [79]: "Invalid assignment in for-%0",
    [80]: "for await (... of ...) is only valid in async functions and async generators",
    [81]: "The first token after the template expression should be a continuation of the template",
    [83]: "`let` declaration not allowed here and `let` cannot be a regular var name in strict mode",
    [82]: "`let \n [` is a restricted production at the start of a statement",
    [84]: "Catch clause requires exactly one parameter, not more (and no trailing comma)",
    [85]: "Catch clause parameter does not support default values",
    [86]: "Missing catch or finally after try",
    [87]: "More than one default clause in switch statement",
    [88]: "Illegal newline after throw",
    [89]: "Strict mode code may not include a with statement",
    [90]: "Illegal return statement",
    [91]: "The left hand side of the for-header binding declaration is not destructible",
    [92]: "new.target only allowed within functions",
    [94]: "'#' not followed by identifier",
    [100]: "Invalid keyword",
    [99]: "Can not use 'let' as a class name",
    [98]: "'A lexical declaration can't define a 'let' binding",
    [97]: "Can not use `let` as variable name in strict mode",
    [95]: "'%0' may not be used as an identifier in this context",
    [96]: "Await is only valid in async functions",
    [101]: "The %0 keyword can only be used with the module goal",
    [102]: "Unicode codepoint must not be greater than 0x10FFFF",
    [103]: "%0 source must be string",
    [104]: "Only a identifier can be used to indicate alias",
    [105]: "Only '*' or '{...}' can be imported after default",
    [106]: "Trailing decorator may be followed by method",
    [107]: "Decorators can't be used with a constructor",
    [109]: "HTML comments are only allowed with web compatibility (Annex B)",
    [110]:
      "The identifier 'let' must not be in expression position in strict mode",
    [111]: "Cannot assign to `eval` and `arguments` in strict mode",
    [112]: "The left-hand side of a for-of loop may not start with 'let'",
    [113]: "Block body arrows can not be immediately invoked without a group",
    [114]: "Block body arrows can not be immediately accessed without a group",
    [115]: "Unexpected strict mode reserved word",
    [116]: "Unexpected eval or arguments in strict mode",
    [117]: "Decorators must not be followed by a semicolon",
    [118]: "Calling delete on expression not allowed in strict mode",
    [119]: "Pattern can not have a tail",
    [121]: "Can not have a `yield` expression on the left side of a ternary",
    [122]: "An arrow function can not have a postfix update operator",
    [123]: "Invalid object literal key character after generator star",
    [124]: "Private fields can not be deleted",
    [126]: "Classes may not have a field called constructor",
    [125]: "Classes may not have a private element named constructor",
    [127]: "A class field initializer may not contain arguments",
    [128]: "Generators can only be declared at the top level or inside a block",
    [129]:
      "Async methods are a restricted production and cannot have a newline following it",
    [130]: "Unexpected character after object literal property name",
    [132]: "Invalid key token",
    [133]: "Label '%0' has already been declared",
    [134]: "continue statement must be nested within an iteration statement",
    [135]: "Undefined label '%0'",
    [136]: "Trailing comma is disallowed inside import(...) arguments",
    [137]: "import() requires exactly one argument",
    [138]: "Cannot use new with import(...)",
    [139]: "... is not allowed in import()",
    [140]: "Expected '=>'",
    [141]: "Duplicate binding '%0'",
    [142]: "Cannot export a duplicate name '%0'",
    [145]: "Duplicate %0 for-binding",
    [143]:
      "Exported binding '%0' needs to refer to a top-level declared variable",
    [144]: "Unexpected private field",
    [148]: "Numeric separators are not allowed at the end of numeric literals",
    [147]: "Only one underscore is allowed as numeric separator",
    [149]: "JSX value should be either an expression or a quoted JSX text",
    [150]: "Expected corresponding JSX closing tag for %0",
    [151]: "Adjacent JSX elements must be wrapped in an enclosing tag",
    [152]: "JSX attributes must only be assigned a non-empty 'expression'",
    [153]: "'%0' has already been declared",
    [154]: "'%0' shadowed a catch clause binding",
    [155]: "Dot property must be an identifier",
    [156]: "Encountered invalid input after spread/rest argument",
    [157]: "Catch without try",
    [158]: "Finally without try",
    [159]: "Expected corresponding closing tag for JSX fragment",
    [160]:
      "Coalescing and logical operators used together in the same expression must be disambiguated with parentheses",
    [161]: "Invalid tagged template on optional chain",
    [162]: "Invalid optional chain from super property",
    [163]: "Invalid optional chain from new expression",
    [164]: 'Cannot use "import.meta" outside a module',
    [165]: "Leading decorators must be attached to a class declaration",
  };
class Le extends SyntaxError {
  constructor(e, t, r, n, ...o) {
    const i =
      "[" + t + ":" + r + "]: " + H0[n].replace(/%(\d+)/g, (a, u) => o[u]);
    super(`${i}`);
    (this.index = e),
      (this.line = t),
      (this.column = r),
      (this.description = i),
      (this.loc = { line: t, column: r });
  }
}
var Ge = ((e, t) => {
    const r = new Uint32Array(104448);
    let n = 0,
      o = 0;
    while (n < 3540) {
      const i = e[n++];
      if (i < 0) o -= i;
      else {
        let a = e[n++];
        if (i & 2) a = t[a];
        if (i & 1) r.fill(a, o, (o += e[n++]));
        else r[o++] = a;
      }
    }
    return r;
  })(
    [
      -1, 2, 24, 2, 25, 2, 5, -1, 0, 77595648, 3, 44, 2, 3, 0, 14, 2, 57, 2, 58,
      3, 0, 3, 0, 3168796671, 0, 4294956992, 2, 1, 2, 0, 2, 59, 3, 0, 4, 0,
      4294966523, 3, 0, 4, 2, 16, 2, 60, 2, 0, 0, 4294836735, 0, 3221225471, 0,
      4294901942, 2, 61, 0, 134152192, 3, 0, 2, 0, 4294951935, 3, 0, 2, 0,
      2683305983, 0, 2684354047, 2, 17, 2, 0, 0, 4294961151, 3, 0, 2, 2, 19, 2,
      0, 0, 608174079, 2, 0, 2, 131, 2, 6, 2, 56, -1, 2, 37, 0, 4294443263, 2,
      1, 3, 0, 3, 0, 4294901711, 2, 39, 0, 4089839103, 0, 2961209759, 0,
      1342439375, 0, 4294543342, 0, 3547201023, 0, 1577204103, 0, 4194240, 0,
      4294688750, 2, 2, 0, 80831, 0, 4261478351, 0, 4294549486, 2, 2, 0,
      2967484831, 0, 196559, 0, 3594373100, 0, 3288319768, 0, 8469959, 2, 194,
      2, 3, 0, 3825204735, 0, 123747807, 0, 65487, 0, 4294828015, 0, 4092591615,
      0, 1080049119, 0, 458703, 2, 3, 2, 0, 0, 2163244511, 0, 4227923919, 0,
      4236247022, 2, 66, 0, 4284449919, 0, 851904, 2, 4, 2, 11, 0, 67076095, -1,
      2, 67, 0, 1073741743, 0, 4093591391, -1, 0, 50331649, 0, 3265266687, 2,
      32, 0, 4294844415, 0, 4278190047, 2, 18, 2, 129, -1, 3, 0, 2, 2, 21, 2, 0,
      2, 9, 2, 0, 2, 14, 2, 15, 3, 0, 10, 2, 69, 2, 0, 2, 70, 2, 71, 2, 72, 2,
      0, 2, 73, 2, 0, 2, 10, 0, 261632, 2, 23, 3, 0, 2, 2, 12, 2, 4, 3, 0, 18,
      2, 74, 2, 5, 3, 0, 2, 2, 75, 0, 2088959, 2, 27, 2, 8, 0, 909311, 3, 0, 2,
      0, 814743551, 2, 41, 0, 67057664, 3, 0, 2, 2, 40, 2, 0, 2, 28, 2, 0, 2,
      29, 2, 7, 0, 268374015, 2, 26, 2, 49, 2, 0, 2, 76, 0, 134153215, -1, 2, 6,
      2, 0, 2, 7, 0, 2684354559, 0, 67044351, 0, 3221160064, 0, 1, -1, 3, 0, 2,
      2, 42, 0, 1046528, 3, 0, 3, 2, 8, 2, 0, 2, 51, 0, 4294960127, 2, 9, 2, 38,
      2, 10, 0, 4294377472, 2, 11, 3, 0, 7, 0, 4227858431, 3, 0, 8, 2, 12, 2, 0,
      2, 78, 2, 9, 2, 0, 2, 79, 2, 80, 2, 81, -1, 2, 124, 0, 1048577, 2, 82, 2,
      13, -1, 2, 13, 0, 131042, 2, 83, 2, 84, 2, 85, 2, 0, 2, 33, -83, 2, 0, 2,
      53, 2, 7, 3, 0, 4, 0, 1046559, 2, 0, 2, 14, 2, 0, 0, 2147516671, 2, 20, 3,
      86, 2, 2, 0, -16, 2, 87, 0, 524222462, 2, 4, 2, 0, 0, 4269801471, 2, 4, 2,
      0, 2, 15, 2, 77, 2, 16, 3, 0, 2, 2, 47, 2, 0, -1, 2, 17, -16, 3, 0, 206,
      -2, 3, 0, 655, 2, 18, 3, 0, 36, 2, 68, -1, 2, 17, 2, 9, 3, 0, 8, 2, 89, 2,
      121, 2, 0, 0, 3220242431, 3, 0, 3, 2, 19, 2, 90, 2, 91, 3, 0, 2, 2, 92, 2,
      0, 2, 93, 2, 94, 2, 0, 0, 4351, 2, 0, 2, 8, 3, 0, 2, 0, 67043391, 0,
      3909091327, 2, 0, 2, 22, 2, 8, 2, 18, 3, 0, 2, 0, 67076097, 2, 7, 2, 0, 2,
      20, 0, 67059711, 0, 4236247039, 3, 0, 2, 0, 939524103, 0, 8191999, 2, 97,
      2, 98, 2, 15, 2, 21, 3, 0, 3, 0, 67057663, 3, 0, 349, 2, 99, 2, 100, 2, 6,
      -264, 3, 0, 11, 2, 22, 3, 0, 2, 2, 31, -1, 0, 3774349439, 2, 101, 2, 102,
      3, 0, 2, 2, 19, 2, 103, 3, 0, 10, 2, 9, 2, 17, 2, 0, 2, 45, 2, 0, 2, 30,
      2, 104, 2, 23, 0, 1638399, 2, 172, 2, 105, 3, 0, 3, 2, 18, 2, 24, 2, 25,
      2, 5, 2, 26, 2, 0, 2, 7, 2, 106, -1, 2, 107, 2, 108, 2, 109, -1, 3, 0, 3,
      2, 11, -2, 2, 0, 2, 27, -3, 2, 150, -4, 2, 18, 2, 0, 2, 35, 0, 1, 2, 0, 2,
      62, 2, 28, 2, 11, 2, 9, 2, 0, 2, 110, -1, 3, 0, 4, 2, 9, 2, 21, 2, 111, 2,
      6, 2, 0, 2, 112, 2, 0, 2, 48, -4, 3, 0, 9, 2, 20, 2, 29, 2, 30, -4, 2,
      113, 2, 114, 2, 29, 2, 20, 2, 7, -2, 2, 115, 2, 29, 2, 31, -2, 2, 0, 2,
      116, -2, 0, 4277137519, 0, 2269118463, -1, 3, 18, 2, -1, 2, 32, 2, 36, 2,
      0, 3, 29, 2, 2, 34, 2, 19, -3, 3, 0, 2, 2, 33, -1, 2, 0, 2, 34, 2, 0, 2,
      34, 2, 0, 2, 46, -10, 2, 0, 0, 203775, -2, 2, 18, 2, 43, 2, 35, -2, 2, 17,
      2, 117, 2, 20, 3, 0, 2, 2, 36, 0, 2147549120, 2, 0, 2, 11, 2, 17, 2, 135,
      2, 0, 2, 37, 2, 52, 0, 5242879, 3, 0, 2, 0, 402644511, -1, 2, 120, 0,
      1090519039, -2, 2, 122, 2, 38, 2, 0, 0, 67045375, 2, 39, 0, 4226678271, 0,
      3766565279, 0, 2039759, -4, 3, 0, 2, 0, 3288270847, 0, 3, 3, 0, 2, 0,
      67043519, -5, 2, 0, 0, 4282384383, 0, 1056964609, -1, 3, 0, 2, 0,
      67043345, -1, 2, 0, 2, 40, 2, 41, -1, 2, 10, 2, 42, -6, 2, 0, 2, 11, -3,
      3, 0, 2, 0, 2147484671, 2, 125, 0, 4190109695, 2, 50, -2, 2, 126, 0,
      4244635647, 0, 27, 2, 0, 2, 7, 2, 43, 2, 0, 2, 63, -1, 2, 0, 2, 40, -8, 2,
      54, 2, 44, 0, 67043329, 2, 127, 2, 45, 0, 8388351, -2, 2, 128, 0,
      3028287487, 2, 46, 2, 130, 0, 33259519, 2, 41, -9, 2, 20, -5, 2, 64, -2,
      3, 0, 28, 2, 31, -3, 3, 0, 3, 2, 47, 3, 0, 6, 2, 48, -85, 3, 0, 33, 2, 47,
      -126, 3, 0, 18, 2, 36, -269, 3, 0, 17, 2, 40, 2, 7, 2, 41, -2, 2, 17, 2,
      49, 2, 0, 2, 20, 2, 50, 2, 132, 2, 23, -21, 3, 0, 2, -4, 3, 0, 2, 0,
      4294936575, 2, 0, 0, 4294934783, -2, 0, 196635, 3, 0, 191, 2, 51, 3, 0,
      38, 2, 29, -1, 2, 33, -279, 3, 0, 8, 2, 7, -1, 2, 133, 2, 52, 3, 0, 11, 2,
      6, -72, 3, 0, 3, 2, 134, 0, 1677656575, -166, 0, 4161266656, 0, 4071, 0,
      15360, -4, 0, 28, -13, 3, 0, 2, 2, 37, 2, 0, 2, 136, 2, 137, 2, 55, 2, 0,
      2, 138, 2, 139, 2, 140, 3, 0, 10, 2, 141, 2, 142, 2, 15, 3, 37, 2, 3, 53,
      2, 3, 54, 2, 0, 4294954999, 2, 0, -16, 2, 0, 2, 88, 2, 0, 0, 2105343, 0,
      4160749584, 0, 65534, -42, 0, 4194303871, 0, 2011, -6, 2, 0, 0,
      1073684479, 0, 17407, -11, 2, 0, 2, 31, -40, 3, 0, 6, 0, 8323103, -1, 3,
      0, 2, 2, 42, -37, 2, 55, 2, 144, 2, 145, 2, 146, 2, 147, 2, 148, -105, 2,
      24, -32, 3, 0, 1334, 2, 9, -1, 3, 0, 129, 2, 27, 3, 0, 6, 2, 9, 3, 0, 180,
      2, 149, 3, 0, 233, 0, 1, -96, 3, 0, 16, 2, 9, -47, 3, 0, 154, 2, 56,
      -22381, 3, 0, 7, 2, 23, -6130, 3, 5, 2, -1, 0, 69207040, 3, 44, 2, 3, 0,
      14, 2, 57, 2, 58, -3, 0, 3168731136, 0, 4294956864, 2, 1, 2, 0, 2, 59, 3,
      0, 4, 0, 4294966275, 3, 0, 4, 2, 16, 2, 60, 2, 0, 2, 33, -1, 2, 17, 2, 61,
      -1, 2, 0, 2, 56, 0, 4294885376, 3, 0, 2, 0, 3145727, 0, 2617294944, 0,
      4294770688, 2, 23, 2, 62, 3, 0, 2, 0, 131135, 2, 95, 0, 70256639, 0,
      71303167, 0, 272, 2, 40, 2, 56, -1, 2, 37, 2, 30, -1, 2, 96, 2, 63, 0,
      4278255616, 0, 4294836227, 0, 4294549473, 0, 600178175, 0, 2952806400, 0,
      268632067, 0, 4294543328, 0, 57540095, 0, 1577058304, 0, 1835008, 0,
      4294688736, 2, 65, 2, 64, 0, 33554435, 2, 123, 2, 65, 2, 151, 0, 131075,
      0, 3594373096, 0, 67094296, 2, 64, -1, 0, 4294828000, 0, 603979263, 2,
      160, 0, 3, 0, 4294828001, 0, 602930687, 2, 183, 0, 393219, 0, 4294828016,
      0, 671088639, 0, 2154840064, 0, 4227858435, 0, 4236247008, 2, 66, 2, 36,
      -1, 2, 4, 0, 917503, 2, 36, -1, 2, 67, 0, 537788335, 0, 4026531935, -1, 0,
      1, -1, 2, 32, 2, 68, 0, 7936, -3, 2, 0, 0, 2147485695, 0, 1010761728, 0,
      4292984930, 0, 16387, 2, 0, 2, 14, 2, 15, 3, 0, 10, 2, 69, 2, 0, 2, 70, 2,
      71, 2, 72, 2, 0, 2, 73, 2, 0, 2, 11, -1, 2, 23, 3, 0, 2, 2, 12, 2, 4, 3,
      0, 18, 2, 74, 2, 5, 3, 0, 2, 2, 75, 0, 253951, 3, 19, 2, 0, 122879, 2, 0,
      2, 8, 0, 276824064, -2, 3, 0, 2, 2, 40, 2, 0, 0, 4294903295, 2, 0, 2, 29,
      2, 7, -1, 2, 17, 2, 49, 2, 0, 2, 76, 2, 41, -1, 2, 20, 2, 0, 2, 27, -2, 0,
      128, -2, 2, 77, 2, 8, 0, 4064, -1, 2, 119, 0, 4227907585, 2, 0, 2, 118, 2,
      0, 2, 48, 2, 173, 2, 9, 2, 38, 2, 10, -1, 0, 74440192, 3, 0, 6, -2, 3, 0,
      8, 2, 12, 2, 0, 2, 78, 2, 9, 2, 0, 2, 79, 2, 80, 2, 81, -3, 2, 82, 2, 13,
      -3, 2, 83, 2, 84, 2, 85, 2, 0, 2, 33, -83, 2, 0, 2, 53, 2, 7, 3, 0, 4, 0,
      817183, 2, 0, 2, 14, 2, 0, 0, 33023, 2, 20, 3, 86, 2, -17, 2, 87, 0,
      524157950, 2, 4, 2, 0, 2, 88, 2, 4, 2, 0, 2, 15, 2, 77, 2, 16, 3, 0, 2, 2,
      47, 2, 0, -1, 2, 17, -16, 3, 0, 206, -2, 3, 0, 655, 2, 18, 3, 0, 36, 2,
      68, -1, 2, 17, 2, 9, 3, 0, 8, 2, 89, 0, 3072, 2, 0, 0, 2147516415, 2, 9,
      3, 0, 2, 2, 23, 2, 90, 2, 91, 3, 0, 2, 2, 92, 2, 0, 2, 93, 2, 94, 0,
      4294965179, 0, 7, 2, 0, 2, 8, 2, 91, 2, 8, -1, 0, 1761345536, 2, 95, 0,
      4294901823, 2, 36, 2, 18, 2, 96, 2, 34, 2, 166, 0, 2080440287, 2, 0, 2,
      33, 2, 143, 0, 3296722943, 2, 0, 0, 1046675455, 0, 939524101, 0, 1837055,
      2, 97, 2, 98, 2, 15, 2, 21, 3, 0, 3, 0, 7, 3, 0, 349, 2, 99, 2, 100, 2, 6,
      -264, 3, 0, 11, 2, 22, 3, 0, 2, 2, 31, -1, 0, 2700607615, 2, 101, 2, 102,
      3, 0, 2, 2, 19, 2, 103, 3, 0, 10, 2, 9, 2, 17, 2, 0, 2, 45, 2, 0, 2, 30,
      2, 104, -3, 2, 105, 3, 0, 3, 2, 18, -1, 3, 5, 2, 2, 26, 2, 0, 2, 7, 2,
      106, -1, 2, 107, 2, 108, 2, 109, -1, 3, 0, 3, 2, 11, -2, 2, 0, 2, 27, -8,
      2, 18, 2, 0, 2, 35, -1, 2, 0, 2, 62, 2, 28, 2, 29, 2, 9, 2, 0, 2, 110, -1,
      3, 0, 4, 2, 9, 2, 17, 2, 111, 2, 6, 2, 0, 2, 112, 2, 0, 2, 48, -4, 3, 0,
      9, 2, 20, 2, 29, 2, 30, -4, 2, 113, 2, 114, 2, 29, 2, 20, 2, 7, -2, 2,
      115, 2, 29, 2, 31, -2, 2, 0, 2, 116, -2, 0, 4277075969, 2, 29, -1, 3, 18,
      2, -1, 2, 32, 2, 117, 2, 0, 3, 29, 2, 2, 34, 2, 19, -3, 3, 0, 2, 2, 33,
      -1, 2, 0, 2, 34, 2, 0, 2, 34, 2, 0, 2, 48, -10, 2, 0, 0, 197631, -2, 2,
      18, 2, 43, 2, 118, -2, 2, 17, 2, 117, 2, 20, 2, 119, 2, 51, -2, 2, 119, 2,
      23, 2, 17, 2, 33, 2, 119, 2, 36, 0, 4294901904, 0, 4718591, 2, 119, 2, 34,
      0, 335544350, -1, 2, 120, 2, 121, -2, 2, 122, 2, 38, 2, 7, -1, 2, 123, 2,
      65, 0, 3758161920, 0, 3, -4, 2, 0, 2, 27, 0, 2147485568, 0, 3, 2, 0, 2,
      23, 0, 176, -5, 2, 0, 2, 47, 2, 186, -1, 2, 0, 2, 23, 2, 197, -1, 2, 0, 0,
      16779263, -2, 2, 11, -7, 2, 0, 2, 121, -3, 3, 0, 2, 2, 124, 2, 125, 0,
      2147549183, 0, 2, -2, 2, 126, 2, 35, 0, 10, 0, 4294965249, 0, 67633151, 0,
      4026597376, 2, 0, 0, 536871935, -1, 2, 0, 2, 40, -8, 2, 54, 2, 47, 0, 1,
      2, 127, 2, 23, -3, 2, 128, 2, 35, 2, 129, 2, 130, 0, 16778239, -10, 2, 34,
      -5, 2, 64, -2, 3, 0, 28, 2, 31, -3, 3, 0, 3, 2, 47, 3, 0, 6, 2, 48, -85,
      3, 0, 33, 2, 47, -126, 3, 0, 18, 2, 36, -269, 3, 0, 17, 2, 40, 2, 7, -3,
      2, 17, 2, 131, 2, 0, 2, 23, 2, 48, 2, 132, 2, 23, -21, 3, 0, 2, -4, 3, 0,
      2, 0, 67583, -1, 2, 103, -2, 0, 11, 3, 0, 191, 2, 51, 3, 0, 38, 2, 29, -1,
      2, 33, -279, 3, 0, 8, 2, 7, -1, 2, 133, 2, 52, 3, 0, 11, 2, 6, -72, 3, 0,
      3, 2, 134, 2, 135, -187, 3, 0, 2, 2, 37, 2, 0, 2, 136, 2, 137, 2, 55, 2,
      0, 2, 138, 2, 139, 2, 140, 3, 0, 10, 2, 141, 2, 142, 2, 15, 3, 37, 2, 3,
      53, 2, 3, 54, 2, 2, 143, -73, 2, 0, 0, 1065361407, 0, 16384, -11, 2, 0, 2,
      121, -40, 3, 0, 6, 2, 117, -1, 3, 0, 2, 0, 2063, -37, 2, 55, 2, 144, 2,
      145, 2, 146, 2, 147, 2, 148, -138, 3, 0, 1334, 2, 9, -1, 3, 0, 129, 2, 27,
      3, 0, 6, 2, 9, 3, 0, 180, 2, 149, 3, 0, 233, 0, 1, -96, 3, 0, 16, 2, 9,
      -47, 3, 0, 154, 2, 56, -28517, 2, 0, 0, 1, -1, 2, 124, 2, 0, 0, 8193, -21,
      2, 193, 0, 10255, 0, 4, -11, 2, 64, 2, 171, -1, 0, 71680, -1, 2, 161, 0,
      4292900864, 0, 805306431, -5, 2, 150, -1, 2, 157, -1, 0, 6144, -2, 2, 127,
      -1, 2, 154, -1, 0, 2147532800, 2, 151, 2, 165, 2, 0, 2, 164, 0, 524032, 0,
      4, -4, 2, 190, 0, 205128192, 0, 1333757536, 0, 2147483696, 0, 423953, 0,
      747766272, 0, 2717763192, 0, 4286578751, 0, 278545, 2, 152, 0, 4294886464,
      0, 33292336, 0, 417809, 2, 152, 0, 1327482464, 0, 4278190128, 0,
      700594195, 0, 1006647527, 0, 4286497336, 0, 4160749631, 2, 153, 0,
      469762560, 0, 4171219488, 0, 8323120, 2, 153, 0, 202375680, 0, 3214918176,
      0, 4294508592, 2, 153, -1, 0, 983584, 0, 48, 0, 58720273, 0, 3489923072,
      0, 10517376, 0, 4293066815, 0, 1, 0, 2013265920, 2, 177, 2, 0, 0, 2089, 0,
      3221225552, 0, 201375904, 2, 0, -2, 0, 256, 0, 122880, 0, 16777216, 2,
      150, 0, 4160757760, 2, 0, -6, 2, 167, -11, 0, 3263218176, -1, 0, 49664, 0,
      2160197632, 0, 8388802, -1, 0, 12713984, -1, 2, 154, 2, 159, 2, 178, -2,
      2, 162, -20, 0, 3758096385, -2, 2, 155, 0, 4292878336, 2, 90, 2, 169, 0,
      4294057984, -2, 2, 163, 2, 156, 2, 175, -2, 2, 155, -1, 2, 182, -1, 2,
      170, 2, 124, 0, 4026593280, 0, 14, 0, 4292919296, -1, 2, 158, 0,
      939588608, -1, 0, 805306368, -1, 2, 124, 0, 1610612736, 2, 156, 2, 157, 2,
      4, 2, 0, -2, 2, 158, 2, 159, -3, 0, 267386880, -1, 2, 160, 0, 7168, -1, 0,
      65024, 2, 154, 2, 161, 2, 179, -7, 2, 168, -8, 2, 162, -1, 0, 1426112704,
      2, 163, -1, 2, 164, 0, 271581216, 0, 2149777408, 2, 23, 2, 161, 2, 124, 0,
      851967, 2, 180, -1, 2, 23, 2, 181, -4, 2, 158, -20, 2, 195, 2, 165, -56,
      0, 3145728, 2, 185, -4, 2, 166, 2, 124, -4, 0, 32505856, -1, 2, 167, -1,
      0, 2147385088, 2, 90, 1, 2155905152, 2, -3, 2, 103, 2, 0, 2, 168, -2, 2,
      169, -6, 2, 170, 0, 4026597375, 0, 1, -1, 0, 1, -1, 2, 171, -3, 2, 117, 2,
      64, -2, 2, 166, -2, 2, 176, 2, 124, -878, 2, 159, -36, 2, 172, -1, 2, 201,
      -10, 2, 188, -5, 2, 174, -6, 0, 4294965251, 2, 27, -1, 2, 173, -1, 2, 174,
      -2, 0, 4227874752, -3, 0, 2146435072, 2, 159, -2, 0, 1006649344, 2, 124,
      -1, 2, 90, 0, 201375744, -3, 0, 134217720, 2, 90, 0, 4286677377, 0, 32896,
      -1, 2, 158, -3, 2, 175, -349, 2, 176, 0, 1920, 2, 177, 3, 0, 264, -11, 2,
      157, -2, 2, 178, 2, 0, 0, 520617856, 0, 2692743168, 0, 36, -3, 0, 524284,
      -11, 2, 23, -1, 2, 187, -1, 2, 184, 0, 3221291007, 2, 178, -1, 2, 202, 0,
      2158720, -3, 2, 159, 0, 1, -4, 2, 124, 0, 3808625411, 0, 3489628288, 2,
      200, 0, 1207959680, 0, 3221274624, 2, 0, -3, 2, 179, 0, 120, 0, 7340032,
      -2, 2, 180, 2, 4, 2, 23, 2, 163, 3, 0, 4, 2, 159, -1, 2, 181, 2, 177, -1,
      0, 8176, 2, 182, 2, 179, 2, 183, -1, 0, 4290773232, 2, 0, -4, 2, 163, 2,
      189, 0, 15728640, 2, 177, -1, 2, 161, -1, 0, 4294934512, 3, 0, 4, -9, 2,
      90, 2, 170, 2, 184, 3, 0, 4, 0, 704, 0, 1849688064, 2, 185, -1, 2, 124, 0,
      4294901887, 2, 0, 0, 130547712, 0, 1879048192, 2, 199, 3, 0, 2, -1, 2,
      186, 2, 187, -1, 0, 17829776, 0, 2025848832, 0, 4261477888, -2, 2, 0, -1,
      0, 4286580608, -1, 0, 29360128, 2, 192, 0, 16252928, 0, 3791388672, 2, 38,
      3, 0, 2, -2, 2, 196, 2, 0, -1, 2, 103, -1, 0, 66584576, -1, 2, 191, 3, 0,
      9, 2, 124, -1, 0, 4294755328, 3, 0, 2, -1, 2, 161, 2, 178, 3, 0, 2, 2, 23,
      2, 188, 2, 90, -2, 0, 245760, 0, 2147418112, -1, 2, 150, 2, 203, 0,
      4227923456, -1, 2, 164, 2, 161, 2, 90, -3, 0, 4292870145, 0, 262144, 2,
      124, 3, 0, 2, 0, 1073758848, 2, 189, -1, 0, 4227921920, 2, 190, 0,
      68289024, 0, 528402016, 0, 4292927536, 3, 0, 4, -2, 0, 268435456, 2, 91,
      -2, 2, 191, 3, 0, 5, -1, 2, 192, 2, 163, 2, 0, -2, 0, 4227923936, 2, 62,
      -1, 2, 155, 2, 95, 2, 0, 2, 154, 2, 158, 3, 0, 6, -1, 2, 177, 3, 0, 3, -2,
      0, 2146959360, 0, 9440640, 0, 104857600, 0, 4227923840, 3, 0, 2, 0, 768,
      2, 193, 2, 77, -2, 2, 161, -2, 2, 119, -1, 2, 155, 3, 0, 8, 0, 512, 0,
      8388608, 2, 194, 2, 172, 2, 187, 0, 4286578944, 3, 0, 2, 0, 1152, 0,
      1266679808, 2, 191, 0, 576, 0, 4261707776, 2, 95, 3, 0, 9, 2, 155, 3, 0,
      5, 2, 16, -1, 0, 2147221504, -28, 2, 178, 3, 0, 3, -3, 0, 4292902912, -6,
      2, 96, 3, 0, 85, -33, 0, 4294934528, 3, 0, 126, -18, 2, 195, 3, 0, 269,
      -17, 2, 155, 2, 124, 2, 198, 3, 0, 2, 2, 23, 0, 4290822144, -2, 0,
      67174336, 0, 520093700, 2, 17, 3, 0, 21, -2, 2, 179, 3, 0, 3, -2, 0,
      30720, -1, 0, 32512, 3, 0, 2, 0, 4294770656, -191, 2, 174, -38, 2, 170, 2,
      0, 2, 196, 3, 0, 279, -8, 2, 124, 2, 0, 0, 4294508543, 0, 65295, -11, 2,
      177, 3, 0, 72, -3, 0, 3758159872, 0, 201391616, 3, 0, 155, -7, 2, 170, -1,
      0, 384, -1, 0, 133693440, -3, 2, 196, -2, 2, 26, 3, 0, 4, 2, 169, -2, 2,
      90, 2, 155, 3, 0, 4, -2, 2, 164, -1, 2, 150, 0, 335552923, 2, 197, -1, 0,
      538974272, 0, 2214592512, 0, 132000, -10, 0, 192, -8, 0, 12288, -21, 0,
      134213632, 0, 4294901761, 3, 0, 42, 0, 100663424, 0, 4294965284, 3, 0, 6,
      -1, 0, 3221282816, 2, 198, 3, 0, 11, -1, 2, 199, 3, 0, 40, -6, 0,
      4286578784, 2, 0, -2, 0, 1006694400, 3, 0, 24, 2, 35, -1, 2, 94, 3, 0, 2,
      0, 1, 2, 163, 3, 0, 6, 2, 197, 0, 4110942569, 0, 1432950139, 0,
      2701658217, 0, 4026532864, 0, 4026532881, 2, 0, 2, 45, 3, 0, 8, -1, 2,
      158, -2, 2, 169, 0, 98304, 0, 65537, 2, 170, -5, 0, 4294950912, 2, 0, 2,
      118, 0, 65528, 2, 177, 0, 4294770176, 2, 26, 3, 0, 4, -30, 2, 174, 0,
      3758153728, -3, 2, 169, -2, 2, 155, 2, 188, 2, 158, -1, 2, 191, -1, 2,
      161, 0, 4294754304, 3, 0, 2, -3, 0, 33554432, -2, 2, 200, -3, 2, 169, 0,
      4175478784, 2, 201, 0, 4286643712, 0, 4286644216, 2, 0, -4, 2, 202, -1, 2,
      165, 0, 4227923967, 3, 0, 32, -1334, 2, 163, 2, 0, -129, 2, 94, -6, 2,
      163, -180, 2, 203, -233, 2, 4, 3, 0, 96, -16, 2, 163, 3, 0, 47, -154, 2,
      165, 3, 0, 22381, -7, 2, 17, 3, 0, 6128,
    ],
    [
      4294967295, 4294967291, 4092460543, 4294828031, 4294967294, 134217726,
      268435455, 2147483647, 1048575, 1073741823, 3892314111, 134217727,
      1061158911, 536805376, 4294910143, 4160749567, 4294901759, 4294901760,
      536870911, 262143, 8388607, 4294902783, 4294918143, 65535, 67043328,
      2281701374, 4294967232, 2097151, 4294903807, 4194303, 255, 67108863,
      4294967039, 511, 524287, 131071, 127, 4292870143, 4294902271, 4294549487,
      33554431, 1023, 67047423, 4294901888, 4286578687, 4294770687, 67043583,
      32767, 15, 2047999, 67043343, 16777215, 4294902000, 4294934527,
      4294966783, 4294967279, 2047, 262083, 20511, 4290772991, 41943039, 493567,
      4294959104, 603979775, 65536, 602799615, 805044223, 4294965206, 8191,
      1031749119, 4294917631, 2134769663, 4286578493, 4282253311, 4294942719,
      33540095, 4294905855, 4294967264, 2868854591, 1608515583, 265232348,
      534519807, 2147614720, 1060109444, 4093640016, 17376, 2139062143, 224,
      4169138175, 4294909951, 4286578688, 4294967292, 4294965759, 2044,
      4292870144, 4294966272, 4294967280, 8289918, 4294934399, 4294901775,
      4294965375, 1602223615, 4294967259, 4294443008, 268369920, 4292804608,
      486341884, 4294963199, 3087007615, 1073692671, 4128527, 4279238655,
      4294902015, 4294966591, 2445279231, 3670015, 3238002687, 31, 63,
      4294967288, 4294705151, 4095, 3221208447, 4294549472, 2147483648,
      4285526655, 4294966527, 4294705152, 4294966143, 64, 4294966719, 16383,
      3774873592, 458752, 536807423, 67043839, 3758096383, 3959414372,
      3755993023, 2080374783, 4294835295, 4294967103, 4160749565, 4087,
      184024726, 2862017156, 1593309078, 268434431, 268434414, 4294901763,
      536870912, 2952790016, 202506752, 139264, 402653184, 4261412864,
      4227922944, 49152, 61440, 3758096384, 117440512, 65280, 3233808384,
      3221225472, 2097152, 4294965248, 32768, 57152, 67108864, 4293918720,
      4290772992, 25165824, 57344, 4227915776, 4278190080, 4227907584, 65520,
      4026531840, 4227858432, 4160749568, 3758129152, 4294836224, 63488,
      1073741824, 4294967040, 4194304, 251658240, 196608, 4294963200, 64512,
      417808, 4227923712, 12582912, 50331648, 65472, 4294967168, 4294966784, 16,
      4294917120, 2080374784, 4096, 65408, 524288, 65532,
    ],
  ),
  D = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    8 | 1024,
    0,
    0,
    8 | 2048,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    8192,
    0,
    1 | 2,
    0,
    0,
    8192,
    0,
    0,
    0,
    256,
    0,
    256 | 32768,
    0,
    0,
    2 | 16 | 128 | 32 | 64,
    2 | 16 | 128 | 32 | 64,
    2 | 16 | 32 | 64,
    2 | 16 | 32 | 64,
    2 | 16 | 32 | 64,
    2 | 16 | 32 | 64,
    2 | 16 | 32 | 64,
    2 | 16 | 32 | 64,
    2 | 16 | 512 | 64,
    2 | 16 | 512 | 64,
    0,
    0,
    16384,
    0,
    0,
    0,
    0,
    1 | 2 | 64,
    1 | 2 | 64,
    1 | 2 | 64,
    1 | 2 | 64,
    1 | 2 | 64,
    1 | 2 | 64,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    1 | 2,
    0,
    1,
    0,
    0,
    1 | 2 | 4096,
    0,
    1 | 2 | 4 | 64,
    1 | 2 | 4 | 64,
    1 | 2 | 4 | 64,
    1 | 2 | 4 | 64,
    1 | 2 | 4 | 64,
    1 | 2 | 4 | 64,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    1 | 2 | 4,
    16384,
    0,
    0,
    0,
    0,
  ],
  U0 = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0,
    0, 0, 0,
  ],
  En = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0,
    0, 0, 0,
  ],
  Cn = ["SingleLine", "MultiLine", "HTMLOpen", "HTMLClose", "HashbangComment"],
  F = [
    "end of source",
    "identifier",
    "number",
    "string",
    "regular expression",
    "false",
    "true",
    "null",
    "template continuation",
    "template tail",
    "=>",
    "(",
    "{",
    ".",
    "...",
    "}",
    ")",
    ";",
    ",",
    "[",
    "]",
    ":",
    "?",
    "'",
    '"',
    "</",
    "/>",
    "++",
    "--",
    "=",
    "<<=",
    ">>=",
    ">>>=",
    "**=",
    "+=",
    "-=",
    "*=",
    "/=",
    "%=",
    "^=",
    "|=",
    "&=",
    "||=",
    "&&=",
    "??=",
    "typeof",
    "delete",
    "void",
    "!",
    "~",
    "+",
    "-",
    "in",
    "instanceof",
    "*",
    "%",
    "/",
    "**",
    "&&",
    "||",
    "===",
    "!==",
    "==",
    "!=",
    "<=",
    ">=",
    "<",
    ">",
    "<<",
    ">>",
    ">>>",
    "&",
    "|",
    "^",
    "var",
    "let",
    "const",
    "break",
    "case",
    "catch",
    "class",
    "continue",
    "debugger",
    "default",
    "do",
    "else",
    "export",
    "extends",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "new",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "try",
    "while",
    "with",
    "implements",
    "interface",
    "package",
    "private",
    "protected",
    "public",
    "static",
    "yield",
    "as",
    "async",
    "await",
    "constructor",
    "get",
    "set",
    "from",
    "of",
    "enum",
    "eval",
    "arguments",
    "escaped keyword",
    "escaped future reserved keyword",
    "reserved if strict",
    "#",
    "BigIntLiteral",
    "??",
    "?.",
    "WhiteSpace",
    "Illegal",
    "LineTerminator",
    "PrivateField",
    "Template",
    "@",
    "target",
    "meta",
    "LineFeed",
    "Escaped",
    "JSXText",
  ],
  In = Object.create(null, {
    this: { value: 86113 },
    function: { value: 86106 },
    if: { value: 20571 },
    return: { value: 20574 },
    var: { value: 86090 },
    else: { value: 20565 },
    for: { value: 20569 },
    new: { value: 86109 },
    in: { value: 8738868 },
    typeof: { value: 16863277 },
    while: { value: 20580 },
    case: { value: 20558 },
    break: { value: 20557 },
    try: { value: 20579 },
    catch: { value: 20559 },
    delete: { value: 16863278 },
    throw: { value: 86114 },
    switch: { value: 86112 },
    continue: { value: 20561 },
    default: { value: 20563 },
    instanceof: { value: 8476725 },
    do: { value: 20564 },
    void: { value: 16863279 },
    finally: { value: 20568 },
    async: { value: 209007 },
    await: { value: 209008 },
    class: { value: 86096 },
    const: { value: 86092 },
    constructor: { value: 12401 },
    debugger: { value: 20562 },
    export: { value: 20566 },
    extends: { value: 20567 },
    false: { value: 86021 },
    from: { value: 12404 },
    get: { value: 12402 },
    implements: { value: 36966 },
    import: { value: 86108 },
    interface: { value: 36967 },
    let: { value: 241739 },
    null: { value: 86023 },
    of: { value: 274549 },
    package: { value: 36968 },
    private: { value: 36969 },
    protected: { value: 36970 },
    public: { value: 36971 },
    set: { value: 12403 },
    static: { value: 36972 },
    super: { value: 86111 },
    true: { value: 86022 },
    with: { value: 20581 },
    yield: { value: 241773 },
    enum: { value: 86134 },
    eval: { value: 537079927 },
    as: { value: 77934 },
    arguments: { value: 537079928 },
    target: { value: 143494 },
    meta: { value: 143495 },
  }),
  An = [
    129, 129, 129, 129, 129, 129, 129, 129, 129, 128, 136, 128, 128, 130, 129,
    129, 129, 129, 129, 129, 129, 129, 129, 129, 129, 129, 129, 129, 129, 129,
    129, 129, 128, 16842800, 134283267, 131, 208897, 8457015, 8455751,
    134283267, 67174411, 16, 8457014, 25233970, 18, 25233971, 67108877, 8457016,
    134283266, 134283266, 134283266, 134283266, 134283266, 134283266, 134283266,
    134283266, 134283266, 134283266, 21, 1074790417, 8456258, 1077936157,
    8456259, 22, 133, 208897, 208897, 208897, 208897, 208897, 208897, 208897,
    208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897,
    208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897, 208897,
    208897, 69271571, 137, 20, 8455497, 208897, 132, 4096, 4096, 4096, 4096,
    4096, 4096, 4096, 208897, 4096, 208897, 208897, 4096, 208897, 4096, 208897,
    4096, 208897, 4096, 4096, 4096, 208897, 4096, 4096, 208897, 4096, 4096,
    2162700, 8455240, 1074790415, 16842801, 129,
  ],
  z0 = {
    AElig: "\xC6",
    AMP: "&",
    Aacute: "\xC1",
    Abreve: "\u0102",
    Acirc: "\xC2",
    Acy: "\u0410",
    Afr: "\uD835\uDD04",
    Agrave: "\xC0",
    Alpha: "\u0391",
    Amacr: "\u0100",
    And: "\u2A53",
    Aogon: "\u0104",
    Aopf: "\uD835\uDD38",
    ApplyFunction: "\u2061",
    Aring: "\xC5",
    Ascr: "\uD835\uDC9C",
    Assign: "\u2254",
    Atilde: "\xC3",
    Auml: "\xC4",
    Backslash: "\u2216",
    Barv: "\u2AE7",
    Barwed: "\u2306",
    Bcy: "\u0411",
    Because: "\u2235",
    Bernoullis: "\u212C",
    Beta: "\u0392",
    Bfr: "\uD835\uDD05",
    Bopf: "\uD835\uDD39",
    Breve: "\u02D8",
    Bscr: "\u212C",
    Bumpeq: "\u224E",
    CHcy: "\u0427",
    COPY: "\xA9",
    Cacute: "\u0106",
    Cap: "\u22D2",
    CapitalDifferentialD: "\u2145",
    Cayleys: "\u212D",
    Ccaron: "\u010C",
    Ccedil: "\xC7",
    Ccirc: "\u0108",
    Cconint: "\u2230",
    Cdot: "\u010A",
    Cedilla: "\xB8",
    CenterDot: "\xB7",
    Cfr: "\u212D",
    Chi: "\u03A7",
    CircleDot: "\u2299",
    CircleMinus: "\u2296",
    CirclePlus: "\u2295",
    CircleTimes: "\u2297",
    ClockwiseContourIntegral: "\u2232",
    CloseCurlyDoubleQuote: "\u201D",
    CloseCurlyQuote: "\u2019",
    Colon: "\u2237",
    Colone: "\u2A74",
    Congruent: "\u2261",
    Conint: "\u222F",
    ContourIntegral: "\u222E",
    Copf: "\u2102",
    Coproduct: "\u2210",
    CounterClockwiseContourIntegral: "\u2233",
    Cross: "\u2A2F",
    Cscr: "\uD835\uDC9E",
    Cup: "\u22D3",
    CupCap: "\u224D",
    DD: "\u2145",
    DDotrahd: "\u2911",
    DJcy: "\u0402",
    DScy: "\u0405",
    DZcy: "\u040F",
    Dagger: "\u2021",
    Darr: "\u21A1",
    Dashv: "\u2AE4",
    Dcaron: "\u010E",
    Dcy: "\u0414",
    Del: "\u2207",
    Delta: "\u0394",
    Dfr: "\uD835\uDD07",
    DiacriticalAcute: "\xB4",
    DiacriticalDot: "\u02D9",
    DiacriticalDoubleAcute: "\u02DD",
    DiacriticalGrave: "`",
    DiacriticalTilde: "\u02DC",
    Diamond: "\u22C4",
    DifferentialD: "\u2146",
    Dopf: "\uD835\uDD3B",
    Dot: "\xA8",
    DotDot: "\u20DC",
    DotEqual: "\u2250",
    DoubleContourIntegral: "\u222F",
    DoubleDot: "\xA8",
    DoubleDownArrow: "\u21D3",
    DoubleLeftArrow: "\u21D0",
    DoubleLeftRightArrow: "\u21D4",
    DoubleLeftTee: "\u2AE4",
    DoubleLongLeftArrow: "\u27F8",
    DoubleLongLeftRightArrow: "\u27FA",
    DoubleLongRightArrow: "\u27F9",
    DoubleRightArrow: "\u21D2",
    DoubleRightTee: "\u22A8",
    DoubleUpArrow: "\u21D1",
    DoubleUpDownArrow: "\u21D5",
    DoubleVerticalBar: "\u2225",
    DownArrow: "\u2193",
    DownArrowBar: "\u2913",
    DownArrowUpArrow: "\u21F5",
    DownBreve: "\u0311",
    DownLeftRightVector: "\u2950",
    DownLeftTeeVector: "\u295E",
    DownLeftVector: "\u21BD",
    DownLeftVectorBar: "\u2956",
    DownRightTeeVector: "\u295F",
    DownRightVector: "\u21C1",
    DownRightVectorBar: "\u2957",
    DownTee: "\u22A4",
    DownTeeArrow: "\u21A7",
    Downarrow: "\u21D3",
    Dscr: "\uD835\uDC9F",
    Dstrok: "\u0110",
    ENG: "\u014A",
    ETH: "\xD0",
    Eacute: "\xC9",
    Ecaron: "\u011A",
    Ecirc: "\xCA",
    Ecy: "\u042D",
    Edot: "\u0116",
    Efr: "\uD835\uDD08",
    Egrave: "\xC8",
    Element: "\u2208",
    Emacr: "\u0112",
    EmptySmallSquare: "\u25FB",
    EmptyVerySmallSquare: "\u25AB",
    Eogon: "\u0118",
    Eopf: "\uD835\uDD3C",
    Epsilon: "\u0395",
    Equal: "\u2A75",
    EqualTilde: "\u2242",
    Equilibrium: "\u21CC",
    Escr: "\u2130",
    Esim: "\u2A73",
    Eta: "\u0397",
    Euml: "\xCB",
    Exists: "\u2203",
    ExponentialE: "\u2147",
    Fcy: "\u0424",
    Ffr: "\uD835\uDD09",
    FilledSmallSquare: "\u25FC",
    FilledVerySmallSquare: "\u25AA",
    Fopf: "\uD835\uDD3D",
    ForAll: "\u2200",
    Fouriertrf: "\u2131",
    Fscr: "\u2131",
    GJcy: "\u0403",
    GT: ">",
    Gamma: "\u0393",
    Gammad: "\u03DC",
    Gbreve: "\u011E",
    Gcedil: "\u0122",
    Gcirc: "\u011C",
    Gcy: "\u0413",
    Gdot: "\u0120",
    Gfr: "\uD835\uDD0A",
    Gg: "\u22D9",
    Gopf: "\uD835\uDD3E",
    GreaterEqual: "\u2265",
    GreaterEqualLess: "\u22DB",
    GreaterFullEqual: "\u2267",
    GreaterGreater: "\u2AA2",
    GreaterLess: "\u2277",
    GreaterSlantEqual: "\u2A7E",
    GreaterTilde: "\u2273",
    Gscr: "\uD835\uDCA2",
    Gt: "\u226B",
    HARDcy: "\u042A",
    Hacek: "\u02C7",
    Hat: "^",
    Hcirc: "\u0124",
    Hfr: "\u210C",
    HilbertSpace: "\u210B",
    Hopf: "\u210D",
    HorizontalLine: "\u2500",
    Hscr: "\u210B",
    Hstrok: "\u0126",
    HumpDownHump: "\u224E",
    HumpEqual: "\u224F",
    IEcy: "\u0415",
    IJlig: "\u0132",
    IOcy: "\u0401",
    Iacute: "\xCD",
    Icirc: "\xCE",
    Icy: "\u0418",
    Idot: "\u0130",
    Ifr: "\u2111",
    Igrave: "\xCC",
    Im: "\u2111",
    Imacr: "\u012A",
    ImaginaryI: "\u2148",
    Implies: "\u21D2",
    Int: "\u222C",
    Integral: "\u222B",
    Intersection: "\u22C2",
    InvisibleComma: "\u2063",
    InvisibleTimes: "\u2062",
    Iogon: "\u012E",
    Iopf: "\uD835\uDD40",
    Iota: "\u0399",
    Iscr: "\u2110",
    Itilde: "\u0128",
    Iukcy: "\u0406",
    Iuml: "\xCF",
    Jcirc: "\u0134",
    Jcy: "\u0419",
    Jfr: "\uD835\uDD0D",
    Jopf: "\uD835\uDD41",
    Jscr: "\uD835\uDCA5",
    Jsercy: "\u0408",
    Jukcy: "\u0404",
    KHcy: "\u0425",
    KJcy: "\u040C",
    Kappa: "\u039A",
    Kcedil: "\u0136",
    Kcy: "\u041A",
    Kfr: "\uD835\uDD0E",
    Kopf: "\uD835\uDD42",
    Kscr: "\uD835\uDCA6",
    LJcy: "\u0409",
    LT: "<",
    Lacute: "\u0139",
    Lambda: "\u039B",
    Lang: "\u27EA",
    Laplacetrf: "\u2112",
    Larr: "\u219E",
    Lcaron: "\u013D",
    Lcedil: "\u013B",
    Lcy: "\u041B",
    LeftAngleBracket: "\u27E8",
    LeftArrow: "\u2190",
    LeftArrowBar: "\u21E4",
    LeftArrowRightArrow: "\u21C6",
    LeftCeiling: "\u2308",
    LeftDoubleBracket: "\u27E6",
    LeftDownTeeVector: "\u2961",
    LeftDownVector: "\u21C3",
    LeftDownVectorBar: "\u2959",
    LeftFloor: "\u230A",
    LeftRightArrow: "\u2194",
    LeftRightVector: "\u294E",
    LeftTee: "\u22A3",
    LeftTeeArrow: "\u21A4",
    LeftTeeVector: "\u295A",
    LeftTriangle: "\u22B2",
    LeftTriangleBar: "\u29CF",
    LeftTriangleEqual: "\u22B4",
    LeftUpDownVector: "\u2951",
    LeftUpTeeVector: "\u2960",
    LeftUpVector: "\u21BF",
    LeftUpVectorBar: "\u2958",
    LeftVector: "\u21BC",
    LeftVectorBar: "\u2952",
    Leftarrow: "\u21D0",
    Leftrightarrow: "\u21D4",
    LessEqualGreater: "\u22DA",
    LessFullEqual: "\u2266",
    LessGreater: "\u2276",
    LessLess: "\u2AA1",
    LessSlantEqual: "\u2A7D",
    LessTilde: "\u2272",
    Lfr: "\uD835\uDD0F",
    Ll: "\u22D8",
    Lleftarrow: "\u21DA",
    Lmidot: "\u013F",
    LongLeftArrow: "\u27F5",
    LongLeftRightArrow: "\u27F7",
    LongRightArrow: "\u27F6",
    Longleftarrow: "\u27F8",
    Longleftrightarrow: "\u27FA",
    Longrightarrow: "\u27F9",
    Lopf: "\uD835\uDD43",
    LowerLeftArrow: "\u2199",
    LowerRightArrow: "\u2198",
    Lscr: "\u2112",
    Lsh: "\u21B0",
    Lstrok: "\u0141",
    Lt: "\u226A",
    Map: "\u2905",
    Mcy: "\u041C",
    MediumSpace: "\u205F",
    Mellintrf: "\u2133",
    Mfr: "\uD835\uDD10",
    MinusPlus: "\u2213",
    Mopf: "\uD835\uDD44",
    Mscr: "\u2133",
    Mu: "\u039C",
    NJcy: "\u040A",
    Nacute: "\u0143",
    Ncaron: "\u0147",
    Ncedil: "\u0145",
    Ncy: "\u041D",
    NegativeMediumSpace: "\u200B",
    NegativeThickSpace: "\u200B",
    NegativeThinSpace: "\u200B",
    NegativeVeryThinSpace: "\u200B",
    NestedGreaterGreater: "\u226B",
    NestedLessLess: "\u226A",
    NewLine: `
`,
    Nfr: "\uD835\uDD11",
    NoBreak: "\u2060",
    NonBreakingSpace: "\xA0",
    Nopf: "\u2115",
    Not: "\u2AEC",
    NotCongruent: "\u2262",
    NotCupCap: "\u226D",
    NotDoubleVerticalBar: "\u2226",
    NotElement: "\u2209",
    NotEqual: "\u2260",
    NotEqualTilde: "\u2242\u0338",
    NotExists: "\u2204",
    NotGreater: "\u226F",
    NotGreaterEqual: "\u2271",
    NotGreaterFullEqual: "\u2267\u0338",
    NotGreaterGreater: "\u226B\u0338",
    NotGreaterLess: "\u2279",
    NotGreaterSlantEqual: "\u2A7E\u0338",
    NotGreaterTilde: "\u2275",
    NotHumpDownHump: "\u224E\u0338",
    NotHumpEqual: "\u224F\u0338",
    NotLeftTriangle: "\u22EA",
    NotLeftTriangleBar: "\u29CF\u0338",
    NotLeftTriangleEqual: "\u22EC",
    NotLess: "\u226E",
    NotLessEqual: "\u2270",
    NotLessGreater: "\u2278",
    NotLessLess: "\u226A\u0338",
    NotLessSlantEqual: "\u2A7D\u0338",
    NotLessTilde: "\u2274",
    NotNestedGreaterGreater: "\u2AA2\u0338",
    NotNestedLessLess: "\u2AA1\u0338",
    NotPrecedes: "\u2280",
    NotPrecedesEqual: "\u2AAF\u0338",
    NotPrecedesSlantEqual: "\u22E0",
    NotReverseElement: "\u220C",
    NotRightTriangle: "\u22EB",
    NotRightTriangleBar: "\u29D0\u0338",
    NotRightTriangleEqual: "\u22ED",
    NotSquareSubset: "\u228F\u0338",
    NotSquareSubsetEqual: "\u22E2",
    NotSquareSuperset: "\u2290\u0338",
    NotSquareSupersetEqual: "\u22E3",
    NotSubset: "\u2282\u20D2",
    NotSubsetEqual: "\u2288",
    NotSucceeds: "\u2281",
    NotSucceedsEqual: "\u2AB0\u0338",
    NotSucceedsSlantEqual: "\u22E1",
    NotSucceedsTilde: "\u227F\u0338",
    NotSuperset: "\u2283\u20D2",
    NotSupersetEqual: "\u2289",
    NotTilde: "\u2241",
    NotTildeEqual: "\u2244",
    NotTildeFullEqual: "\u2247",
    NotTildeTilde: "\u2249",
    NotVerticalBar: "\u2224",
    Nscr: "\uD835\uDCA9",
    Ntilde: "\xD1",
    Nu: "\u039D",
    OElig: "\u0152",
    Oacute: "\xD3",
    Ocirc: "\xD4",
    Ocy: "\u041E",
    Odblac: "\u0150",
    Ofr: "\uD835\uDD12",
    Ograve: "\xD2",
    Omacr: "\u014C",
    Omega: "\u03A9",
    Omicron: "\u039F",
    Oopf: "\uD835\uDD46",
    OpenCurlyDoubleQuote: "\u201C",
    OpenCurlyQuote: "\u2018",
    Or: "\u2A54",
    Oscr: "\uD835\uDCAA",
    Oslash: "\xD8",
    Otilde: "\xD5",
    Otimes: "\u2A37",
    Ouml: "\xD6",
    OverBar: "\u203E",
    OverBrace: "\u23DE",
    OverBracket: "\u23B4",
    OverParenthesis: "\u23DC",
    PartialD: "\u2202",
    Pcy: "\u041F",
    Pfr: "\uD835\uDD13",
    Phi: "\u03A6",
    Pi: "\u03A0",
    PlusMinus: "\xB1",
    Poincareplane: "\u210C",
    Popf: "\u2119",
    Pr: "\u2ABB",
    Precedes: "\u227A",
    PrecedesEqual: "\u2AAF",
    PrecedesSlantEqual: "\u227C",
    PrecedesTilde: "\u227E",
    Prime: "\u2033",
    Product: "\u220F",
    Proportion: "\u2237",
    Proportional: "\u221D",
    Pscr: "\uD835\uDCAB",
    Psi: "\u03A8",
    QUOT: '"',
    Qfr: "\uD835\uDD14",
    Qopf: "\u211A",
    Qscr: "\uD835\uDCAC",
    RBarr: "\u2910",
    REG: "\xAE",
    Racute: "\u0154",
    Rang: "\u27EB",
    Rarr: "\u21A0",
    Rarrtl: "\u2916",
    Rcaron: "\u0158",
    Rcedil: "\u0156",
    Rcy: "\u0420",
    Re: "\u211C",
    ReverseElement: "\u220B",
    ReverseEquilibrium: "\u21CB",
    ReverseUpEquilibrium: "\u296F",
    Rfr: "\u211C",
    Rho: "\u03A1",
    RightAngleBracket: "\u27E9",
    RightArrow: "\u2192",
    RightArrowBar: "\u21E5",
    RightArrowLeftArrow: "\u21C4",
    RightCeiling: "\u2309",
    RightDoubleBracket: "\u27E7",
    RightDownTeeVector: "\u295D",
    RightDownVector: "\u21C2",
    RightDownVectorBar: "\u2955",
    RightFloor: "\u230B",
    RightTee: "\u22A2",
    RightTeeArrow: "\u21A6",
    RightTeeVector: "\u295B",
    RightTriangle: "\u22B3",
    RightTriangleBar: "\u29D0",
    RightTriangleEqual: "\u22B5",
    RightUpDownVector: "\u294F",
    RightUpTeeVector: "\u295C",
    RightUpVector: "\u21BE",
    RightUpVectorBar: "\u2954",
    RightVector: "\u21C0",
    RightVectorBar: "\u2953",
    Rightarrow: "\u21D2",
    Ropf: "\u211D",
    RoundImplies: "\u2970",
    Rrightarrow: "\u21DB",
    Rscr: "\u211B",
    Rsh: "\u21B1",
    RuleDelayed: "\u29F4",
    SHCHcy: "\u0429",
    SHcy: "\u0428",
    SOFTcy: "\u042C",
    Sacute: "\u015A",
    Sc: "\u2ABC",
    Scaron: "\u0160",
    Scedil: "\u015E",
    Scirc: "\u015C",
    Scy: "\u0421",
    Sfr: "\uD835\uDD16",
    ShortDownArrow: "\u2193",
    ShortLeftArrow: "\u2190",
    ShortRightArrow: "\u2192",
    ShortUpArrow: "\u2191",
    Sigma: "\u03A3",
    SmallCircle: "\u2218",
    Sopf: "\uD835\uDD4A",
    Sqrt: "\u221A",
    Square: "\u25A1",
    SquareIntersection: "\u2293",
    SquareSubset: "\u228F",
    SquareSubsetEqual: "\u2291",
    SquareSuperset: "\u2290",
    SquareSupersetEqual: "\u2292",
    SquareUnion: "\u2294",
    Sscr: "\uD835\uDCAE",
    Star: "\u22C6",
    Sub: "\u22D0",
    Subset: "\u22D0",
    SubsetEqual: "\u2286",
    Succeeds: "\u227B",
    SucceedsEqual: "\u2AB0",
    SucceedsSlantEqual: "\u227D",
    SucceedsTilde: "\u227F",
    SuchThat: "\u220B",
    Sum: "\u2211",
    Sup: "\u22D1",
    Superset: "\u2283",
    SupersetEqual: "\u2287",
    Supset: "\u22D1",
    THORN: "\xDE",
    TRADE: "\u2122",
    TSHcy: "\u040B",
    TScy: "\u0426",
    Tab: "\t",
    Tau: "\u03A4",
    Tcaron: "\u0164",
    Tcedil: "\u0162",
    Tcy: "\u0422",
    Tfr: "\uD835\uDD17",
    Therefore: "\u2234",
    Theta: "\u0398",
    ThickSpace: "\u205F\u200A",
    ThinSpace: "\u2009",
    Tilde: "\u223C",
    TildeEqual: "\u2243",
    TildeFullEqual: "\u2245",
    TildeTilde: "\u2248",
    Topf: "\uD835\uDD4B",
    TripleDot: "\u20DB",
    Tscr: "\uD835\uDCAF",
    Tstrok: "\u0166",
    Uacute: "\xDA",
    Uarr: "\u219F",
    Uarrocir: "\u2949",
    Ubrcy: "\u040E",
    Ubreve: "\u016C",
    Ucirc: "\xDB",
    Ucy: "\u0423",
    Udblac: "\u0170",
    Ufr: "\uD835\uDD18",
    Ugrave: "\xD9",
    Umacr: "\u016A",
    UnderBar: "_",
    UnderBrace: "\u23DF",
    UnderBracket: "\u23B5",
    UnderParenthesis: "\u23DD",
    Union: "\u22C3",
    UnionPlus: "\u228E",
    Uogon: "\u0172",
    Uopf: "\uD835\uDD4C",
    UpArrow: "\u2191",
    UpArrowBar: "\u2912",
    UpArrowDownArrow: "\u21C5",
    UpDownArrow: "\u2195",
    UpEquilibrium: "\u296E",
    UpTee: "\u22A5",
    UpTeeArrow: "\u21A5",
    Uparrow: "\u21D1",
    Updownarrow: "\u21D5",
    UpperLeftArrow: "\u2196",
    UpperRightArrow: "\u2197",
    Upsi: "\u03D2",
    Upsilon: "\u03A5",
    Uring: "\u016E",
    Uscr: "\uD835\uDCB0",
    Utilde: "\u0168",
    Uuml: "\xDC",
    VDash: "\u22AB",
    Vbar: "\u2AEB",
    Vcy: "\u0412",
    Vdash: "\u22A9",
    Vdashl: "\u2AE6",
    Vee: "\u22C1",
    Verbar: "\u2016",
    Vert: "\u2016",
    VerticalBar: "\u2223",
    VerticalLine: "|",
    VerticalSeparator: "\u2758",
    VerticalTilde: "\u2240",
    VeryThinSpace: "\u200A",
    Vfr: "\uD835\uDD19",
    Vopf: "\uD835\uDD4D",
    Vscr: "\uD835\uDCB1",
    Vvdash: "\u22AA",
    Wcirc: "\u0174",
    Wedge: "\u22C0",
    Wfr: "\uD835\uDD1A",
    Wopf: "\uD835\uDD4E",
    Wscr: "\uD835\uDCB2",
    Xfr: "\uD835\uDD1B",
    Xi: "\u039E",
    Xopf: "\uD835\uDD4F",
    Xscr: "\uD835\uDCB3",
    YAcy: "\u042F",
    YIcy: "\u0407",
    YUcy: "\u042E",
    Yacute: "\xDD",
    Ycirc: "\u0176",
    Ycy: "\u042B",
    Yfr: "\uD835\uDD1C",
    Yopf: "\uD835\uDD50",
    Yscr: "\uD835\uDCB4",
    Yuml: "\u0178",
    ZHcy: "\u0416",
    Zacute: "\u0179",
    Zcaron: "\u017D",
    Zcy: "\u0417",
    Zdot: "\u017B",
    ZeroWidthSpace: "\u200B",
    Zeta: "\u0396",
    Zfr: "\u2128",
    Zopf: "\u2124",
    Zscr: "\uD835\uDCB5",
    aacute: "\xE1",
    abreve: "\u0103",
    ac: "\u223E",
    acE: "\u223E\u0333",
    acd: "\u223F",
    acirc: "\xE2",
    acute: "\xB4",
    acy: "\u0430",
    aelig: "\xE6",
    af: "\u2061",
    afr: "\uD835\uDD1E",
    agrave: "\xE0",
    alefsym: "\u2135",
    aleph: "\u2135",
    alpha: "\u03B1",
    amacr: "\u0101",
    amalg: "\u2A3F",
    amp: "&",
    and: "\u2227",
    andand: "\u2A55",
    andd: "\u2A5C",
    andslope: "\u2A58",
    andv: "\u2A5A",
    ang: "\u2220",
    ange: "\u29A4",
    angle: "\u2220",
    angmsd: "\u2221",
    angmsdaa: "\u29A8",
    angmsdab: "\u29A9",
    angmsdac: "\u29AA",
    angmsdad: "\u29AB",
    angmsdae: "\u29AC",
    angmsdaf: "\u29AD",
    angmsdag: "\u29AE",
    angmsdah: "\u29AF",
    angrt: "\u221F",
    angrtvb: "\u22BE",
    angrtvbd: "\u299D",
    angsph: "\u2222",
    angst: "\xC5",
    angzarr: "\u237C",
    aogon: "\u0105",
    aopf: "\uD835\uDD52",
    ap: "\u2248",
    apE: "\u2A70",
    apacir: "\u2A6F",
    ape: "\u224A",
    apid: "\u224B",
    apos: "'",
    approx: "\u2248",
    approxeq: "\u224A",
    aring: "\xE5",
    ascr: "\uD835\uDCB6",
    ast: "*",
    asymp: "\u2248",
    asympeq: "\u224D",
    atilde: "\xE3",
    auml: "\xE4",
    awconint: "\u2233",
    awint: "\u2A11",
    bNot: "\u2AED",
    backcong: "\u224C",
    backepsilon: "\u03F6",
    backprime: "\u2035",
    backsim: "\u223D",
    backsimeq: "\u22CD",
    barvee: "\u22BD",
    barwed: "\u2305",
    barwedge: "\u2305",
    bbrk: "\u23B5",
    bbrktbrk: "\u23B6",
    bcong: "\u224C",
    bcy: "\u0431",
    bdquo: "\u201E",
    becaus: "\u2235",
    because: "\u2235",
    bemptyv: "\u29B0",
    bepsi: "\u03F6",
    bernou: "\u212C",
    beta: "\u03B2",
    beth: "\u2136",
    between: "\u226C",
    bfr: "\uD835\uDD1F",
    bigcap: "\u22C2",
    bigcirc: "\u25EF",
    bigcup: "\u22C3",
    bigodot: "\u2A00",
    bigoplus: "\u2A01",
    bigotimes: "\u2A02",
    bigsqcup: "\u2A06",
    bigstar: "\u2605",
    bigtriangledown: "\u25BD",
    bigtriangleup: "\u25B3",
    biguplus: "\u2A04",
    bigvee: "\u22C1",
    bigwedge: "\u22C0",
    bkarow: "\u290D",
    blacklozenge: "\u29EB",
    blacksquare: "\u25AA",
    blacktriangle: "\u25B4",
    blacktriangledown: "\u25BE",
    blacktriangleleft: "\u25C2",
    blacktriangleright: "\u25B8",
    blank: "\u2423",
    blk12: "\u2592",
    blk14: "\u2591",
    blk34: "\u2593",
    block: "\u2588",
    bne: "=\u20E5",
    bnequiv: "\u2261\u20E5",
    bnot: "\u2310",
    bopf: "\uD835\uDD53",
    bot: "\u22A5",
    bottom: "\u22A5",
    bowtie: "\u22C8",
    boxDL: "\u2557",
    boxDR: "\u2554",
    boxDl: "\u2556",
    boxDr: "\u2553",
    boxH: "\u2550",
    boxHD: "\u2566",
    boxHU: "\u2569",
    boxHd: "\u2564",
    boxHu: "\u2567",
    boxUL: "\u255D",
    boxUR: "\u255A",
    boxUl: "\u255C",
    boxUr: "\u2559",
    boxV: "\u2551",
    boxVH: "\u256C",
    boxVL: "\u2563",
    boxVR: "\u2560",
    boxVh: "\u256B",
    boxVl: "\u2562",
    boxVr: "\u255F",
    boxbox: "\u29C9",
    boxdL: "\u2555",
    boxdR: "\u2552",
    boxdl: "\u2510",
    boxdr: "\u250C",
    boxh: "\u2500",
    boxhD: "\u2565",
    boxhU: "\u2568",
    boxhd: "\u252C",
    boxhu: "\u2534",
    boxminus: "\u229F",
    boxplus: "\u229E",
    boxtimes: "\u22A0",
    boxuL: "\u255B",
    boxuR: "\u2558",
    boxul: "\u2518",
    boxur: "\u2514",
    boxv: "\u2502",
    boxvH: "\u256A",
    boxvL: "\u2561",
    boxvR: "\u255E",
    boxvh: "\u253C",
    boxvl: "\u2524",
    boxvr: "\u251C",
    bprime: "\u2035",
    breve: "\u02D8",
    brvbar: "\xA6",
    bscr: "\uD835\uDCB7",
    bsemi: "\u204F",
    bsim: "\u223D",
    bsime: "\u22CD",
    bsol: "\\",
    bsolb: "\u29C5",
    bsolhsub: "\u27C8",
    bull: "\u2022",
    bullet: "\u2022",
    bump: "\u224E",
    bumpE: "\u2AAE",
    bumpe: "\u224F",
    bumpeq: "\u224F",
    cacute: "\u0107",
    cap: "\u2229",
    capand: "\u2A44",
    capbrcup: "\u2A49",
    capcap: "\u2A4B",
    capcup: "\u2A47",
    capdot: "\u2A40",
    caps: "\u2229\uFE00",
    caret: "\u2041",
    caron: "\u02C7",
    ccaps: "\u2A4D",
    ccaron: "\u010D",
    ccedil: "\xE7",
    ccirc: "\u0109",
    ccups: "\u2A4C",
    ccupssm: "\u2A50",
    cdot: "\u010B",
    cedil: "\xB8",
    cemptyv: "\u29B2",
    cent: "\xA2",
    centerdot: "\xB7",
    cfr: "\uD835\uDD20",
    chcy: "\u0447",
    check: "\u2713",
    checkmark: "\u2713",
    chi: "\u03C7",
    cir: "\u25CB",
    cirE: "\u29C3",
    circ: "\u02C6",
    circeq: "\u2257",
    circlearrowleft: "\u21BA",
    circlearrowright: "\u21BB",
    circledR: "\xAE",
    circledS: "\u24C8",
    circledast: "\u229B",
    circledcirc: "\u229A",
    circleddash: "\u229D",
    cire: "\u2257",
    cirfnint: "\u2A10",
    cirmid: "\u2AEF",
    cirscir: "\u29C2",
    clubs: "\u2663",
    clubsuit: "\u2663",
    colon: ":",
    colone: "\u2254",
    coloneq: "\u2254",
    comma: ",",
    commat: "@",
    comp: "\u2201",
    compfn: "\u2218",
    complement: "\u2201",
    complexes: "\u2102",
    cong: "\u2245",
    congdot: "\u2A6D",
    conint: "\u222E",
    copf: "\uD835\uDD54",
    coprod: "\u2210",
    copy: "\xA9",
    copysr: "\u2117",
    crarr: "\u21B5",
    cross: "\u2717",
    cscr: "\uD835\uDCB8",
    csub: "\u2ACF",
    csube: "\u2AD1",
    csup: "\u2AD0",
    csupe: "\u2AD2",
    ctdot: "\u22EF",
    cudarrl: "\u2938",
    cudarrr: "\u2935",
    cuepr: "\u22DE",
    cuesc: "\u22DF",
    cularr: "\u21B6",
    cularrp: "\u293D",
    cup: "\u222A",
    cupbrcap: "\u2A48",
    cupcap: "\u2A46",
    cupcup: "\u2A4A",
    cupdot: "\u228D",
    cupor: "\u2A45",
    cups: "\u222A\uFE00",
    curarr: "\u21B7",
    curarrm: "\u293C",
    curlyeqprec: "\u22DE",
    curlyeqsucc: "\u22DF",
    curlyvee: "\u22CE",
    curlywedge: "\u22CF",
    curren: "\xA4",
    curvearrowleft: "\u21B6",
    curvearrowright: "\u21B7",
    cuvee: "\u22CE",
    cuwed: "\u22CF",
    cwconint: "\u2232",
    cwint: "\u2231",
    cylcty: "\u232D",
    dArr: "\u21D3",
    dHar: "\u2965",
    dagger: "\u2020",
    daleth: "\u2138",
    darr: "\u2193",
    dash: "\u2010",
    dashv: "\u22A3",
    dbkarow: "\u290F",
    dblac: "\u02DD",
    dcaron: "\u010F",
    dcy: "\u0434",
    dd: "\u2146",
    ddagger: "\u2021",
    ddarr: "\u21CA",
    ddotseq: "\u2A77",
    deg: "\xB0",
    delta: "\u03B4",
    demptyv: "\u29B1",
    dfisht: "\u297F",
    dfr: "\uD835\uDD21",
    dharl: "\u21C3",
    dharr: "\u21C2",
    diam: "\u22C4",
    diamond: "\u22C4",
    diamondsuit: "\u2666",
    diams: "\u2666",
    die: "\xA8",
    digamma: "\u03DD",
    disin: "\u22F2",
    div: "\xF7",
    divide: "\xF7",
    divideontimes: "\u22C7",
    divonx: "\u22C7",
    djcy: "\u0452",
    dlcorn: "\u231E",
    dlcrop: "\u230D",
    dollar: "$",
    dopf: "\uD835\uDD55",
    dot: "\u02D9",
    doteq: "\u2250",
    doteqdot: "\u2251",
    dotminus: "\u2238",
    dotplus: "\u2214",
    dotsquare: "\u22A1",
    doublebarwedge: "\u2306",
    downarrow: "\u2193",
    downdownarrows: "\u21CA",
    downharpoonleft: "\u21C3",
    downharpoonright: "\u21C2",
    drbkarow: "\u2910",
    drcorn: "\u231F",
    drcrop: "\u230C",
    dscr: "\uD835\uDCB9",
    dscy: "\u0455",
    dsol: "\u29F6",
    dstrok: "\u0111",
    dtdot: "\u22F1",
    dtri: "\u25BF",
    dtrif: "\u25BE",
    duarr: "\u21F5",
    duhar: "\u296F",
    dwangle: "\u29A6",
    dzcy: "\u045F",
    dzigrarr: "\u27FF",
    eDDot: "\u2A77",
    eDot: "\u2251",
    eacute: "\xE9",
    easter: "\u2A6E",
    ecaron: "\u011B",
    ecir: "\u2256",
    ecirc: "\xEA",
    ecolon: "\u2255",
    ecy: "\u044D",
    edot: "\u0117",
    ee: "\u2147",
    efDot: "\u2252",
    efr: "\uD835\uDD22",
    eg: "\u2A9A",
    egrave: "\xE8",
    egs: "\u2A96",
    egsdot: "\u2A98",
    el: "\u2A99",
    elinters: "\u23E7",
    ell: "\u2113",
    els: "\u2A95",
    elsdot: "\u2A97",
    emacr: "\u0113",
    empty: "\u2205",
    emptyset: "\u2205",
    emptyv: "\u2205",
    emsp13: "\u2004",
    emsp14: "\u2005",
    emsp: "\u2003",
    eng: "\u014B",
    ensp: "\u2002",
    eogon: "\u0119",
    eopf: "\uD835\uDD56",
    epar: "\u22D5",
    eparsl: "\u29E3",
    eplus: "\u2A71",
    epsi: "\u03B5",
    epsilon: "\u03B5",
    epsiv: "\u03F5",
    eqcirc: "\u2256",
    eqcolon: "\u2255",
    eqsim: "\u2242",
    eqslantgtr: "\u2A96",
    eqslantless: "\u2A95",
    equals: "=",
    equest: "\u225F",
    equiv: "\u2261",
    equivDD: "\u2A78",
    eqvparsl: "\u29E5",
    erDot: "\u2253",
    erarr: "\u2971",
    escr: "\u212F",
    esdot: "\u2250",
    esim: "\u2242",
    eta: "\u03B7",
    eth: "\xF0",
    euml: "\xEB",
    euro: "\u20AC",
    excl: "!",
    exist: "\u2203",
    expectation: "\u2130",
    exponentiale: "\u2147",
    fallingdotseq: "\u2252",
    fcy: "\u0444",
    female: "\u2640",
    ffilig: "\uFB03",
    fflig: "\uFB00",
    ffllig: "\uFB04",
    ffr: "\uD835\uDD23",
    filig: "\uFB01",
    fjlig: "fj",
    flat: "\u266D",
    fllig: "\uFB02",
    fltns: "\u25B1",
    fnof: "\u0192",
    fopf: "\uD835\uDD57",
    forall: "\u2200",
    fork: "\u22D4",
    forkv: "\u2AD9",
    fpartint: "\u2A0D",
    frac12: "\xBD",
    frac13: "\u2153",
    frac14: "\xBC",
    frac15: "\u2155",
    frac16: "\u2159",
    frac18: "\u215B",
    frac23: "\u2154",
    frac25: "\u2156",
    frac34: "\xBE",
    frac35: "\u2157",
    frac38: "\u215C",
    frac45: "\u2158",
    frac56: "\u215A",
    frac58: "\u215D",
    frac78: "\u215E",
    frasl: "\u2044",
    frown: "\u2322",
    fscr: "\uD835\uDCBB",
    gE: "\u2267",
    gEl: "\u2A8C",
    gacute: "\u01F5",
    gamma: "\u03B3",
    gammad: "\u03DD",
    gap: "\u2A86",
    gbreve: "\u011F",
    gcirc: "\u011D",
    gcy: "\u0433",
    gdot: "\u0121",
    ge: "\u2265",
    gel: "\u22DB",
    geq: "\u2265",
    geqq: "\u2267",
    geqslant: "\u2A7E",
    ges: "\u2A7E",
    gescc: "\u2AA9",
    gesdot: "\u2A80",
    gesdoto: "\u2A82",
    gesdotol: "\u2A84",
    gesl: "\u22DB\uFE00",
    gesles: "\u2A94",
    gfr: "\uD835\uDD24",
    gg: "\u226B",
    ggg: "\u22D9",
    gimel: "\u2137",
    gjcy: "\u0453",
    gl: "\u2277",
    glE: "\u2A92",
    gla: "\u2AA5",
    glj: "\u2AA4",
    gnE: "\u2269",
    gnap: "\u2A8A",
    gnapprox: "\u2A8A",
    gne: "\u2A88",
    gneq: "\u2A88",
    gneqq: "\u2269",
    gnsim: "\u22E7",
    gopf: "\uD835\uDD58",
    grave: "`",
    gscr: "\u210A",
    gsim: "\u2273",
    gsime: "\u2A8E",
    gsiml: "\u2A90",
    gt: ">",
    gtcc: "\u2AA7",
    gtcir: "\u2A7A",
    gtdot: "\u22D7",
    gtlPar: "\u2995",
    gtquest: "\u2A7C",
    gtrapprox: "\u2A86",
    gtrarr: "\u2978",
    gtrdot: "\u22D7",
    gtreqless: "\u22DB",
    gtreqqless: "\u2A8C",
    gtrless: "\u2277",
    gtrsim: "\u2273",
    gvertneqq: "\u2269\uFE00",
    gvnE: "\u2269\uFE00",
    hArr: "\u21D4",
    hairsp: "\u200A",
    half: "\xBD",
    hamilt: "\u210B",
    hardcy: "\u044A",
    harr: "\u2194",
    harrcir: "\u2948",
    harrw: "\u21AD",
    hbar: "\u210F",
    hcirc: "\u0125",
    hearts: "\u2665",
    heartsuit: "\u2665",
    hellip: "\u2026",
    hercon: "\u22B9",
    hfr: "\uD835\uDD25",
    hksearow: "\u2925",
    hkswarow: "\u2926",
    hoarr: "\u21FF",
    homtht: "\u223B",
    hookleftarrow: "\u21A9",
    hookrightarrow: "\u21AA",
    hopf: "\uD835\uDD59",
    horbar: "\u2015",
    hscr: "\uD835\uDCBD",
    hslash: "\u210F",
    hstrok: "\u0127",
    hybull: "\u2043",
    hyphen: "\u2010",
    iacute: "\xED",
    ic: "\u2063",
    icirc: "\xEE",
    icy: "\u0438",
    iecy: "\u0435",
    iexcl: "\xA1",
    iff: "\u21D4",
    ifr: "\uD835\uDD26",
    igrave: "\xEC",
    ii: "\u2148",
    iiiint: "\u2A0C",
    iiint: "\u222D",
    iinfin: "\u29DC",
    iiota: "\u2129",
    ijlig: "\u0133",
    imacr: "\u012B",
    image: "\u2111",
    imagline: "\u2110",
    imagpart: "\u2111",
    imath: "\u0131",
    imof: "\u22B7",
    imped: "\u01B5",
    in: "\u2208",
    incare: "\u2105",
    infin: "\u221E",
    infintie: "\u29DD",
    inodot: "\u0131",
    int: "\u222B",
    intcal: "\u22BA",
    integers: "\u2124",
    intercal: "\u22BA",
    intlarhk: "\u2A17",
    intprod: "\u2A3C",
    iocy: "\u0451",
    iogon: "\u012F",
    iopf: "\uD835\uDD5A",
    iota: "\u03B9",
    iprod: "\u2A3C",
    iquest: "\xBF",
    iscr: "\uD835\uDCBE",
    isin: "\u2208",
    isinE: "\u22F9",
    isindot: "\u22F5",
    isins: "\u22F4",
    isinsv: "\u22F3",
    isinv: "\u2208",
    it: "\u2062",
    itilde: "\u0129",
    iukcy: "\u0456",
    iuml: "\xEF",
    jcirc: "\u0135",
    jcy: "\u0439",
    jfr: "\uD835\uDD27",
    jmath: "\u0237",
    jopf: "\uD835\uDD5B",
    jscr: "\uD835\uDCBF",
    jsercy: "\u0458",
    jukcy: "\u0454",
    kappa: "\u03BA",
    kappav: "\u03F0",
    kcedil: "\u0137",
    kcy: "\u043A",
    kfr: "\uD835\uDD28",
    kgreen: "\u0138",
    khcy: "\u0445",
    kjcy: "\u045C",
    kopf: "\uD835\uDD5C",
    kscr: "\uD835\uDCC0",
    lAarr: "\u21DA",
    lArr: "\u21D0",
    lAtail: "\u291B",
    lBarr: "\u290E",
    lE: "\u2266",
    lEg: "\u2A8B",
    lHar: "\u2962",
    lacute: "\u013A",
    laemptyv: "\u29B4",
    lagran: "\u2112",
    lambda: "\u03BB",
    lang: "\u27E8",
    langd: "\u2991",
    langle: "\u27E8",
    lap: "\u2A85",
    laquo: "\xAB",
    larr: "\u2190",
    larrb: "\u21E4",
    larrbfs: "\u291F",
    larrfs: "\u291D",
    larrhk: "\u21A9",
    larrlp: "\u21AB",
    larrpl: "\u2939",
    larrsim: "\u2973",
    larrtl: "\u21A2",
    lat: "\u2AAB",
    latail: "\u2919",
    late: "\u2AAD",
    lates: "\u2AAD\uFE00",
    lbarr: "\u290C",
    lbbrk: "\u2772",
    lbrace: "{",
    lbrack: "[",
    lbrke: "\u298B",
    lbrksld: "\u298F",
    lbrkslu: "\u298D",
    lcaron: "\u013E",
    lcedil: "\u013C",
    lceil: "\u2308",
    lcub: "{",
    lcy: "\u043B",
    ldca: "\u2936",
    ldquo: "\u201C",
    ldquor: "\u201E",
    ldrdhar: "\u2967",
    ldrushar: "\u294B",
    ldsh: "\u21B2",
    le: "\u2264",
    leftarrow: "\u2190",
    leftarrowtail: "\u21A2",
    leftharpoondown: "\u21BD",
    leftharpoonup: "\u21BC",
    leftleftarrows: "\u21C7",
    leftrightarrow: "\u2194",
    leftrightarrows: "\u21C6",
    leftrightharpoons: "\u21CB",
    leftrightsquigarrow: "\u21AD",
    leftthreetimes: "\u22CB",
    leg: "\u22DA",
    leq: "\u2264",
    leqq: "\u2266",
    leqslant: "\u2A7D",
    les: "\u2A7D",
    lescc: "\u2AA8",
    lesdot: "\u2A7F",
    lesdoto: "\u2A81",
    lesdotor: "\u2A83",
    lesg: "\u22DA\uFE00",
    lesges: "\u2A93",
    lessapprox: "\u2A85",
    lessdot: "\u22D6",
    lesseqgtr: "\u22DA",
    lesseqqgtr: "\u2A8B",
    lessgtr: "\u2276",
    lesssim: "\u2272",
    lfisht: "\u297C",
    lfloor: "\u230A",
    lfr: "\uD835\uDD29",
    lg: "\u2276",
    lgE: "\u2A91",
    lhard: "\u21BD",
    lharu: "\u21BC",
    lharul: "\u296A",
    lhblk: "\u2584",
    ljcy: "\u0459",
    ll: "\u226A",
    llarr: "\u21C7",
    llcorner: "\u231E",
    llhard: "\u296B",
    lltri: "\u25FA",
    lmidot: "\u0140",
    lmoust: "\u23B0",
    lmoustache: "\u23B0",
    lnE: "\u2268",
    lnap: "\u2A89",
    lnapprox: "\u2A89",
    lne: "\u2A87",
    lneq: "\u2A87",
    lneqq: "\u2268",
    lnsim: "\u22E6",
    loang: "\u27EC",
    loarr: "\u21FD",
    lobrk: "\u27E6",
    longleftarrow: "\u27F5",
    longleftrightarrow: "\u27F7",
    longmapsto: "\u27FC",
    longrightarrow: "\u27F6",
    looparrowleft: "\u21AB",
    looparrowright: "\u21AC",
    lopar: "\u2985",
    lopf: "\uD835\uDD5D",
    loplus: "\u2A2D",
    lotimes: "\u2A34",
    lowast: "\u2217",
    lowbar: "_",
    loz: "\u25CA",
    lozenge: "\u25CA",
    lozf: "\u29EB",
    lpar: "(",
    lparlt: "\u2993",
    lrarr: "\u21C6",
    lrcorner: "\u231F",
    lrhar: "\u21CB",
    lrhard: "\u296D",
    lrm: "\u200E",
    lrtri: "\u22BF",
    lsaquo: "\u2039",
    lscr: "\uD835\uDCC1",
    lsh: "\u21B0",
    lsim: "\u2272",
    lsime: "\u2A8D",
    lsimg: "\u2A8F",
    lsqb: "[",
    lsquo: "\u2018",
    lsquor: "\u201A",
    lstrok: "\u0142",
    lt: "<",
    ltcc: "\u2AA6",
    ltcir: "\u2A79",
    ltdot: "\u22D6",
    lthree: "\u22CB",
    ltimes: "\u22C9",
    ltlarr: "\u2976",
    ltquest: "\u2A7B",
    ltrPar: "\u2996",
    ltri: "\u25C3",
    ltrie: "\u22B4",
    ltrif: "\u25C2",
    lurdshar: "\u294A",
    luruhar: "\u2966",
    lvertneqq: "\u2268\uFE00",
    lvnE: "\u2268\uFE00",
    mDDot: "\u223A",
    macr: "\xAF",
    male: "\u2642",
    malt: "\u2720",
    maltese: "\u2720",
    map: "\u21A6",
    mapsto: "\u21A6",
    mapstodown: "\u21A7",
    mapstoleft: "\u21A4",
    mapstoup: "\u21A5",
    marker: "\u25AE",
    mcomma: "\u2A29",
    mcy: "\u043C",
    mdash: "\u2014",
    measuredangle: "\u2221",
    mfr: "\uD835\uDD2A",
    mho: "\u2127",
    micro: "\xB5",
    mid: "\u2223",
    midast: "*",
    midcir: "\u2AF0",
    middot: "\xB7",
    minus: "\u2212",
    minusb: "\u229F",
    minusd: "\u2238",
    minusdu: "\u2A2A",
    mlcp: "\u2ADB",
    mldr: "\u2026",
    mnplus: "\u2213",
    models: "\u22A7",
    mopf: "\uD835\uDD5E",
    mp: "\u2213",
    mscr: "\uD835\uDCC2",
    mstpos: "\u223E",
    mu: "\u03BC",
    multimap: "\u22B8",
    mumap: "\u22B8",
    nGg: "\u22D9\u0338",
    nGt: "\u226B\u20D2",
    nGtv: "\u226B\u0338",
    nLeftarrow: "\u21CD",
    nLeftrightarrow: "\u21CE",
    nLl: "\u22D8\u0338",
    nLt: "\u226A\u20D2",
    nLtv: "\u226A\u0338",
    nRightarrow: "\u21CF",
    nVDash: "\u22AF",
    nVdash: "\u22AE",
    nabla: "\u2207",
    nacute: "\u0144",
    nang: "\u2220\u20D2",
    nap: "\u2249",
    napE: "\u2A70\u0338",
    napid: "\u224B\u0338",
    napos: "\u0149",
    napprox: "\u2249",
    natur: "\u266E",
    natural: "\u266E",
    naturals: "\u2115",
    nbsp: "\xA0",
    nbump: "\u224E\u0338",
    nbumpe: "\u224F\u0338",
    ncap: "\u2A43",
    ncaron: "\u0148",
    ncedil: "\u0146",
    ncong: "\u2247",
    ncongdot: "\u2A6D\u0338",
    ncup: "\u2A42",
    ncy: "\u043D",
    ndash: "\u2013",
    ne: "\u2260",
    neArr: "\u21D7",
    nearhk: "\u2924",
    nearr: "\u2197",
    nearrow: "\u2197",
    nedot: "\u2250\u0338",
    nequiv: "\u2262",
    nesear: "\u2928",
    nesim: "\u2242\u0338",
    nexist: "\u2204",
    nexists: "\u2204",
    nfr: "\uD835\uDD2B",
    ngE: "\u2267\u0338",
    nge: "\u2271",
    ngeq: "\u2271",
    ngeqq: "\u2267\u0338",
    ngeqslant: "\u2A7E\u0338",
    nges: "\u2A7E\u0338",
    ngsim: "\u2275",
    ngt: "\u226F",
    ngtr: "\u226F",
    nhArr: "\u21CE",
    nharr: "\u21AE",
    nhpar: "\u2AF2",
    ni: "\u220B",
    nis: "\u22FC",
    nisd: "\u22FA",
    niv: "\u220B",
    njcy: "\u045A",
    nlArr: "\u21CD",
    nlE: "\u2266\u0338",
    nlarr: "\u219A",
    nldr: "\u2025",
    nle: "\u2270",
    nleftarrow: "\u219A",
    nleftrightarrow: "\u21AE",
    nleq: "\u2270",
    nleqq: "\u2266\u0338",
    nleqslant: "\u2A7D\u0338",
    nles: "\u2A7D\u0338",
    nless: "\u226E",
    nlsim: "\u2274",
    nlt: "\u226E",
    nltri: "\u22EA",
    nltrie: "\u22EC",
    nmid: "\u2224",
    nopf: "\uD835\uDD5F",
    not: "\xAC",
    notin: "\u2209",
    notinE: "\u22F9\u0338",
    notindot: "\u22F5\u0338",
    notinva: "\u2209",
    notinvb: "\u22F7",
    notinvc: "\u22F6",
    notni: "\u220C",
    notniva: "\u220C",
    notnivb: "\u22FE",
    notnivc: "\u22FD",
    npar: "\u2226",
    nparallel: "\u2226",
    nparsl: "\u2AFD\u20E5",
    npart: "\u2202\u0338",
    npolint: "\u2A14",
    npr: "\u2280",
    nprcue: "\u22E0",
    npre: "\u2AAF\u0338",
    nprec: "\u2280",
    npreceq: "\u2AAF\u0338",
    nrArr: "\u21CF",
    nrarr: "\u219B",
    nrarrc: "\u2933\u0338",
    nrarrw: "\u219D\u0338",
    nrightarrow: "\u219B",
    nrtri: "\u22EB",
    nrtrie: "\u22ED",
    nsc: "\u2281",
    nsccue: "\u22E1",
    nsce: "\u2AB0\u0338",
    nscr: "\uD835\uDCC3",
    nshortmid: "\u2224",
    nshortparallel: "\u2226",
    nsim: "\u2241",
    nsime: "\u2244",
    nsimeq: "\u2244",
    nsmid: "\u2224",
    nspar: "\u2226",
    nsqsube: "\u22E2",
    nsqsupe: "\u22E3",
    nsub: "\u2284",
    nsubE: "\u2AC5\u0338",
    nsube: "\u2288",
    nsubset: "\u2282\u20D2",
    nsubseteq: "\u2288",
    nsubseteqq: "\u2AC5\u0338",
    nsucc: "\u2281",
    nsucceq: "\u2AB0\u0338",
    nsup: "\u2285",
    nsupE: "\u2AC6\u0338",
    nsupe: "\u2289",
    nsupset: "\u2283\u20D2",
    nsupseteq: "\u2289",
    nsupseteqq: "\u2AC6\u0338",
    ntgl: "\u2279",
    ntilde: "\xF1",
    ntlg: "\u2278",
    ntriangleleft: "\u22EA",
    ntrianglelefteq: "\u22EC",
    ntriangleright: "\u22EB",
    ntrianglerighteq: "\u22ED",
    nu: "\u03BD",
    num: "#",
    numero: "\u2116",
    numsp: "\u2007",
    nvDash: "\u22AD",
    nvHarr: "\u2904",
    nvap: "\u224D\u20D2",
    nvdash: "\u22AC",
    nvge: "\u2265\u20D2",
    nvgt: ">\u20D2",
    nvinfin: "\u29DE",
    nvlArr: "\u2902",
    nvle: "\u2264\u20D2",
    nvlt: "<\u20D2",
    nvltrie: "\u22B4\u20D2",
    nvrArr: "\u2903",
    nvrtrie: "\u22B5\u20D2",
    nvsim: "\u223C\u20D2",
    nwArr: "\u21D6",
    nwarhk: "\u2923",
    nwarr: "\u2196",
    nwarrow: "\u2196",
    nwnear: "\u2927",
    oS: "\u24C8",
    oacute: "\xF3",
    oast: "\u229B",
    ocir: "\u229A",
    ocirc: "\xF4",
    ocy: "\u043E",
    odash: "\u229D",
    odblac: "\u0151",
    odiv: "\u2A38",
    odot: "\u2299",
    odsold: "\u29BC",
    oelig: "\u0153",
    ofcir: "\u29BF",
    ofr: "\uD835\uDD2C",
    ogon: "\u02DB",
    ograve: "\xF2",
    ogt: "\u29C1",
    ohbar: "\u29B5",
    ohm: "\u03A9",
    oint: "\u222E",
    olarr: "\u21BA",
    olcir: "\u29BE",
    olcross: "\u29BB",
    oline: "\u203E",
    olt: "\u29C0",
    omacr: "\u014D",
    omega: "\u03C9",
    omicron: "\u03BF",
    omid: "\u29B6",
    ominus: "\u2296",
    oopf: "\uD835\uDD60",
    opar: "\u29B7",
    operp: "\u29B9",
    oplus: "\u2295",
    or: "\u2228",
    orarr: "\u21BB",
    ord: "\u2A5D",
    order: "\u2134",
    orderof: "\u2134",
    ordf: "\xAA",
    ordm: "\xBA",
    origof: "\u22B6",
    oror: "\u2A56",
    orslope: "\u2A57",
    orv: "\u2A5B",
    oscr: "\u2134",
    oslash: "\xF8",
    osol: "\u2298",
    otilde: "\xF5",
    otimes: "\u2297",
    otimesas: "\u2A36",
    ouml: "\xF6",
    ovbar: "\u233D",
    par: "\u2225",
    para: "\xB6",
    parallel: "\u2225",
    parsim: "\u2AF3",
    parsl: "\u2AFD",
    part: "\u2202",
    pcy: "\u043F",
    percnt: "%",
    period: ".",
    permil: "\u2030",
    perp: "\u22A5",
    pertenk: "\u2031",
    pfr: "\uD835\uDD2D",
    phi: "\u03C6",
    phiv: "\u03D5",
    phmmat: "\u2133",
    phone: "\u260E",
    pi: "\u03C0",
    pitchfork: "\u22D4",
    piv: "\u03D6",
    planck: "\u210F",
    planckh: "\u210E",
    plankv: "\u210F",
    plus: "+",
    plusacir: "\u2A23",
    plusb: "\u229E",
    pluscir: "\u2A22",
    plusdo: "\u2214",
    plusdu: "\u2A25",
    pluse: "\u2A72",
    plusmn: "\xB1",
    plussim: "\u2A26",
    plustwo: "\u2A27",
    pm: "\xB1",
    pointint: "\u2A15",
    popf: "\uD835\uDD61",
    pound: "\xA3",
    pr: "\u227A",
    prE: "\u2AB3",
    prap: "\u2AB7",
    prcue: "\u227C",
    pre: "\u2AAF",
    prec: "\u227A",
    precapprox: "\u2AB7",
    preccurlyeq: "\u227C",
    preceq: "\u2AAF",
    precnapprox: "\u2AB9",
    precneqq: "\u2AB5",
    precnsim: "\u22E8",
    precsim: "\u227E",
    prime: "\u2032",
    primes: "\u2119",
    prnE: "\u2AB5",
    prnap: "\u2AB9",
    prnsim: "\u22E8",
    prod: "\u220F",
    profalar: "\u232E",
    profline: "\u2312",
    profsurf: "\u2313",
    prop: "\u221D",
    propto: "\u221D",
    prsim: "\u227E",
    prurel: "\u22B0",
    pscr: "\uD835\uDCC5",
    psi: "\u03C8",
    puncsp: "\u2008",
    qfr: "\uD835\uDD2E",
    qint: "\u2A0C",
    qopf: "\uD835\uDD62",
    qprime: "\u2057",
    qscr: "\uD835\uDCC6",
    quaternions: "\u210D",
    quatint: "\u2A16",
    quest: "?",
    questeq: "\u225F",
    quot: '"',
    rAarr: "\u21DB",
    rArr: "\u21D2",
    rAtail: "\u291C",
    rBarr: "\u290F",
    rHar: "\u2964",
    race: "\u223D\u0331",
    racute: "\u0155",
    radic: "\u221A",
    raemptyv: "\u29B3",
    rang: "\u27E9",
    rangd: "\u2992",
    range: "\u29A5",
    rangle: "\u27E9",
    raquo: "\xBB",
    rarr: "\u2192",
    rarrap: "\u2975",
    rarrb: "\u21E5",
    rarrbfs: "\u2920",
    rarrc: "\u2933",
    rarrfs: "\u291E",
    rarrhk: "\u21AA",
    rarrlp: "\u21AC",
    rarrpl: "\u2945",
    rarrsim: "\u2974",
    rarrtl: "\u21A3",
    rarrw: "\u219D",
    ratail: "\u291A",
    ratio: "\u2236",
    rationals: "\u211A",
    rbarr: "\u290D",
    rbbrk: "\u2773",
    rbrace: "}",
    rbrack: "]",
    rbrke: "\u298C",
    rbrksld: "\u298E",
    rbrkslu: "\u2990",
    rcaron: "\u0159",
    rcedil: "\u0157",
    rceil: "\u2309",
    rcub: "}",
    rcy: "\u0440",
    rdca: "\u2937",
    rdldhar: "\u2969",
    rdquo: "\u201D",
    rdquor: "\u201D",
    rdsh: "\u21B3",
    real: "\u211C",
    realine: "\u211B",
    realpart: "\u211C",
    reals: "\u211D",
    rect: "\u25AD",
    reg: "\xAE",
    rfisht: "\u297D",
    rfloor: "\u230B",
    rfr: "\uD835\uDD2F",
    rhard: "\u21C1",
    rharu: "\u21C0",
    rharul: "\u296C",
    rho: "\u03C1",
    rhov: "\u03F1",
    rightarrow: "\u2192",
    rightarrowtail: "\u21A3",
    rightharpoondown: "\u21C1",
    rightharpoonup: "\u21C0",
    rightleftarrows: "\u21C4",
    rightleftharpoons: "\u21CC",
    rightrightarrows: "\u21C9",
    rightsquigarrow: "\u219D",
    rightthreetimes: "\u22CC",
    ring: "\u02DA",
    risingdotseq: "\u2253",
    rlarr: "\u21C4",
    rlhar: "\u21CC",
    rlm: "\u200F",
    rmoust: "\u23B1",
    rmoustache: "\u23B1",
    rnmid: "\u2AEE",
    roang: "\u27ED",
    roarr: "\u21FE",
    robrk: "\u27E7",
    ropar: "\u2986",
    ropf: "\uD835\uDD63",
    roplus: "\u2A2E",
    rotimes: "\u2A35",
    rpar: ")",
    rpargt: "\u2994",
    rppolint: "\u2A12",
    rrarr: "\u21C9",
    rsaquo: "\u203A",
    rscr: "\uD835\uDCC7",
    rsh: "\u21B1",
    rsqb: "]",
    rsquo: "\u2019",
    rsquor: "\u2019",
    rthree: "\u22CC",
    rtimes: "\u22CA",
    rtri: "\u25B9",
    rtrie: "\u22B5",
    rtrif: "\u25B8",
    rtriltri: "\u29CE",
    ruluhar: "\u2968",
    rx: "\u211E",
    sacute: "\u015B",
    sbquo: "\u201A",
    sc: "\u227B",
    scE: "\u2AB4",
    scap: "\u2AB8",
    scaron: "\u0161",
    sccue: "\u227D",
    sce: "\u2AB0",
    scedil: "\u015F",
    scirc: "\u015D",
    scnE: "\u2AB6",
    scnap: "\u2ABA",
    scnsim: "\u22E9",
    scpolint: "\u2A13",
    scsim: "\u227F",
    scy: "\u0441",
    sdot: "\u22C5",
    sdotb: "\u22A1",
    sdote: "\u2A66",
    seArr: "\u21D8",
    searhk: "\u2925",
    searr: "\u2198",
    searrow: "\u2198",
    sect: "\xA7",
    semi: ";",
    seswar: "\u2929",
    setminus: "\u2216",
    setmn: "\u2216",
    sext: "\u2736",
    sfr: "\uD835\uDD30",
    sfrown: "\u2322",
    sharp: "\u266F",
    shchcy: "\u0449",
    shcy: "\u0448",
    shortmid: "\u2223",
    shortparallel: "\u2225",
    shy: "\xAD",
    sigma: "\u03C3",
    sigmaf: "\u03C2",
    sigmav: "\u03C2",
    sim: "\u223C",
    simdot: "\u2A6A",
    sime: "\u2243",
    simeq: "\u2243",
    simg: "\u2A9E",
    simgE: "\u2AA0",
    siml: "\u2A9D",
    simlE: "\u2A9F",
    simne: "\u2246",
    simplus: "\u2A24",
    simrarr: "\u2972",
    slarr: "\u2190",
    smallsetminus: "\u2216",
    smashp: "\u2A33",
    smeparsl: "\u29E4",
    smid: "\u2223",
    smile: "\u2323",
    smt: "\u2AAA",
    smte: "\u2AAC",
    smtes: "\u2AAC\uFE00",
    softcy: "\u044C",
    sol: "/",
    solb: "\u29C4",
    solbar: "\u233F",
    sopf: "\uD835\uDD64",
    spades: "\u2660",
    spadesuit: "\u2660",
    spar: "\u2225",
    sqcap: "\u2293",
    sqcaps: "\u2293\uFE00",
    sqcup: "\u2294",
    sqcups: "\u2294\uFE00",
    sqsub: "\u228F",
    sqsube: "\u2291",
    sqsubset: "\u228F",
    sqsubseteq: "\u2291",
    sqsup: "\u2290",
    sqsupe: "\u2292",
    sqsupset: "\u2290",
    sqsupseteq: "\u2292",
    squ: "\u25A1",
    square: "\u25A1",
    squarf: "\u25AA",
    squf: "\u25AA",
    srarr: "\u2192",
    sscr: "\uD835\uDCC8",
    ssetmn: "\u2216",
    ssmile: "\u2323",
    sstarf: "\u22C6",
    star: "\u2606",
    starf: "\u2605",
    straightepsilon: "\u03F5",
    straightphi: "\u03D5",
    strns: "\xAF",
    sub: "\u2282",
    subE: "\u2AC5",
    subdot: "\u2ABD",
    sube: "\u2286",
    subedot: "\u2AC3",
    submult: "\u2AC1",
    subnE: "\u2ACB",
    subne: "\u228A",
    subplus: "\u2ABF",
    subrarr: "\u2979",
    subset: "\u2282",
    subseteq: "\u2286",
    subseteqq: "\u2AC5",
    subsetneq: "\u228A",
    subsetneqq: "\u2ACB",
    subsim: "\u2AC7",
    subsub: "\u2AD5",
    subsup: "\u2AD3",
    succ: "\u227B",
    succapprox: "\u2AB8",
    succcurlyeq: "\u227D",
    succeq: "\u2AB0",
    succnapprox: "\u2ABA",
    succneqq: "\u2AB6",
    succnsim: "\u22E9",
    succsim: "\u227F",
    sum: "\u2211",
    sung: "\u266A",
    sup1: "\xB9",
    sup2: "\xB2",
    sup3: "\xB3",
    sup: "\u2283",
    supE: "\u2AC6",
    supdot: "\u2ABE",
    supdsub: "\u2AD8",
    supe: "\u2287",
    supedot: "\u2AC4",
    suphsol: "\u27C9",
    suphsub: "\u2AD7",
    suplarr: "\u297B",
    supmult: "\u2AC2",
    supnE: "\u2ACC",
    supne: "\u228B",
    supplus: "\u2AC0",
    supset: "\u2283",
    supseteq: "\u2287",
    supseteqq: "\u2AC6",
    supsetneq: "\u228B",
    supsetneqq: "\u2ACC",
    supsim: "\u2AC8",
    supsub: "\u2AD4",
    supsup: "\u2AD6",
    swArr: "\u21D9",
    swarhk: "\u2926",
    swarr: "\u2199",
    swarrow: "\u2199",
    swnwar: "\u292A",
    szlig: "\xDF",
    target: "\u2316",
    tau: "\u03C4",
    tbrk: "\u23B4",
    tcaron: "\u0165",
    tcedil: "\u0163",
    tcy: "\u0442",
    tdot: "\u20DB",
    telrec: "\u2315",
    tfr: "\uD835\uDD31",
    there4: "\u2234",
    therefore: "\u2234",
    theta: "\u03B8",
    thetasym: "\u03D1",
    thetav: "\u03D1",
    thickapprox: "\u2248",
    thicksim: "\u223C",
    thinsp: "\u2009",
    thkap: "\u2248",
    thksim: "\u223C",
    thorn: "\xFE",
    tilde: "\u02DC",
    times: "\xD7",
    timesb: "\u22A0",
    timesbar: "\u2A31",
    timesd: "\u2A30",
    tint: "\u222D",
    toea: "\u2928",
    top: "\u22A4",
    topbot: "\u2336",
    topcir: "\u2AF1",
    topf: "\uD835\uDD65",
    topfork: "\u2ADA",
    tosa: "\u2929",
    tprime: "\u2034",
    trade: "\u2122",
    triangle: "\u25B5",
    triangledown: "\u25BF",
    triangleleft: "\u25C3",
    trianglelefteq: "\u22B4",
    triangleq: "\u225C",
    triangleright: "\u25B9",
    trianglerighteq: "\u22B5",
    tridot: "\u25EC",
    trie: "\u225C",
    triminus: "\u2A3A",
    triplus: "\u2A39",
    trisb: "\u29CD",
    tritime: "\u2A3B",
    trpezium: "\u23E2",
    tscr: "\uD835\uDCC9",
    tscy: "\u0446",
    tshcy: "\u045B",
    tstrok: "\u0167",
    twixt: "\u226C",
    twoheadleftarrow: "\u219E",
    twoheadrightarrow: "\u21A0",
    uArr: "\u21D1",
    uHar: "\u2963",
    uacute: "\xFA",
    uarr: "\u2191",
    ubrcy: "\u045E",
    ubreve: "\u016D",
    ucirc: "\xFB",
    ucy: "\u0443",
    udarr: "\u21C5",
    udblac: "\u0171",
    udhar: "\u296E",
    ufisht: "\u297E",
    ufr: "\uD835\uDD32",
    ugrave: "\xF9",
    uharl: "\u21BF",
    uharr: "\u21BE",
    uhblk: "\u2580",
    ulcorn: "\u231C",
    ulcorner: "\u231C",
    ulcrop: "\u230F",
    ultri: "\u25F8",
    umacr: "\u016B",
    uml: "\xA8",
    uogon: "\u0173",
    uopf: "\uD835\uDD66",
    uparrow: "\u2191",
    updownarrow: "\u2195",
    upharpoonleft: "\u21BF",
    upharpoonright: "\u21BE",
    uplus: "\u228E",
    upsi: "\u03C5",
    upsih: "\u03D2",
    upsilon: "\u03C5",
    upuparrows: "\u21C8",
    urcorn: "\u231D",
    urcorner: "\u231D",
    urcrop: "\u230E",
    uring: "\u016F",
    urtri: "\u25F9",
    uscr: "\uD835\uDCCA",
    utdot: "\u22F0",
    utilde: "\u0169",
    utri: "\u25B5",
    utrif: "\u25B4",
    uuarr: "\u21C8",
    uuml: "\xFC",
    uwangle: "\u29A7",
    vArr: "\u21D5",
    vBar: "\u2AE8",
    vBarv: "\u2AE9",
    vDash: "\u22A8",
    vangrt: "\u299C",
    varepsilon: "\u03F5",
    varkappa: "\u03F0",
    varnothing: "\u2205",
    varphi: "\u03D5",
    varpi: "\u03D6",
    varpropto: "\u221D",
    varr: "\u2195",
    varrho: "\u03F1",
    varsigma: "\u03C2",
    varsubsetneq: "\u228A\uFE00",
    varsubsetneqq: "\u2ACB\uFE00",
    varsupsetneq: "\u228B\uFE00",
    varsupsetneqq: "\u2ACC\uFE00",
    vartheta: "\u03D1",
    vartriangleleft: "\u22B2",
    vartriangleright: "\u22B3",
    vcy: "\u0432",
    vdash: "\u22A2",
    vee: "\u2228",
    veebar: "\u22BB",
    veeeq: "\u225A",
    vellip: "\u22EE",
    verbar: "|",
    vert: "|",
    vfr: "\uD835\uDD33",
    vltri: "\u22B2",
    vnsub: "\u2282\u20D2",
    vnsup: "\u2283\u20D2",
    vopf: "\uD835\uDD67",
    vprop: "\u221D",
    vrtri: "\u22B3",
    vscr: "\uD835\uDCCB",
    vsubnE: "\u2ACB\uFE00",
    vsubne: "\u228A\uFE00",
    vsupnE: "\u2ACC\uFE00",
    vsupne: "\u228B\uFE00",
    vzigzag: "\u299A",
    wcirc: "\u0175",
    wedbar: "\u2A5F",
    wedge: "\u2227",
    wedgeq: "\u2259",
    weierp: "\u2118",
    wfr: "\uD835\uDD34",
    wopf: "\uD835\uDD68",
    wp: "\u2118",
    wr: "\u2240",
    wreath: "\u2240",
    wscr: "\uD835\uDCCC",
    xcap: "\u22C2",
    xcirc: "\u25EF",
    xcup: "\u22C3",
    xdtri: "\u25BD",
    xfr: "\uD835\uDD35",
    xhArr: "\u27FA",
    xharr: "\u27F7",
    xi: "\u03BE",
    xlArr: "\u27F8",
    xlarr: "\u27F5",
    xmap: "\u27FC",
    xnis: "\u22FB",
    xodot: "\u2A00",
    xopf: "\uD835\uDD69",
    xoplus: "\u2A01",
    xotime: "\u2A02",
    xrArr: "\u27F9",
    xrarr: "\u27F6",
    xscr: "\uD835\uDCCD",
    xsqcup: "\u2A06",
    xuplus: "\u2A04",
    xutri: "\u25B3",
    xvee: "\u22C1",
    xwedge: "\u22C0",
    yacute: "\xFD",
    yacy: "\u044F",
    ycirc: "\u0177",
    ycy: "\u044B",
    yen: "\xA5",
    yfr: "\uD835\uDD36",
    yicy: "\u0457",
    yopf: "\uD835\uDD6A",
    yscr: "\uD835\uDCCE",
    yucy: "\u044E",
    yuml: "\xFF",
    zacute: "\u017A",
    zcaron: "\u017E",
    zcy: "\u0437",
    zdot: "\u017C",
    zeetrf: "\u2128",
    zeta: "\u03B6",
    zfr: "\uD835\uDD37",
    zhcy: "\u0436",
    zigrarr: "\u21DD",
    zopf: "\uD835\uDD6B",
    zscr: "\uD835\uDCCF",
    zwj: "\u200D",
    zwnj: "\u200C",
  },
  yr = {
    0: 65533,
    128: 8364,
    130: 8218,
    131: 402,
    132: 8222,
    133: 8230,
    134: 8224,
    135: 8225,
    136: 710,
    137: 8240,
    138: 352,
    139: 8249,
    140: 338,
    142: 381,
    145: 8216,
    146: 8217,
    147: 8220,
    148: 8221,
    149: 8226,
    150: 8211,
    151: 8212,
    152: 732,
    153: 8482,
    154: 353,
    155: 8250,
    156: 339,
    158: 382,
    159: 376,
  },
  Pr = function (e) {
    return (
      e?.id?.name ?? e?.declaration?.name ?? e?.declarations?.[0]?.id?.name
    );
  },
  kr = new Set([
    "ArrowFunctionExpression",
    "FunctionExpression",
    "VariableDeclaration",
  ]),
  Y0 = new Set(["Literal", "ArrayExpression"]),
  Ut = "_",
  Sn = `${Ut}native`,
  et = new Set(["jsx", "jsxDEV"]),
  J0 = new RegExp(`web-components.*(/|)${Ut}`),
  $0 = {
    type: "ImportDeclaration",
    specifiers: [
      {
        type: "ImportSpecifier",
        imported: { type: "Identifier", name: "brisaElement" },
        local: { type: "Identifier", name: "brisaElement" },
      },
      {
        type: "ImportSpecifier",
        imported: { type: "Identifier", name: "_on" },
        local: { type: "Identifier", name: "_on" },
      },
      {
        type: "ImportSpecifier",
        imported: { type: "Identifier", name: "_off" },
        local: { type: "Identifier", name: "_off" },
      },
    ],
    source: { type: "Literal", value: "brisa/client" },
  },
  xr = {
    type: "ImportDeclaration",
    specifiers: [
      {
        type: "ImportSpecifier",
        imported: { type: "Identifier", name: "translateCore" },
        local: { type: "Identifier", name: "translateCore" },
      },
    ],
    source: { type: "Literal", value: "brisa" },
  },
  Q0 = function (e) {
    return { type: "ReturnStatement", argument: e };
  },
  je = { type: "Literal", value: null },
  kt = { type: "ObjectExpression", properties: [] },
  ei = new Set([
    "Identifier",
    "ConditionalExpression",
    "MemberExpression",
    "LogicalExpression",
  ]),
  ri = new Set(["IfStatement", "SwitchStatement"]),
  ni = new Set(["ArrowFunctionExpression", "FunctionExpression"]),
  Rn = function (e, t) {
    if (typeof e !== "object" || e === null || e.effectDeps) return;
    if (Array.isArray(e)) {
      for (let r of e) Rn(r, t);
      return;
    }
    if (!Array.isArray(t) && t.effectDeps) {
      e.effectDeps = t.effectDeps;
      return;
    }
  },
  oi = function (e, t) {
    const r = t.effectDeps ?? [];
    let n = e;
    for (let o of r) {
      const i = n.arguments?.[0] ?? n;
      if (o === i?.callee?.name) continue;
      const a = {
        type: "CallExpression",
        callee: { type: "Identifier", name: o },
        arguments: [i],
        effectDeps: r,
      };
      if (n.arguments) n.arguments = [a];
      else n = a;
    }
    return n;
  },
  ii = function (e) {
    const t = new Set();
    let r = 0;
    return () => {
      let n = `r${r ? r : ""}`;
      while (t.has(n) || e.has(n)) n += "$";
      return t.add(n), (r += 1), n;
    };
  },
  ai = function (e) {
    const t = ii(e),
      r = new Map();
    let n;
    return {
      getRNameFromIdentifier: (o) => r.get(o),
      getEffectIdentifier: () => n,
      assignRNameToNode: (o, { takenName: i, parent: a }) => {
        const u = o?.arguments?.[0] ?? {};
        let s = i ?? o?.init?.params?.[0]?.name ?? u.params?.[0]?.name ?? t();
        if (
          ((o.effectDeps = Array.from(
            new Set([s, ...(a?.effectDeps ?? []), ...(o?.effectDeps ?? [])]),
          )),
          u.type === "Identifier")
        )
          (n = u.name), r.set(u.name, s);
      },
    };
  },
  vr = new Set(["FunctionDeclaration", "VariableDeclarator"]),
  ui = new Set(["CallExpression", "FunctionDeclaration"]),
  Tn = function (e) {
    const { LOG_PREFIX: t } = U(),
      r = t[{ Error: "ERROR", Warning: "WARN" }[e]];
    return (n, o) => {
      if (
        (console.log(r, `Ops! ${e}:`),
        console.log(r, "--------------------------"),
        n.forEach((i) => console.log(r, i)),
        console.log(r, "--------------------------"),
        o)
      )
        console.log(r, o);
    };
  },
  Ye = function (e, t = !1) {
    const r = new Set(["Identifier", "MemberExpression"]);
    let n = !1;
    if (Y0.has(e?.type)) return n;
    return (
      JSON.stringify(e, function (o, i) {
        if (!t && i?.type === "Property") return null;
        return (
          (n ||=
            i?.type === "MemberExpression" &&
            r.has(i?.object?.type) &&
            i?.property?.type === "Identifier" &&
            i?.property?.name === "value"),
          (n ||=
            i?.type === "CallExpression" && !et.has(i?.callee?.name ?? "")),
          i
        );
      }),
      n
    );
  },
  li = function (e) {
    return {
      type: "ArrowFunctionExpression",
      expression: !0,
      params: [{ type: "Identifier", name: "e" }],
      body: {
        type: "CallExpression",
        callee: e,
        arguments: [{ type: "Identifier", name: "e" }],
      },
    };
  },
  di = function (e) {
    return (
      e?.type === "AssignmentExpression" &&
      e?.left?.type === "MemberExpression" &&
      Gn.has(e?.left?.property?.name)
    );
  },
  mi = function (e) {
    return (
      e?.type === "CallExpression" &&
      e?.callee?.type === "MemberExpression" &&
      e?.callee?.object?.name === "Object" &&
      e?.callee?.property?.name === "assign" &&
      +e?.arguments?.length
    );
  },
  gi = function (e, t, r) {
    return (
      e?.type === "Identifier" &&
      r.has(e?.name) &&
      t?.type === "VariableDeclarator" &&
      pi.has(t.init?.type)
    );
  },
  Gn = new Set(["error", "suspense"]),
  pi = new Set(["FunctionExpression", "ArrowFunctionExpression"]),
  xt = function (e, t) {
    const r = new Set([]),
      n = new Set([]),
      o = new Set([e]);
    return (
      JSON.stringify(t, (i, a) => {
        if (
          a?.object?.type === "Identifier" &&
          a?.property?.type === "Identifier" &&
          o.has(a?.object?.name)
        ) {
          const u = a?.property?.name !== lt ? a?.property?.name : null;
          if (u) r.add(u), n.add(u);
        } else if (
          a?.init?.type === "Identifier" &&
          a?.id?.properties &&
          o.has(a?.init?.name)
        )
          for (let u of a.id.properties) {
            if (u?.key?.name && u.key.name !== lt) r.add(u.key.name);
            if (u?.type === "RestElement") o.add(u.argument.name);
            if (u?.value?.name) n.add(u.value.name);
          }
        else if (
          a?.type === "VariableDeclarator" &&
          a?.init?.object?.type === "Identifier" &&
          a?.init?.property?.type === "Identifier" &&
          o.has(a?.init?.object?.name)
        )
          r.add(a?.init?.property?.name), n.add(a?.init?.property?.name);
        return a;
      }),
      [[...r], [...n], {}]
    );
  },
  Je = function (e, t) {
    return [...new Set([...e, ...t])];
  },
  lt = "children",
  ki = function (e, t, r) {
    let n = !1;
    const o =
      t?.body?.body ??
      t?.body ??
      t?.declarations?.[0]?.init?.body?.body ??
      t?.declarations?.[0]?.init?.body;
    for (let [i, a, u = "??"] of e) {
      const s = (a?.usedOperator ?? u) === "??" ? "??=" : "||=";
      let c;
      const d = {
        type: "ExpressionStatement",
        isEffect: !0,
        expression: {
          type: "CallExpression",
          callee: { type: "Identifier", name: "effect" },
          arguments: [
            {
              type: "ArrowFunctionExpression",
              params: [],
              body: {
                type: "AssignmentExpression",
                left: c
                  ? {
                      type: "MemberExpression",
                      object: { type: "Identifier", name: c },
                      property: { type: "Identifier", name: i },
                      computed: !1,
                    }
                  : { type: "Identifier", name: i },
                operator: s,
                right: a,
              },
              async: !1,
              expression: !0,
            },
          ],
        },
      };
      if (Array.isArray(o)) o.unshift(d);
      else if (o === t?.body)
        t.body = {
          type: "BlockStatement",
          body: [d, { type: "ReturnStatement", argument: o }],
        };
      n = !0;
    }
    if (n) Pi(t, Dn("effect", r), "effect");
  },
  { generateCodeFromAST: vi } = he("tsx"),
  { parseCodeToAST: Ir } = he("tsx"),
  Ar = `
  get t() {
    return translateCore(this.locale, { ...i18nConfig, messages: this.messages })
  },
  get messages() { return {[this.locale]: window.i18nMessages } },
  overrideMessages(callback) {
    const p = callback(window.i18nMessages);
    const a = m => Object.assign(window.i18nMessages, m);
    return p.then?.(a) ?? a(p);
  }
`,
  { parseCodeToAST: Ii, generateCodeFromAST: bt } = he("tsx"),
  Nr = "__BRISA_CLIENT__",
  Ai = { isI18nAdded: !1, isTranslateCoreAdded: !1 },
  { parseCodeToAST: wi, generateCodeFromAST: Ri } = he("tsx");
globalThis.BrisaRegistry = globalThis.BrisaRegistry || new Map();
var Ti = function (e) {
    return e.toUpperCase().replace("-", "").replace("_", "");
  },
  Di = /([-_]([a-z]|[0-9]))/g,
  qi = he("tsx"),
  Oi =
    await `l$=new Set;u$=(h)=>{const r=(v)=>document.getElementById(v);l$.add(h);for(let v of l$){const g=r(\`S:\${v}\`),f=r(\`U:\${v}\`);if(g&&f)l$.delete(v),g.replaceWith(f.content.cloneNode(!0)),f.remove(),r(\`R:\${v}\`)?.remove()}};
`,
  _i =
    await `(()=>{async function w(J,x=!1,L,K,...G){const Q="e"+L,X=[],H=Y._s;let z=Z?B.resolve():new B((j)=>{let V=h.createElement("script");V.onload=V.onerror=j,V.src="/_brisa/pages/_rpc-lazy-2377508617743893914.js",h.head.appendChild(V)});if(L){for(let j of b("[indicator]"))if(U(j,"indicator")?.includes(L))j.classList.add("brisa-request"),X.push(j),H?.set(L,!0)}try{const j=await fetch(location.toString(),{method:"POST",headers:{"x-action":J,"x-actions":K??"","x-s":W(H?[..._s.Map.entries()]:Y._S)??""},body:x?new FormData(G[0].target):W(G,S)});if(j.ok){if(await z,!Z)Z=Y._rpc,delete Y._rpc;await Z(j)}else H?.set(Q,await j.text())}catch(j){H?.set(Q,j.message)}finally{for(let j of X)j.classList.remove("brisa-request");H?.set(L,!1)}}var S=function(J,x){const L=(G)=>x instanceof G,K=L(Node);if(L(Event)||K&&J.match(/target/i)){const G={};for(let Q in x)G[Q]=x[Q];if(L(CustomEvent))G._wc=!0;return G}if(x==null||x===""||K||L(Window))return;return x},_=function(){const J=b(\`[\${k}]\`);for(let L of J){if(!L.hasAttribute(k))continue;L.removeAttribute(k);const K=L.dataset;for(let[G,Q]of Object.entries(K)){const X=G.toLowerCase(),H=X.replace("action","").replace("on",""),z=L.tagName==="FORM"&&H==="submit",j=+(U(L,"debounce"+H)??0);let V;if(X.startsWith("action"))L.addEventListener(H,(...M)=>{if(M[0]instanceof Event)M[0].preventDefault();clearTimeout(V),V=setTimeout(()=>w(Q,z,U(L,"indicate"+H),K.actions,...M),j)})}}},U=function(J,x){return J.getAttribute(x)},b=function(J){return h.querySelectorAll(J)},q=function(){if(_(),!F)requestAnimationFrame(q)};var k="data-action",h=document,Y=window,W=JSON.stringify,B=Promise,Z,F=!1;q();h.addEventListener("DOMContentLoaded",()=>{F=!0,_()});
})()`,
  Fi =
    await `(()=>{var x=new DOMParser;function X(B,H){const S=x.parseFromString(B,"text/html");return H==="HTML"?S.documentElement:S.body.firstChild}var \$=function(B,H){if(B.nodeType!==H.nodeType)return B.parentNode.replaceChild(H,B);if(B.nodeType===C){if(B.isEqualNode(H))return;if(G(B,H),B.nodeName===H.nodeName)U(B.attributes,H.attributes);else{const S=H.cloneNode();while(B.firstChild)S.appendChild(B.firstChild);B.parentNode.replaceChild(S,B)}}else if(B.nodeValue!==H.nodeValue)B.nodeValue=H.nodeValue},U=function(B,H){let S,q,j,J,z;for(S=B.length;S--;)if(q=B[S],J=q.namespaceURI,z=q.localName,j=H.getNamedItemNS(J,z),!j)B.removeNamedItemNS(J,z);for(S=H.length;S--;)if(q=H[S],J=q.namespaceURI,z=q.localName,j=B.getNamedItemNS(J,z),!j)H.removeNamedItemNS(J,z),B.setNamedItemNS(q);else if(j.value!==q.value)j.value=q.value},G=function(B,H){let S,q,j,J,z,Q=null,I=B.firstChild,V=H.firstChild,W=0;while(I)if(W++,S=I,q=Z(S),I=I.nextSibling,q){if(!Q)Q={};Q[q]=S}I=B.firstChild;while(V){if(W--,j=V,V=V.nextSibling,j.nodeName==="SCRIPT"&&/R:(1-9)*/.test(j.id)){u\$?.(j.id.replace("R:",""));continue}if(Q&&(J=Z(j))&&(z=Q[J])){if(delete Q[J],z!==I)B.insertBefore(z,I);else I=I.nextSibling;\$(z,j)}else if(I)if(S=I,I=I.nextSibling,Z(S))B.insertBefore(j,S);else \$(S,j);else B.appendChild(j)}for(q in Q)W--,B.removeChild(Q[q]);while(--W>=0)B.removeChild(B.lastChild)},Z=function(B){return B?.getAttribute?.("key")||B.id},C=1,D=9,L=11;function F(B,H){if(B.nodeType===D)B=B.documentElement;if(H.nodeType===L)G(B,H);else{const S=typeof H==="string"?X(H,B.nodeName):H;\$(B,S)}}async function g(B){const H=B.headers.get("X-Navigate"),S=B.headers.get("X-S");if(S){const j=JSON.parse(S);if(!window._s)return window._S=j;for(let[J,z]of j)window._s.set(J,z)}if(H){window.location.href=H;return}const q=await B.text();if(!q)return;await F(document,q)}window._rpc=g;
})()`,
  Li = "BRISA_PUBLIC_",
  Tr = "context-provider",
  { parseCodeToAST: Hi, generateCodeFromAST: Ui } = he("tsx"),
  zi = new Set(["jsx", "jsxDEV"]),
  ji = new RegExp(".*/web-components/.*"),
  Yi = `
const Fragment = props => props.children;

function jsxDEV(type, props){ return { type, props }};
function jsx(type, props){ return { type, props }};

Fragment.__isFragment = true;
`,
  _n = function (e) {
    if (!e.length) return [];
    const [t, r, n, o] = e.slice(0, 4);
    return [[t || n, r || "", o]].concat(_n(e.slice(4, e.length)));
  },
  $i = /<(\w+) *>(.*?)<\/\1 *>|<(\w+) *\/>/,
  Zi = /(?:\r\n|\r|\n)/g,
  Ne = function (e, t = "", r, n = { returnObjects: !1 }) {
    const { keySeparator: o = "." } = r || {},
      i = o ? t.split(o) : [t];
    if (t === o && n.returnObjects) return e;
    const a = i.reduce((u, s) => {
      if (typeof u === "string") return {};
      const c = u[s];
      return c || (typeof c === "string" ? c : {});
    }, e);
    if (typeof a === "string" || (a instanceof Object && n.returnObjects))
      return a;
    return;
  },
  Qi = function (e, t, r, n, o) {
    if (!o || typeof o.count !== "number") return r;
    const i = `${r}_${o.count}`;
    if (Ne(t, i, n) !== void 0) return i;
    const a = `${r}_${e.select(o.count)}`;
    if (Ne(t, a, n) !== void 0) return a;
    const u = `${r}.${o.count}`;
    if (Ne(t, u, n) !== void 0) return u;
    const s = `${r}.${e.select(o.count)}`;
    if (Ne(t, s, n) !== void 0) return s;
    return r;
  },
  Ln = function ({ text: e, query: t, config: r, locale: n }) {
    if (!e || !t) return e || "";
    const o = (c) => c.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
      {
        format: i = null,
        prefix: a = "{{",
        suffix: u = "}}",
      } = r.interpolation || {},
      s = u === "" ? "" : `(?:[\\s,]+([\\w-]*))?\\s*${o(u)}`;
    return Object.keys(t).reduce((c, d) => {
      const f = new RegExp(`${o(a)}\\s*${d}${s}`, "gm");
      return c.replace(f, (l, g) => {
        return g && i ? i(t[d], g, n) : t[d];
      });
    }, e);
  },
  Vn = function ({ obj: e, query: t, config: r, locale: n }) {
    if (!t || Object.keys(t).length === 0) return e;
    return (
      Object.keys(e).forEach((o) => {
        if (e[o] instanceof Object)
          Vn({ obj: e[o], query: t, config: r, locale: n });
        if (typeof e[o] === "string")
          e[o] = Ln({ text: e[o], query: t, config: r, locale: n });
      }),
      e
    );
  },
  ta = function (e, t) {
    const r = Bn(t),
      n = new Set();
    for (let o of e) {
      const i =
        o instanceof RegExp
          ? o
          : new RegExp(o + "(_zero|_one|_two|_few|_many|_other|_[0-9]+)?$");
      for (let a of r) if (i.test(a)) n.add(a);
    }
    return n;
  },
  Bn = function (e, t = "") {
    const r = (U().I18N_CONFIG ?? {}).keySeparator ?? ".";
    let n = [];
    for (let o in e) {
      let i = t ? `${t}${r}${o}` : o;
      if (e[o]?.constructor === Object) {
        n = n.concat(Bn(e[o], i));
        continue;
      }
      const a = i.split(".");
      while (i)
        n.push(i), (i = i.replace(a.pop() ?? "", "").replace(/\.$/, ""));
    }
    return n;
  },
  Gr = new Set([
    "ArrowFunctionExpression",
    "FunctionExpression",
    "FunctionDeclaration",
    "ArrowFunctionExpression",
  ]),
  fa = function (e) {
    let t;
    return (
      JSON.stringify(e.componentFnExpression, (r, n) => {
        if (e.actionIdentifierName === n?.id?.name)
          (n.__isActionFn = !0), (t = n);
        return n;
      }),
      t
    );
  },
  da = function ({ actionsEntrypoints: e }) {
    const t = new RegExp(`(${e.join("|")})$`);
    return {
      name: "action-plugin",
      setup(r) {
        r.onLoad({ filter: t }, async ({ path: n, loader: o }) => {
          const i = await Bun.file(n).text();
          return { contents: ma(i), loader: o };
        });
      },
    };
  },
  ga = function (e) {
    return {
      ...e,
      body: [
        {
          type: "ImportDeclaration",
          source: { type: "Literal", value: "brisa/server" },
          specifiers: [
            {
              type: "ImportSpecifier",
              imported: { type: "Identifier", name: "resolveAction" },
              local: { type: "Identifier", name: "__resolveAction" },
            },
          ],
        },
        ...e.body,
      ],
    };
  },
  pa = function (e) {
    let t = 0;
    const r = (o) => {
        if (o?.type === "VariableDeclaration") {
          const i = [];
          for (let a of o.declarations) {
            if (!Ca.has(a.init.type)) {
              i.push(o);
              break;
            }
            let u = a.init.body;
            if (u.type !== "BlockStatement")
              u = {
                type: "BlockStatement",
                body: [{ type: "ReturnStatement", argument: u }],
              };
            i.push({
              type: "FunctionDeclaration",
              id: a.id,
              params: a.init.params,
              body: u,
              async: a.init.async,
              generator: a.init.generator ?? !1,
            });
          }
          return i;
        }
        if (o?.type === "ArrowFunctionExpression")
          return [
            {
              type: "FunctionDeclaration",
              id: { type: "Identifier", name: `Component__${t++}__` },
              params: o.params,
              body:
                o.body.type === "BlockStatement"
                  ? o.body
                  : {
                      type: "BlockStatement",
                      body: [{ type: "ReturnStatement", argument: o.body }],
                    },
              async: o.async,
              generator: !1,
            },
          ];
        return [o];
      },
      n = [];
    for (let o of e.body) {
      const i = Ea.has(o?.type),
        a = i && o.specifiers?.length,
        u = i && o.declaration?.type === "Identifier";
      if (!a && !u) n.push(...(i ? r(o.declaration) : r(o)));
    }
    return { ...e, body: n };
  },
  ha = function (e) {
    const { params: t, requestDestructuring: r, requestParamName: n } = ya(e),
      o = !e.actionIdentifierName && e.actionFnExpression,
      i = ca(e);
    if (o)
      i.body.unshift({
        type: "VariableDeclaration",
        kind: "const",
        declarations: [
          {
            type: "VariableDeclarator",
            id: { type: "Identifier", name: "__action" },
            init: e.actionFnExpression,
          },
        ],
      });
    if (r) i.body.unshift(r);
    return (
      i.body.push(Pa(e, n)),
      i.body.push(ka()),
      {
        type: "ExportNamedDeclaration",
        declaration: {
          type: "FunctionDeclaration",
          id: { type: "Identifier", name: e.actionId },
          params: t,
          body: xa({ body: i, info: e, params: t, requestParamName: n }),
          async: !0,
          generator: !1,
        },
        specifiers: [],
        source: null,
      }
    );
  },
  ya = function (e) {
    const t = (e.componentFnExpression?.params ?? []).slice();
    let r = "req",
      n;
    if (!t.length) t.push({ type: "ObjectPattern", properties: [] });
    if (t.length === 1) t.push({ type: "Identifier", name: r });
    else {
      const o = t[1];
      if (
        ((r = o?.type === "Identifier" ? o?.name : "req"),
        (t[1] = { type: "Identifier", name: r }),
        o.type === "ObjectPattern")
      )
        n = {
          type: "VariableDeclaration",
          kind: "const",
          declarations: [
            {
              type: "VariableDeclarator",
              id: o,
              init: { type: "Identifier", name: r },
            },
          ],
        };
    }
    return { params: t, requestDestructuring: n, requestParamName: r };
  },
  Pa = function (e, t) {
    return {
      type: "ExpressionStatement",
      expression: {
        type: "AwaitExpression",
        argument: {
          type: "CallExpression",
          callee: {
            type: "Identifier",
            name: e.actionIdentifierName ?? "__action",
          },
          arguments: [
            {
              type: "SpreadElement",
              argument: {
                type: "CallExpression",
                callee: {
                  type: "MemberExpression",
                  object: {
                    type: "MemberExpression",
                    object: { type: "Identifier", name: t },
                    computed: !1,
                    property: { type: "Identifier", name: "store" },
                  },
                  computed: !1,
                  property: { type: "Identifier", name: "get" },
                },
                arguments: [
                  { type: "Literal", value: "__params:" + e.actionId },
                ],
              },
            },
          ],
        },
      },
    };
  },
  ka = function () {
    return {
      type: "ReturnStatement",
      argument: {
        type: "NewExpression",
        callee: { type: "Identifier", name: "Response" },
        arguments: [{ type: "Literal", value: null }],
      },
    };
  },
  xa = function ({ body: e, info: t, params: r, requestParamName: n }) {
    const { IS_PRODUCTION: o } = U();
    return {
      ...e,
      body: [
        {
          type: "TryStatement",
          block: { type: "BlockStatement", body: e.body },
          handler: {
            type: "CatchClause",
            param: { type: "Identifier", name: "error" },
            body: {
              type: "BlockStatement",
              body: [
                {
                  type: "ReturnStatement",
                  argument: {
                    type: "CallExpression",
                    callee: { type: "Identifier", name: "__resolveAction" },
                    arguments: [
                      {
                        type: "ObjectExpression",
                        properties: [
                          {
                            type: "Property",
                            key: { type: "Identifier", name: "req" },
                            value: { type: "Identifier", name: n },
                            kind: "init",
                            computed: !1,
                            method: !1,
                            shorthand: n === "req",
                          },
                          {
                            type: "Property",
                            key: { type: "Identifier", name: "error" },
                            value: { type: "Identifier", name: "error" },
                            kind: "init",
                            computed: !1,
                            method: !1,
                            shorthand: !0,
                          },
                          {
                            type: "Property",
                            key: { type: "Identifier", name: "component" },
                            value: {
                              type: "CallExpression",
                              callee: {
                                type: "Identifier",
                                name: o ? "jsx" : "jsxDEV",
                              },
                              arguments: [
                                {
                                  type: "Identifier",
                                  name:
                                    t.componentFnExpression?.id?.name ??
                                    "Component",
                                },
                                r[0],
                                ...(o
                                  ? []
                                  : [
                                      { type: "Identifier", name: "undefined" },
                                      { type: "Literal", value: !1 },
                                      { type: "Identifier", name: "undefined" },
                                      { type: "ThisExpression" },
                                    ]),
                              ],
                            },
                            kind: "init",
                            computed: !1,
                            method: !1,
                            shorthand: !1,
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
          finalizer: null,
        },
      ],
    };
  },
  { parseCodeToAST: ba, generateCodeFromAST: va } = he("tsx"),
  Ea = new Set(["ExportDefaultDeclaration", "ExportNamedDeclaration"]),
  Ca = new Set(["ArrowFunctionExpression", "FunctionExpression"]),
  vt = function (e, t, { pagesClientPath: r, pagePath: n, skipList: o = !1 }) {
    const { BUILD_DIR: i, VERSION_HASH: a } = U(),
      u = `${t}-${a}.js`;
    if (!e) return 0;
    if (!o && le.existsSync(J(r, u))) {
      const c = J(r, `${t}.txt`);
      return (
        Bun.write(c, `${le.readFileSync(c).toString()}\n${n.replace(i, "")}`), 0
      );
    }
    const s = Et(new TextEncoder().encode(e));
    if ((Bun.write(J(r, u), e), Bun.write(J(r, `${u}.gz`), s), !o))
      Bun.write(J(r, `${t}.txt`), n.replace(i, ""));
    return s.length;
  },
  { LOG_PREFIX: ct, SRC_DIR: qr, IS_DEVELOPMENT: wa } = Kr;
var Ra = "reload",
  tt = !1,
  rt = "";
if (wa) {
  if (globalThis.watcher) globalThis.watcher.close();
  else console.log(ct.INFO, "hot reloading enabled");
  (globalThis.watcher = to(qr, { recursive: !0 }, async (e, t) => {
    const r = ro.join(qr, t);
    if (e !== "change" && Bun.file(r).size !== 0) return;
    if ((console.log(ct.WAIT, `recompiling ${t}...`), tt)) rt = t;
    else Xn(t);
  })),
    process.on("SIGINT", () => {
      globalThis.watcher?.close(), process.exit(0);
    });
}
var Za = Symbol.for("current-provider-id"),
  Qa = Symbol.for("context");
var Da = function (e, t) {
  return { type: e, props: t };
};
function jt() {
  return Da(
    "h1",
    { children: "Layout web component" },
    void 0,
    !1,
    void 0,
    this,
  );
}
var Ta = (e) => e.children;
Ta.__isFragment = !0;
var Ve = function (e, t) {
  return { type: e, props: t };
};
function Ga({ children: e }) {
  return Ve(
    "html",
    {
      children: [
        Ve(
          "head",
          {
            children: Ve(
              "title",
              { id: "title", children: "CUSTOM LAYOUT" },
              void 0,
              !1,
              void 0,
              this,
            ),
          },
          void 0,
          !1,
          void 0,
          this,
        ),
        Ve(
          "body",
          {
            children: [
              Ve(
                Rt,
                { Component: jt, selector: "layout-web-component" },
                void 0,
                !1,
                void 0,
                this,
              ),
              e,
            ],
          },
          void 0,
          !0,
          void 0,
          this,
        ),
      ],
    },
    void 0,
    !0,
    void 0,
    this,
  );
}
var qa = (e) => e.children;
qa.__isFragment = !0;
export { Ga as default };
