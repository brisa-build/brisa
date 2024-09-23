function S(x) {
  return G[x];
}
function Z(x) {
  if (x < 132) return;
  (G[x] = M), (M = x);
}
function F(x) {
  const w = S(x);
  return Z(x), w;
}
function O() {
  if (L === null || L.byteLength === 0) L = new Uint8Array(z.memory.buffer);
  return L;
}
function N(x, w, y) {
  if (y === void 0) {
    const B = P.encode(x),
      H = w(B.length, 1) >>> 0;
    return (
      O()
        .subarray(H, H + B.length)
        .set(B),
      (J = B.length),
      H
    );
  }
  let f = x.length,
    C = w(f, 1) >>> 0;
  const A = O();
  let q = 0;
  for (; q < f; q++) {
    const B = x.charCodeAt(q);
    if (B > 127) break;
    A[C + q] = B;
  }
  if (q !== f) {
    if (q !== 0) x = x.slice(q);
    C = y(C, f, (f = q + x.length * 3), 1) >>> 0;
    const B = O().subarray(C + q, C + f),
      H = $(x, B);
    (q += H.written), (C = y(C, f, q, 1) >>> 0);
  }
  return (J = q), C;
}
function K(x) {
  return x === void 0 || x === null;
}
function D() {
  if (
    I === null ||
    I.buffer.detached === !0 ||
    (I.buffer.detached === void 0 && I.buffer !== z.memory.buffer)
  )
    I = new DataView(z.memory.buffer);
  return I;
}
function Q(x, w) {
  return (x = x >>> 0), V.decode(O().subarray(x, x + w));
}
function k(x) {
  if (M === G.length) G.push(G.length + 1);
  const w = M;
  return (M = G[w]), (G[w] = x), w;
}
function R(x) {
  const w = typeof x;
  if (w == 'number' || w == 'boolean' || x == null) return `${x}`;
  if (w == 'string') return `"${x}"`;
  if (w == 'symbol') {
    const C = x.description;
    if (C == null) return 'Symbol';
    else return `Symbol(${C})`;
  }
  if (w == 'function') {
    const C = x.name;
    if (typeof C == 'string' && C.length > 0) return `Function(${C})`;
    else return 'Function';
  }
  if (Array.isArray(x)) {
    const C = x.length;
    let A = '[';
    if (C > 0) A += R(x[0]);
    for (let q = 1; q < C; q++) A += ', ' + R(x[q]);
    return (A += ']'), A;
  }
  const y = /\[object ([^\]]+)\]/.exec(toString.call(x));
  let f;
  if (y.length > 1) f = y[1];
  else return toString.call(x);
  if (f == 'Object')
    try {
      return 'Object(' + JSON.stringify(x) + ')';
    } catch (C) {
      return 'Object';
    }
  if (x instanceof Error) return `${x.name}: ${x.message}\n${x.stack}`;
  return f;
}
function c(x, w, y, f) {
  const C = { a: x, b: w, cnt: 1, dtor: y },
    A = (...q) => {
      C.cnt++;
      const B = C.a;
      C.a = 0;
      try {
        return f(B, C.b, ...q);
      } finally {
        if (--C.cnt === 0)
          z.__wbindgen_export_2.get(C.dtor)(B, C.b), T.unregister(C);
        else C.a = B;
      }
    };
  return (A.original = C), T.register(A, C, C), A;
}
function j(x, w, y) {
  z.__wbindgen_export_3(x, w, k(y));
}
function W(x, w, y) {
  try {
    const q = z.__wbindgen_add_to_stack_pointer(-16);
    z.transformSync(q, k(x), k(w), k(y));
    var f = D().getInt32(q + 0, !0),
      C = D().getInt32(q + 4, !0),
      A = D().getInt32(q + 8, !0);
    if (A) throw F(C);
    return F(f);
  } finally {
    z.__wbindgen_add_to_stack_pointer(16);
  }
}
function U(x, w) {
  if (x === 0) return S(w);
  else return Q(x, w);
}
function E(x, w) {
  try {
    return x.apply(this, w);
  } catch (y) {
    z.__wbindgen_export_5(k(y));
  }
}
function v(x, w, y, f) {
  z.__wbindgen_export_6(x, w, k(y), k(f));
}
async function b(x, w) {
  if (typeof Response === 'function' && x instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === 'function')
      try {
        return await WebAssembly.instantiateStreaming(x, w);
      } catch (f) {
        if (x.headers.get('Content-Type') != 'application/wasm')
          console.warn(
            '`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n',
            f,
          );
        else throw f;
      }
    const y = await x.arrayBuffer();
    return await WebAssembly.instantiate(y, w);
  } else {
    const y = await WebAssembly.instantiate(x, w);
    if (y instanceof WebAssembly.Instance) return { instance: y, module: x };
    else return y;
  }
}
function n() {
  const x = {};
  return (
    (x.wbg = {}),
    (x.wbg.__wbindgen_object_drop_ref = function (w) {
      F(w);
    }),
    (x.wbg.__wbindgen_string_get = function (w, y) {
      const f = S(y),
        C = typeof f === 'string' ? f : void 0;
      var A = K(C) ? 0 : N(C, z.__wbindgen_export_0, z.__wbindgen_export_1),
        q = J;
      D().setInt32(w + 4, q, !0), D().setInt32(w + 0, A, !0);
    }),
    (x.wbg.__wbindgen_jsval_loose_eq = function (w, y) {
      return S(w) == S(y);
    }),
    (x.wbg.__wbindgen_is_string = function (w) {
      return typeof S(w) === 'string';
    }),
    (x.wbg.__wbindgen_is_object = function (w) {
      const y = S(w);
      return typeof y === 'object' && y !== null;
    }),
    (x.wbg.__wbg_entries_7a0e06255456ebcd = function (w) {
      const y = Object.entries(S(w));
      return k(y);
    }),
    (x.wbg.__wbg_length_ae22078168b726f5 = function (w) {
      return S(w).length;
    }),
    (x.wbg.__wbg_get_3baa728f9d58d3f6 = function (w, y) {
      const f = S(w)[y >>> 0];
      return k(f);
    }),
    (x.wbg.__wbg_getwithrefkey_15c62c2b8546208d = function (w, y) {
      const f = S(w)[S(y)];
      return k(f);
    }),
    (x.wbg.__wbindgen_is_undefined = function (w) {
      return S(w) === void 0;
    }),
    (x.wbg.__wbindgen_in = function (w, y) {
      return S(w) in S(y);
    }),
    (x.wbg.__wbg_new_525245e2b9901204 = function () {
      const w = new Object();
      return k(w);
    }),
    (x.wbg.__wbindgen_string_new = function (w, y) {
      const f = Q(w, y);
      return k(f);
    }),
    (x.wbg.__wbg_set_20cbc34131e76824 = function (w, y, f) {
      S(w)[F(y)] = F(f);
    }),
    (x.wbg.__wbg_new_a220cf903aa02ca2 = function () {
      const w = new Array();
      return k(w);
    }),
    (x.wbg.__wbg_set_673dda6c73d19609 = function (w, y, f) {
      S(w)[y >>> 0] = F(f);
    }),
    (x.wbg.__wbg_set_49185437f0ab06f8 = function (w, y, f) {
      const C = S(w).set(S(y), S(f));
      return k(C);
    }),
    (x.wbg.__wbindgen_number_new = function (w) {
      return k(w);
    }),
    (x.wbg.__wbg_new_8608a2b51a5f6737 = function () {
      return k(new Map());
    }),
    (x.wbg.__wbindgen_boolean_get = function (w) {
      const y = S(w);
      return typeof y === 'boolean' ? (y ? 1 : 0) : 2;
    }),
    (x.wbg.__wbindgen_is_bigint = function (w) {
      return typeof S(w) === 'bigint';
    }),
    (x.wbg.__wbindgen_number_get = function (w, y) {
      const f = S(y),
        C = typeof f === 'number' ? f : void 0;
      D().setFloat64(w + 8, K(C) ? 0 : C, !0), D().setInt32(w + 0, !K(C), !0);
    }),
    (x.wbg.__wbg_isArray_8364a5371e9737d8 = function (w) {
      return Array.isArray(S(w));
    }),
    (x.wbg.__wbg_isSafeInteger_7f1ed56200d90674 = function (w) {
      return Number.isSafeInteger(S(w));
    }),
    (x.wbg.__wbg_iterator_888179a48810a9fe = function () {
      return k(Symbol.iterator);
    }),
    (x.wbg.__wbindgen_bigint_get_as_i64 = function (w, y) {
      const f = S(y),
        C = typeof f === 'bigint' ? f : void 0;
      D().setBigInt64(w + 8, K(C) ? BigInt(0) : C, !0),
        D().setInt32(w + 0, !K(C), !0);
    }),
    (x.wbg.__wbindgen_bigint_from_i64 = function (w) {
      return k(w);
    }),
    (x.wbg.__wbindgen_jsval_eq = function (w, y) {
      return S(w) === S(y);
    }),
    (x.wbg.__wbindgen_bigint_from_u64 = function (w) {
      const y = BigInt.asUintN(64, w);
      return k(y);
    }),
    (x.wbg.__wbg_next_f9cb570345655b9a = function () {
      return E(function (w) {
        const y = S(w).next();
        return k(y);
      }, arguments);
    }),
    (x.wbg.__wbg_done_bfda7aa8f252b39f = function (w) {
      return S(w).done;
    }),
    (x.wbg.__wbg_value_6d39332ab4788d86 = function (w) {
      const y = S(w).value;
      return k(y);
    }),
    (x.wbg.__wbg_new_b85e72ed1bfd57f9 = function (w, y) {
      try {
        var f = { a: w, b: y },
          C = (q, B) => {
            const H = f.a;
            f.a = 0;
            try {
              return v(H, f.b, q, B);
            } finally {
              f.a = H;
            }
          };
        const A = new Promise(C);
        return k(A);
      } finally {
        f.a = f.b = 0;
      }
    }),
    (x.wbg.__wbindgen_is_null = function (w) {
      return S(w) === null;
    }),
    (x.wbg.__wbg_set_f975102236d3c502 = function (w, y, f) {
      S(w)[F(y)] = F(f);
    }),
    (x.wbg.__wbg_call_89af060b4e1523f2 = function () {
      return E(function (w, y, f) {
        const C = S(w).call(S(y), S(f));
        return k(C);
      }, arguments);
    }),
    (x.wbg.__wbindgen_error_new = function (w, y) {
      const f = new Error(Q(w, y));
      return k(f);
    }),
    (x.wbg.__wbg_new_abda76e883ba8a5f = function () {
      const w = new Error();
      return k(w);
    }),
    (x.wbg.__wbg_stack_658279fe44541cf6 = function (w, y) {
      const f = S(y).stack,
        C = N(f, z.__wbindgen_export_0, z.__wbindgen_export_1),
        A = J;
      D().setInt32(w + 4, A, !0), D().setInt32(w + 0, C, !0);
    }),
    (x.wbg.__wbg_error_f851667af71bcfc6 = function (w, y) {
      var f = U(w, y);
      if (w !== 0) z.__wbindgen_export_4(w, y, 1);
      console.error(f);
    }),
    (x.wbg.__wbindgen_object_clone_ref = function (w) {
      const y = S(w);
      return k(y);
    }),
    (x.wbg.__wbg_crypto_1d1f22824a6a080c = function (w) {
      const y = S(w).crypto;
      return k(y);
    }),
    (x.wbg.__wbg_process_4a72847cc503995b = function (w) {
      const y = S(w).process;
      return k(y);
    }),
    (x.wbg.__wbg_versions_f686565e586dd935 = function (w) {
      const y = S(w).versions;
      return k(y);
    }),
    (x.wbg.__wbg_node_104a2ff8d6ea03a2 = function (w) {
      const y = S(w).node;
      return k(y);
    }),
    (x.wbg.__wbg_require_cca90b1a94a0255b = function () {
      return E(function () {
        const w = d.require;
        return k(w);
      }, arguments);
    }),
    (x.wbg.__wbindgen_is_function = function (w) {
      return typeof S(w) === 'function';
    }),
    (x.wbg.__wbg_msCrypto_eb05e62b530a1508 = function (w) {
      const y = S(w).msCrypto;
      return k(y);
    }),
    (x.wbg.__wbg_newwithlength_ec548f448387c968 = function (w) {
      const y = new Uint8Array(w >>> 0);
      return k(y);
    }),
    (x.wbg.__wbindgen_memory = function () {
      const w = z.memory;
      return k(w);
    }),
    (x.wbg.__wbg_buffer_b7b08af79b0b0974 = function (w) {
      const y = S(w).buffer;
      return k(y);
    }),
    (x.wbg.__wbg_newwithbyteoffsetandlength_8a2cb9ca96b27ec9 = function (
      w,
      y,
      f,
    ) {
      const C = new Uint8Array(S(w), y >>> 0, f >>> 0);
      return k(C);
    }),
    (x.wbg.__wbg_randomFillSync_5c9c955aa56b6049 = function () {
      return E(function (w, y) {
        S(w).randomFillSync(F(y));
      }, arguments);
    }),
    (x.wbg.__wbg_subarray_7c2e3576afe181d1 = function (w, y, f) {
      const C = S(w).subarray(y >>> 0, f >>> 0);
      return k(C);
    }),
    (x.wbg.__wbg_getRandomValues_3aa56aa6edec874c = function () {
      return E(function (w, y) {
        S(w).getRandomValues(S(y));
      }, arguments);
    }),
    (x.wbg.__wbg_new_ea1883e1e5e86686 = function (w) {
      const y = new Uint8Array(S(w));
      return k(y);
    }),
    (x.wbg.__wbg_set_d1e79e2388520f18 = function (w, y, f) {
      S(w).set(S(y), f >>> 0);
    }),
    (x.wbg.__wbg_get_224d16597dbbfd96 = function () {
      return E(function (w, y) {
        const f = Reflect.get(S(w), S(y));
        return k(f);
      }, arguments);
    }),
    (x.wbg.__wbg_call_1084a111329e68ce = function () {
      return E(function (w, y) {
        const f = S(w).call(S(y));
        return k(f);
      }, arguments);
    }),
    (x.wbg.__wbg_next_de3e9db4440638b2 = function (w) {
      const y = S(w).next;
      return k(y);
    }),
    (x.wbg.__wbg_length_8339fcf5d8ecd12e = function (w) {
      return S(w).length;
    }),
    (x.wbg.__wbg_self_3093d5d1f7bcb682 = function () {
      return E(function () {
        const w = self.self;
        return k(w);
      }, arguments);
    }),
    (x.wbg.__wbg_window_3bcfc4d31bc012f8 = function () {
      return E(function () {
        const w = window.window;
        return k(w);
      }, arguments);
    }),
    (x.wbg.__wbg_globalThis_86b222e13bdf32ed = function () {
      return E(function () {
        const w = globalThis.globalThis;
        return k(w);
      }, arguments);
    }),
    (x.wbg.__wbg_global_e5a3fe56f8be9485 = function () {
      return E(function () {
        const w = global.global;
        return k(w);
      }, arguments);
    }),
    (x.wbg.__wbg_newnoargs_76313bd6ff35d0f2 = function (w, y) {
      var f = U(w, y);
      const C = new Function(f);
      return k(C);
    }),
    (x.wbg.__wbg_instanceof_Uint8Array_247a91427532499e = function (w) {
      let y;
      try {
        y = S(w) instanceof Uint8Array;
      } catch (C) {
        y = !1;
      }
      return y;
    }),
    (x.wbg.__wbg_instanceof_ArrayBuffer_61dfc3198373c902 = function (w) {
      let y;
      try {
        y = S(w) instanceof ArrayBuffer;
      } catch (C) {
        y = !1;
      }
      return y;
    }),
    (x.wbg.__wbg_String_91fba7ded13ba54c = function (w, y) {
      const f = String(S(y)),
        C = N(f, z.__wbindgen_export_0, z.__wbindgen_export_1),
        A = J;
      D().setInt32(w + 4, A, !0), D().setInt32(w + 0, C, !0);
    }),
    (x.wbg.__wbindgen_debug_string = function (w, y) {
      const f = R(S(y)),
        C = N(f, z.__wbindgen_export_0, z.__wbindgen_export_1),
        A = J;
      D().setInt32(w + 4, A, !0), D().setInt32(w + 0, C, !0);
    }),
    (x.wbg.__wbindgen_throw = function (w, y) {
      throw new Error(Q(w, y));
    }),
    (x.wbg.__wbg_queueMicrotask_48421b3cc9052b68 = function (w) {
      const y = S(w).queueMicrotask;
      return k(y);
    }),
    (x.wbg.__wbg_resolve_570458cb99d56a43 = function (w) {
      const y = Promise.resolve(S(w));
      return k(y);
    }),
    (x.wbg.__wbindgen_cb_drop = function (w) {
      const y = F(w).original;
      if (y.cnt-- == 1) return (y.a = 0), !0;
      return !1;
    }),
    (x.wbg.__wbg_then_95e6edc0f89b73b1 = function (w, y) {
      const f = S(w).then(S(y));
      return k(f);
    }),
    (x.wbg.__wbg_queueMicrotask_12a30234db4045d3 = function (w) {
      queueMicrotask(S(w));
    }),
    (x.wbg.__wbindgen_closure_wrapper16750 = function (w, y, f) {
      const C = c(w, y, 985, j);
      return k(C);
    }),
    x
  );
}
function h(x, w) {}
function _(x, w) {
  return (
    (z = x.exports), (X.__wbindgen_wasm_module = w), (I = null), (L = null), z
  );
}
async function X(x) {
  if (z !== void 0) return z;
  if (typeof x !== 'undefined' && Object.getPrototypeOf(x) === Object.prototype)
    ({ module_or_path: x } = x);
  else
    console.warn(
      'using deprecated parameters for the initialization function; pass a single object instead',
    );
  if (typeof x === 'undefined') x = new URL('wasm_bg.wasm', import.meta.url);
  const w = n();
  if (
    typeof x === 'string' ||
    (typeof Request === 'function' && x instanceof Request) ||
    (typeof URL === 'function' && x instanceof URL)
  )
    x = fetch(x);
  h(w);
  const { instance: y, module: f } = await b(await x, w);
  return _(y, f);
}
var z,
  G = new Array(128).fill(void 0);
G.push(void 0, null, !0, !1);
var M = G.length,
  J = 0,
  L = null,
  P =
    typeof TextEncoder !== 'undefined'
      ? new TextEncoder('utf-8')
      : {
          encode: () => {
            throw Error('TextEncoder not available');
          },
        },
  $ =
    typeof P.encodeInto === 'function'
      ? function (x, w) {
          return P.encodeInto(x, w);
        }
      : function (x, w) {
          const y = P.encode(x);
          return w.set(y), { read: x.length, written: y.length };
        },
  I = null,
  V =
    typeof TextDecoder !== 'undefined'
      ? new TextDecoder('utf-8', { ignoreBOM: !0, fatal: !0 })
      : {
          decode: () => {
            throw Error('TextDecoder not available');
          },
        };
if (typeof TextDecoder !== 'undefined') V.decode();
var T =
  typeof FinalizationRegistry === 'undefined'
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((x) => {
        z.__wbindgen_export_2.get(x.dtor)(x.a, x.b);
      });
var Y = X;
Y();
window.transformCode = async (x) => {
  return W(x, {
    filename: 'index.tsx',
    jsc: { parser: { syntax: 'typescript', tsx: !0 } },
    module: { type: 'es6' },
  }).code;
};
