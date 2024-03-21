var Ss = function (s, o) {
    while (s) {
      if (s.tagName === "CONTEXT-PROVIDER" && o === s.getAttribute("cid")) {
        const g = s.getAttribute("pid");
        if (g) return g;
      }
      s = s.assignedSlot ?? s.host ?? s.parentNode;
    }
    return null;
  },
  cs = function (s) {
    if (typeof s !== "object") return s;
    return JSON.stringify(s).replace(/"([^"]+)"/g, "'$1'");
  },
  Y = function (s) {
    if (!s) return s;
    try {
      return JSON.parse(s.replace(/'([^']+)'/g, '"$1"'));
    } catch (o) {
      return s;
    }
  },
  W = function () {
    const s = [],
      o = new Map(),
      g = (f, e) => f.get(e) ?? new Set();
    let r = new Map(),
      a = new Map(),
      h = new Map(),
      l = !1;
    function A(f, e, n) {
      const c = o.get(f) ?? t(e);
      n ? c.value : (c.value = e), o.set(f, c);
    }
    function y(f) {
      const e = s.indexOf(f);
      if (e > -1) s.splice(e, 1);
    }
    function V(f) {
      const e = g(a, f);
      for (let n of e) n();
      a.delete(f);
    }
    function E(f) {
      const e = (n) => {
        const c = g(h, f);
        return c.add(n), h.set(f, c), n;
      };
      return (e.id = f), e;
    }
    function L(f) {
      const e = g(h, f);
      for (let n of e) {
        V(n), L(n);
        for (let c of r.keys()) {
          const u = r.get(c);
          if ((u.delete(n), u.size === 0)) r.delete(c);
        }
      }
      h.delete(f);
    }
    function t(f) {
      let e = !1;
      return {
        get value() {
          if (s[0]) r.set(this, g(r, this).add(s[0]));
          return f;
        },
        set value(n) {
          f = n;
          const c = g(r, this),
            u = new Set([...c]);
          for (let p of c) {
            if (p === s[0]) {
              if (e) continue;
              e = !e;
            }
            if (u.has(p)) L(p), V(p), p(E(p));
          }
        },
      };
    }
    async function k(f) {
      s.unshift(f);
      const e = f(E(f));
      if (e?.then) await e;
      y(f);
    }
    function v() {
      for (let f of a.keys()) V(f);
      a.clear(), r.clear(), h.clear(), i(!1);
    }
    function i(f = !0) {
      if (l === f) return;
      (l = f), fs[f ? "s" : "u"](A);
    }
    function N(f, e) {
      const n = g(a, e);
      n.add(f), a.set(e, n);
    }
    function x(f) {
      const e = t();
      return (
        k(() => {
          e.value = f();
        }),
        e
      );
    }
    const S = {
      ...U,
      setOptimistic(f, e, n) {
        const c = "__ind:" + f,
          u = "__o:" + e,
          p = S.get(e),
          C = n(p);
        S.set(c, !0),
          S.set(u, C),
          k(() => {
            if (!S.get(c) && S.get(e) === C) S.delete(u);
          });
      },
      get(f) {
        return i(), U.get("__o:" + f) ?? U.get(f);
      },
    };
    function d(f) {
      const e = "__ind:" + f,
        n = x(() => !!S.get(e));
      return (n.id = e), (n.error = x(() => S.get("e" + e))), n;
    }
    return {
      state: t,
      store: S,
      effect: k,
      reset: v,
      cleanup: N,
      derived: x,
      indicate: d,
    };
  },
  hs = function (s) {
    let o = "";
    for (let g in s) {
      const r = b(g.replace(/([A-Z])/g, "-$1"));
      o += `${r}:${s[g]};`;
    }
    return o;
  },
  gs = function (s, o = []) {
    const g = [],
      r = {};
    o.push($);
    for (let a of o) {
      const h = b(a);
      (r[h] = r[a] = a), g.push(h);
    }
    return class extends HTMLElement {
      p;
      l;
      s;
      static get observedAttributes() {
        return g;
      }
      async [D]() {
        const a = this,
          h = a.shadowRoot ?? a.attachShadow({ mode: "open" }),
          l = [],
          A = [];
        function y(t, k) {
          if (t?.type !== ts) return [t, k];
          const { element: v, target: i } = t.props;
          return [v, i];
        }
        async function V(t, k, v, i, N, x, S = !1) {
          if (v?.then) v = await v;
          if (S) {
            if (a.shadowRoot) a.shadowRoot[w] = "";
            if (A.length) {
              const f = B("style");
              x(() => {
                let e = "";
                for (let [n, ...c] of A)
                  e += String.raw(n, ...c.map((u) => (R(u) ? u() : u)));
                f.textContent = e;
              }),
                m(h, f);
            }
          }
          [v, i] = y(v, i);
          let d = t ? B(t, i) : i;
          for (let [f, e] of Object.entries(k)) {
            const n = j(f),
              c = f === as;
            if (n)
              d.addEventListener(b(f.slice(2)), (u) =>
                e(u instanceof CustomEvent ? u.detail : u),
              );
            else if (c || (!n && R(e)))
              x(N(() => ss(d, f, c ? e?.value : e())));
            else ss(d, f, e);
          }
          if (v?.type === F) d[w] += v.props.html;
          else if (v === K) m(d, B(K));
          else if (_(v))
            if (_(v[0])) for (let f of v) V(T, {}, f, d, N, x);
            else V(...v, d, N, x);
          else if (R(v)) {
            let f;
            const e = (n) => {
              if (f && d.contains(f[0])) {
                d.insertBefore(n, f[0]);
                for (let c of f) c?.remove();
              } else m(d, n);
            };
            x(
              N((n) => {
                const c = v();
                function u(p) {
                  [p, d] = y(p, d);
                  const C = p?.type === F;
                  if (C || _(p)) {
                    let O = H(d.childNodes);
                    const M = document.createDocumentFragment();
                    if (C) {
                      const P = B("p");
                      P[w] += p.props.html;
                      for (let vs of H(P.childNodes)) m(M, vs);
                    } else if (_(p[0]))
                      for (let P of p) V(T, {}, P, M, N(n), x);
                    else if (p.length) V(...p, M, N(n), x);
                    e(M), (f = H(d.childNodes).filter((P) => !O.includes(P)));
                  } else {
                    const O = q(p);
                    e(O), (f = [O]);
                  }
                }
                if (c instanceof Promise) c.then(u);
                else u(c);
              }),
            );
          } else m(d, q(v));
          if (t) m(i, d);
        }
        const E = (t, k, v = W(), i = J) => {
          (a.s = v), (a[i] = {});
          for (let S of o)
            a[i][r[S]] = j(S) ? a.e(S) : v.state(Y(a.getAttribute(S)));
          const N = { children: [K, {}, T], ...a[i], ...k },
            x = {
              ...v,
              onMount(S) {
                l.push(S);
              },
              useContext(S) {
                const d = Ss(a, S.id);
                if (d) {
                  const f = `${us}:${S.id}:${d}`;
                  return v.derived(() => v.store.get(f));
                }
                return v.state(S.defaultValue);
              },
              css(S, ...d) {
                A.push([S, ...d]);
              },
              i18n: window.i18n,
              self: a,
            };
          return (A.length = 0), V(T, {}, t(N, x), h, (S) => S, v.effect, !0);
        };
        let L = W();
        try {
          if (R(s.suspense)) await E(s.suspense, T, L, I);
          await E(s), L.reset(), delete a[I];
        } catch (t) {
          if ((L.reset(), a.s.reset(), R(s.error)))
            E(s.error, { error: a.s.state(t) });
          else throw t;
        }
        for (let t of l) t();
      }
      [G]() {
        this.s?.reset();
      }
      e(a) {
        return (h) => {
          const l = new CustomEvent(b(a.slice(2)), { detail: h?.detail ?? h });
          this.dispatchEvent(l);
        };
      }
      attributeChangedCallback(a, h, l) {
        const A = this,
          y = A[I] ? I : J;
        if (a === $ && h != T && h !== l) A[G](), A[D]();
        if (A[y] && h !== l && !j(a)) A[y][r[a]].value = Y(l);
      }
    };
  },
  ds = function () {
    const s = new Set();
    return {
      ["s"](o) {
        s.add(o);
      },
      ["n"](...o) {
        for (let g of s) g(...o);
      },
      ["u"](o) {
        s.delete(o);
      },
    };
  },
  fs = ds(),
  es = new Map(window._S),
  U = (window._s = { Map: es });
for (let s of ["get", "set", "delete"])
  U[s] = (o, g) => {
    const r = es[s](o, g);
    return fs.n(o, g, s === "get"), r;
  };
var b = (s) => s.toLowerCase(),
  rs = Symbol("on"),
  ps = Symbol("off"),
  os = "http://www.w3.org/",
  z = os + "2000/svg",
  Q = os + "1999/xlink",
  F = "HTML",
  as = "indicator",
  Z = "brisa-request",
  ts = "portal",
  K = "slot",
  $ = "key",
  D = "connectedCallback",
  G = "dis" + D,
  w = "inner" + F,
  J = "p",
  I = "l",
  T = null,
  us = "context",
  q = (s) => {
    if (s === !1) s = "";
    return document.createTextNode(
      (Array.isArray(s) ? s.join("") : s ?? "").toString(),
    );
  },
  ns = (s) => typeof s === "object",
  _ = (s) => s?.some?.(ns),
  H = Array.from,
  R = (s) => typeof s === "function",
  j = (s) => s.startsWith("on"),
  m = (s, o) => s.appendChild(o),
  B = (s, o) => {
    return s === "svg" ||
      (o?.namespaceURI === z && b(o.tagName) !== "foreignobject")
      ? document.createElementNS(z, s)
      : document.createElement(s);
  },
  ss = (s, o, g) => {
    const r = g === rs,
      a = g === ps,
      h = o === "style" && ns(g) ? hs(g) : cs(g),
      l = s.namespaceURI === z && (o.startsWith("xlink:") || o === "href");
    if (o === as)
      if (g) s.classList.add(Z);
      else s.classList.remove(Z);
    else if (o === "ref") g.value = s;
    else if (l)
      if (a) s.removeAttributeNS(Q, o);
      else s.setAttributeNS(Q, o, r ? "" : h);
    else if (a) s.removeAttribute(o);
    else s.setAttribute(o, r ? "" : h);
  };
var is = function () {
    return ["h1", {}, "Layout web component"];
  },
  X = gs(is);
if (X) customElements.define("layout-web-component", X);
