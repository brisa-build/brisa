import type { Type, Props } from '@/types';

const Fragment = (props: Props) => props.children;
const createNode = (type: Type, props: Props, key: string) => {
  Object.assign(props, { key });
  return { type, props };
};

Fragment.__isFragment = true;

export { createNode as jsx, createNode as jsxs, createNode as jsxDEV, Fragment };
