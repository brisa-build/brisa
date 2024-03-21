// @bun
var b = function (i, _) {
  return { type: i, props: _ };
};
function u() {
  return b("div", { children: "hello world" }, void 0, !1, void 0, this);
}
var a = (i) => i.children;
a.__isFragment = !0;
export { u as default };
