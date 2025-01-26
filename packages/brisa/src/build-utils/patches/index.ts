// Allow stringify correctly BigInt values during the build
// @ts-ignore
BigInt.prototype.toJSON = function () {
  // @ts-ignore
  return JSON.rawJSON(this)
};
