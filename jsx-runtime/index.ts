function Fragment(props) {
  return props.children;
}

function createNode(type, props, key, __source, __self) {
  return {
    type,
    props,
    key,
    ref: props?.ref,
    __source,
    __self
  };
}

export {
  createNode as jsx,
  createNode as jsxs,
  createNode as jsxDEV,
  Fragment
};
