import { ESTree } from "meriyah";
import wrapWithArrowFn from "../wrap-with-arrow-fn";
import transformToReactiveProps, {
  transformToReactivePropsForInnerTags,
} from "../transform-to-reactive-props";

export default function getReactiveReturnStatement(
  componentBody: ESTree.Statement[],
  componentParams: ESTree.Parameter[],
  propsNames: string[],
  hyperScriptVarName: string,
) {
  const returnStatementIndex = componentBody.findIndex(
    (node: any) => node.type === "ReturnStatement",
  );
  const returnStatement = componentBody[returnStatementIndex] as any;
  let [tagName, props, children] = returnStatement?.argument?.elements ?? [];
  let componentChildren = transformToReactiveProps(children, {
    componentParams,
    propsNames,
  });

  // Transforming:
  //  "return conditional ? ['div', {}, ''] : ['span', {}, '']"
  // to:
  //  "return h(null, {}, () => conditional ? ['div', {}, ''] : ['span', {}, ''])"
  if (returnStatement?.argument?.type === "ConditionalExpression") {
    tagName = {
      type: "Literal",
      value: null,
    };
    props = {
      type: "ObjectExpression",
      properties: [],
    };
    componentChildren = wrapWithArrowFn({
      type: "ConditionalExpression",
      test: transformToReactiveProps(returnStatement.argument.test, {
        componentParams,
        propsNames,
        applyArrowFn: false,
      }),
      consequent: transformToReactiveProps(
        returnStatement.argument.consequent,
        { componentParams, propsNames },
      ),
      alternate: transformToReactiveProps(returnStatement.argument.alternate, {
        componentParams,
        propsNames,
      }),
    });
  }

  // Transforming:
  //  "(props) => ['div', { foo: props.bar }, '']"
  // to
  //  "return ['div', { foo: () => props.bar.value }, '']"
  else if (
    !returnStatement &&
    componentBody.length === 1 &&
    componentBody[0]?.type === "VariableDeclaration" &&
    componentBody[0]?.declarations[0]?.init?.type ===
      "ArrowFunctionExpression" &&
    componentBody[0]?.declarations[0]?.init?.body?.type !== "BlockStatement"
  ) {
    const elements =
      componentBody[0]?.declarations[0]?.init?.body?.elements ?? [];
    tagName = {
      type: "Literal",
      value: elements[0]?.value ?? null,
    };
    props = {
      type: "ObjectExpression",
      properties: (elements[1]?.properties ?? []).map((property: any) => ({
        ...property,
        value: transformToReactiveProps(property.value, {
          componentParams,
          propsNames,
        }),
      })),
    };
    componentChildren = transformToReactiveProps(
      {
        type: "Literal",
        value: elements[2]?.value ?? "",
      },
      { componentParams, propsNames },
    );
  }

  // Cases that the component return a literal, ex: return "foo"
  else if (
    !tagName &&
    !props &&
    !componentChildren &&
    (returnStatement?.argument == null ||
      returnStatement?.argument?.type === "Literal")
  ) {
    tagName = {
      type: "Literal",
      value: null,
    };
    props = {
      type: "ObjectExpression",
      properties: [],
    };
    componentChildren = {
      type: "Literal",
      value: returnStatement?.argument?.value ?? "",
    };
  }

  const newReturnStatement = {
    type: "ReturnStatement",
    argument: {
      type: "CallExpression",
      callee: {
        type: "Identifier",
        name: hyperScriptVarName,
      },
      arguments: [
        tagName,
        props,
        transformToReactivePropsForInnerTags(componentChildren, {
          componentParams,
          propsNames,
        }),
      ],
    },
  };

  return [newReturnStatement, returnStatementIndex];
}
