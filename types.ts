export interface Props {
  [key: string]: any;
  children?: JSXNode;
}

export type JSXNode = string | number | JSXElement;

export interface JSXElement {
  type: string | JSXComponent;
  props: Props;
}

export type JSXComponent = (props: Props) => JSXNode;