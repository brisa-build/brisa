const transpiler = new Bun.Transpiler({ loader: 'tsx' });

export function fnToHref(fn: Function, params: unknown) {
  return `javascript:${encodeURIComponent(transpiler.transformSync(fn.toString()))}${fn.name}(${encodeURIComponent(JSON.stringify(params))})`;
}
