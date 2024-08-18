(() => {
  function he(t, i) {
    while (t) {
      if (t.tagName === 'CONTEXT-PROVIDER' && i === t.getAttribute('cid')) {
        const o = t.getAttribute('pid');
        if (o) return o;
      }
      t = t.assignedSlot ?? t.host ?? t.parentNode;
    }
    return null;
  }
  function pe(t) {
    return typeof t !== 'object'
      ? t
      : JSON.stringify(t, (i, o) => (o === void 0 ? '_|U|_' : o));
  }
  function ee(t) {
    if (!t) return t;
    try {
      return JSON.parse(t, (i, o) => (o === '_|U|_' ? void 0 : o));
    } catch (i) {
      return t;
    }
  }
  function Se() {
    const t = new Set();
    return {
      ['s'](i) {
        t.add(i);
      },
      ['n'](...i) {
        for (let o of t) o(...i);
      },
      ['u'](i) {
        t.delete(i);
      },
    };
  }
  function te() {
    const t = [],
      i = new Map(),
      o = (n, r) => n.get(r) ?? new Set(),
      a = new Map(),
      A = new Map(),
      L = new Map();
    let M = !1;
    function H(n, r, f) {
      const u = i.get(n) ?? T(r);
      f ? u.value : (u.value = r), i.set(n, u);
    }
    function Y(n) {
      const r = t.indexOf(n);
      if (r > -1) t.splice(r, 1);
    }
    function O(n) {
      const r = o(A, n);
      for (let f of r) f();
      A.delete(n);
    }
    function y(n) {
      const r = (f) => {
        const u = o(L, n);
        return u.add(f), L.set(n, u), f;
      };
      return (r.id = n), r;
    }
    function g(n) {
      const r = o(L, n);
      for (let f of r) {
        O(f), g(f);
        for (let u of a.keys()) {
          const E = a.get(u);
          if ((E.delete(f), E.size === 0)) a.delete(u);
        }
      }
      L.delete(n);
    }
    function T(n) {
      let r = !1;
      return {
        get value() {
          if (t[0]) a.set(this, o(a, this).add(t[0]));
          return n;
        },
        set value(f) {
          const u = f === n && f != null;
          if (((n = f), u)) return;
          const E = o(a, this),
            J = new Set([...E]);
          for (let c of E) {
            if (c === t[0]) {
              if (r) continue;
              r = !r;
            }
            if (J.has(c)) g(c), O(c), j(c);
          }
        },
      };
    }
    async function j(n) {
      t.unshift(n);
      const r = n(y(n));
      if (r?.then) await r;
      Y(n);
    }
    function D() {
      for (let n of A.keys()) O(n);
      A.clear(), a.clear(), L.clear(), X(!1);
    }
    function X(n = !0) {
      if (M === n) return;
      (M = n), le[n ? 's' : 'u'](H);
    }
    function e(n, r) {
      const f = o(A, r);
      f.add(n), A.set(r, f);
    }
    function s(n) {
      const r = T();
      return (
        j(() => {
          r.value = n();
        }),
        r
      );
    }
    const l = {
      ...G,
      setOptimistic(n, r, f) {
        const u = '__ind:' + n,
          E = '__o:' + r,
          J = l.get(r),
          c = f(J);
        l.set(u, !0),
          l.set(E, c),
          j(() => {
            if (!l.get(u) && l.get(r) === c) l.delete(E);
          });
      },
      get(n) {
        return X(), G.get('__o:' + n) ?? G.get(n);
      },
      has(n) {
        return l.get(n) !== void 0;
      },
    };
    function p(n) {
      const r = '__ind:' + n,
        f = s(() => !!l.get(r));
      return (f.id = r), (f.error = s(() => l.get('e' + r))), f;
    }
    return {
      state: T,
      store: l,
      effect: j,
      reset: D,
      cleanup: e,
      derived: s,
      indicate: p,
    };
  }
  function Ae(t) {
    let i = '';
    for (let o in t) {
      const a = B(o.replace(/([A-Z])/g, '-$1'));
      i += `${a}:${t[o]};`;
    }
    return i;
  }
  function _e(t, i = []) {
    const o = document,
      a = window,
      A = (e) => {
        if (e === !1) e = '';
        return o.createTextNode(
          (Array.isArray(e) ? e.join('') : e ?? '').toString(),
        );
      };
    a.fPath ??= (e) => {
      let s = e;
      {
        const { locales: p, locale: n, pages: r } = a.i18n,
          f = s.split(/\/|#|\?/)[1];
        s = p.includes(f) ? s : '/' + n + s;
      }
      const l = /\/(?=\?|#|$)/;
      if (((s = s.replace(/([^/])([?#])/, '$1/$2')), !s.match(l))) s += '/';
      return s;
    };
    const L = (e) => typeof e === 'object',
      M = (e) => e?.some?.(L),
      H = Array.from,
      Y = (e) => e instanceof CustomEvent,
      O = (e) => typeof e === 'function',
      y = (e) => e.startsWith('on'),
      g = (e, s) => e.appendChild(s),
      T = (e, s) => {
        return e === 'svg' ||
          (s?.namespaceURI === V && B(s.tagName) !== 'foreignobject')
          ? o.createElementNS(V, e)
          : o.createElement(e);
      },
      j = (e, s, l) => {
        const p = l === Ee,
          n = l === Le;
        let r = s === 'style' && L(l) ? Ae(l) : pe(l);
        const f =
          e.namespaceURI === V && (s.startsWith('xlink:') || s === 'href');
        if ((s === 'src' || s === 'href') && !URL.canParse(r)) {
          if (s === 'href') r = a.fPath(r);
        }
        if (s === se)
          if (l) e.classList.add(re);
          else e.classList.remove(re);
        else if (s === 'ref') l.value = e;
        else if (f)
          if (n) e.removeAttributeNS(ne, s);
          else e.setAttributeNS(ne, s, p ? '' : r);
        else if (n) e.removeAttribute(s);
        else e.setAttribute(s, p ? '' : r);
      },
      D = [],
      X = {};
    i.push(oe);
    for (let e of i) {
      const s = B(e);
      (X[s] = X[e] = e), D.push(s);
    }
    return class extends HTMLElement {
      p;
      l;
      s;
      static get observedAttributes() {
        return D;
      }
      static formAssociated = !0;
      async [q]() {
        const e = this,
          s =
            e.shadowRoot ??
            e.attachShadow({
              mode: 'open',
            }),
          l = [],
          p = [],
          n = new CSSStyleSheet(),
          r = [];
        for (let c of o.styleSheets)
          try {
            for (let b of c.cssRules) r.push(b.cssText);
          } catch (b) {
            r.push(`@import url('${c.href}');`);
          }
        n.replaceSync(r.join('')), s.adoptedStyleSheets.push(n);
        function f(c, b) {
          if (c?.type !== ve) return [c, b];
          const { element: _, target: v } = c.props;
          return [_, v];
        }
        async function u(c, b, _, v, P, N, h = !1) {
          if (_?.then) _ = await _;
          if (h) {
            if (e.shadowRoot) e.shadowRoot[Z] = '';
            if (p.length) {
              const S = T('style');
              N(() => {
                let w = '';
                for (let [m, ...R] of p)
                  w += String.raw(m, ...R.map((U) => (O(U) ? U() : U)));
                S.textContent = w;
              }),
                g(s, S);
            }
          }
          [_, v] = f(_, v);
          let d = c ? T(c, v) : v;
          for (let [S, w] of Object.entries(b)) {
            const m = y(S),
              R = S === se;
            if (m)
              d.addEventListener(B(S.slice(2)), (U) =>
                w.apply(null, Y(U) ? U.detail : [U]),
              );
            else if (R || (!m && O(w))) N(P(() => j(d, S, R ? w?.value : w())));
            else j(d, S, w);
          }
          if (_?.type === x) d[Z] += _.props.html;
          else if (_ === W) g(d, T(W));
          else if (M(_))
            if (M(_[0])) for (let S of _) u(F, {}, S, d, P, N);
            else u(..._, d, P, N);
          else if (O(_)) {
            let S;
            const w = (m) => {
              if (S && d.contains(S[0])) {
                d.insertBefore(m, S[0]);
                for (let R of S) R?.remove();
              } else g(d, m);
            };
            N(
              P((m) => {
                const R = _();
                function U(I) {
                  [I, d] = f(I, d);
                  const Q = I?.type === x;
                  if (Q || M(I)) {
                    const K = H(d.childNodes),
                      z = o.createDocumentFragment();
                    if (Q) {
                      const C = T('p');
                      C[Z] += I.props.html;
                      for (let de of H(C.childNodes)) g(z, de);
                    } else if (M(I[0]))
                      for (let C of I) u(F, {}, C, z, P(m), N);
                    else if (I.length) u(...I, z, P(m), N);
                    w(z), (S = H(d.childNodes).filter((C) => !K.includes(C)));
                  } else {
                    const K = A(I);
                    w(K), (S = [K]);
                  }
                }
                if (R instanceof Promise) R.then(U);
                else U(R);
              }),
            );
          } else g(d, A(_));
          if (c) g(v, d);
        }
        const E = (c, b, _ = te(), v = fe) => {
            (e.s = _), (e[v] = {});
            for (let h of i)
              e[v][X[h]] = y(h) ? e.e(h) : _.state(ee(e.getAttribute(h)));
            const P = {
                children: [W, {}, F],
                ...e[v],
                ...b,
              },
              N = {
                ..._,
                onMount(h) {
                  l.push(h);
                },
                useContext(h) {
                  return _.derived(() => {
                    const d = he(e, h.id);
                    return d
                      ? _.store.get(`${Ne}:${h.id}:${d}`)
                      : h.defaultValue;
                  });
                },
                css(h, ...d) {
                  p.push([h, ...d]);
                },
                i18n: a.i18n,
                route: a.r,
                self: e,
              };
            for (let h of a._P) Object.assign(N, h(N));
            return (p.length = 0), u(F, {}, c(P, N), s, (h) => h, _.effect, !0);
          },
          J = te();
        try {
          if (O(t.suspense)) await E(t.suspense, F, J, k);
          await E(t), J.reset(), delete e[k];
        } catch (c) {
          if ((J.reset(), e.s.reset(), O(t.error)))
            E(t.error, {
              error: e.s.state(c),
            });
          else throw c;
        }
        for (let c of l) c();
      }
      [ie]() {
        this.s?.reset();
      }
      e(e) {
        return (...s) => {
          const l = new CustomEvent(B(e.slice(2)), {
            detail: Y(s?.[0]) ? s[0].detail : s,
          });
          this.dispatchEvent(l);
        };
      }
      attributeChangedCallback(e, s, l) {
        const p = this,
          n = p[k] ? k : fe;
        if (e === oe && s != F && s !== l) p[ie](), p[q]();
        if (p[n] && s !== l && !y(e)) p[n][X[e]].value = ee(l);
      }
    };
  }
  var $ = window,
    G = ($._s ??= {
      Map: new Map(),
    });
  for (let [t, i] of $._S ?? []) G.Map.set(t, i);
  var le = ($.sub ??= Se());
  for (let t of ['get', 'set', 'delete'])
    G[t] = (i, o) => {
      const a = G.Map[t](i, o);
      return le.n(i, o, t === 'get'), a;
    };
  var B = (t) => t.toLowerCase(),
    Ee = Symbol('on'),
    Le = Symbol('off'),
    ce = 'http://www.w3.org/',
    V = ce + '2000/svg',
    ne = ce + '1999/xlink',
    x = 'HTML',
    se = 'indicator',
    re = 'brisa-request',
    ve = 'portal',
    W = 'slot',
    oe = 'key',
    q = 'connectedCallback',
    ie = 'dis' + q,
    Z = 'inner' + x,
    fe = 'p',
    k = 'l',
    F = null,
    Ne = 'context';
  function we(t, { state: i, css: c }) {
    c`button{padding:10px!important;border:1px solid var(--shadow-color)!important; margin:5px!important;border-radius:5px!important;}`;
    const o = i(t.start.value || 0);
    return [
      null,
      {},
      [
        [
          'div',
          {},
          [
            [null, {}, 'Counter: '],
            [null, {}, () => o.value],
          ],
        ],
        [
          'button',
          {
            onClick: () => o.value++,
          },
          'Increment',
        ],
        [
          'button',
          {
            onClick: () => o.value--,
          },
          'Decrement',
        ],
      ],
    ];
  }
  var ae = _e(we, ['start']);
  var ue = [
    (t) => {
      return (
        (t.store.sync = (i, o = 'localStorage') => {
          if (typeof window === 'undefined') return;
          const a = (A) => {
            if (A && A.key !== i) return;
            const L = window[o].getItem(i);
            if (L != null) t.store.set(i, JSON.parse(L));
          };
          t.effect(() => {
            window.addEventListener('storage', a),
              t.cleanup(() => window.removeEventListener('storage', a));
          }),
            t.effect(() => {
              const A = t.store.get(i);
              if (A != null) window[o].setItem(i, JSON.stringify(A));
            }),
            a();
        }),
        t
      );
    },
  ];
  window._P = ue;
  var me = (t, i) => t && !customElements.get(t) && customElements.define(t, i);
  me('custom-counter', ae);
})();
