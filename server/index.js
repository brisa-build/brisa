// @bun
var z = (c) => c.replace(/\s*\n\s*/g, "");
var E = (c) => c.children,
  A = (c, S) => ({ type: c, props: S });
E.__isFragment = !0;
var q = () => {};
function B({ Component: c, selector: S, ...w }) {
  let k = "";
  return A(
    S,
    {
      ...w,
      children: A(
        "template",
        {
          shadowrootmode: "open",
          children: [
            c(w, {
              state: (h) => ({ value: h }),
              effect: q,
              onMount: q,
              derived: (h) => ({ value: h() }),
              cleanup: q,
              css: (h, ...D) => {
                k += h[0] + D.join("");
              },
            }),
            k.length > 0 &&
              A("style", { children: z(k) }, void 0, !1, void 0, this),
          ],
        },
        void 0,
        !0,
        void 0,
        this
      ),
    },
    void 0,
    !1,
    void 0,
    this
  );
}
export { B as SSRWebComponent };
