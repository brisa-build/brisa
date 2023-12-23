import { ESTree } from "meriyah";
import getConstants from "../../../constants";
import { JSX_NAME, NO_REACTIVE_CHILDREN_EXPRESSION } from "../constants";
import wrapWithArrowFn from "../wrap-with-arrow-fn";
import { logError, logWarning } from "../../log/log-build";

const SIGNAL_PROPERTIES = new Set(["value", "get"]);

export default function transformToReactiveArrays(
  ast: ESTree.Program,
  path?: string,
) {
  const { BOOLEANS_IN_HTML } = getConstants();

  return JSON.parse(
    JSON.stringify(ast, (key, value) => {
      if (
        value?.type !== "CallExpression" ||
        !JSX_NAME.has(value?.callee?.name ?? "")
      ) {
        return value;
      }

      if (
        value.arguments[0].type === "Identifier" &&
        value.arguments[0].name !== "Fragment"
      ) {
        const errorMessages = [
          `You can't use "${value.arguments[0].name}" variable as a tag name.`,
          `Please use a string instead. You cannot use server-components inside web-components directly.`,
          `You must use the "children" or slots in conjunction with the events to communicate with the server-components.`,
        ];

        if (path) errorMessages.push(`File: ${path}`);

        logError(
          errorMessages,
          "Docs: https://brisa.build/docs/component-details/web-components",
        );
      }

      const tagName = value.arguments[0].value ?? null;
      const props = value.arguments[1].properties;
      const restOfProps = [];
      let children: any = [];

      // Add "key" prop if it exists
      if (value.arguments[2] && value.arguments[2]?.name !== "undefined") {
        restOfProps.push({
          type: "Property",
          key: {
            type: "Identifier",
            name: "key",
          },
          value: value.arguments[2],
          shorthand: false,
          computed: false,
          method: false,
          kind: "init",
          extra: {
            shorthand: false,
          },
        });
      }

      for (let prop of props) {
        const name = prop.key?.name ?? prop.key?.object?.name;

        if (name === "children" || prop?.key?.value === "children") {
          children = prop.key.value ?? prop.value;
          continue;
        }

        if (prop?.type === "SpreadElement") {
          const warnMessages = [
            `You can't use spread props inside web-components JSX.`,
            `This can cause the lost of reactivity.`,
          ];

          if (path) warnMessages.push(`File: ${path}`);

          logWarning(
            warnMessages,
            "Docs: https://brisa.build/docs/component-details/web-components",
          );
        }

        // <div open={true} /> -> <div open />
        if (BOOLEANS_IN_HTML.has(name)) {
          prop.shorthand = false;

          if (typeof prop.value?.value === "boolean") {
            prop.value = {
              type: "Identifier",
              name: prop.value.value ? "_on" : "_off",
            };
          } else {
            prop.value = {
              type: "ConditionalExpression",
              test: prop.value,
              consequent: {
                type: "Identifier",
                name: "_on",
              },
              alternate: {
                type: "Identifier",
                name: "_off",
              },
            };
          }
        }

        const isPropAnEvent = name?.startsWith("on");

        value =
          isPropAnEvent || !hasNodeASignal(prop.value, true)
            ? prop.value
            : wrapWithArrowFn(prop.value);

        restOfProps.push({ ...prop, value });
      }

      // Transform: <div><span />{someVar ? <b /> : <i />}</div>
      // to: ["div", {}, [['span', {}, ''], [null, {}, () => someVar.value ? ["b", {}, ""] : ["i", {}, ""]]]
      if (children.type === "ArrayExpression") {
        children.elements = children.elements.map((el: any) => {
          if (JSX_NAME.has(el.callee?.name)) return el;
          return {
            type: "ArrayExpression",
            elements: [
              {
                type: "Literal",
                value: null,
              },
              {
                type: "ObjectExpression",
                properties: {},
              },
              hasNodeASignal(el) ? wrapWithArrowFn(el) : el,
            ],
          };
        });
      }

      // <div>{someVar.value}</div> -> ["div", {}, () => someVar.value]
      if (hasNodeASignal(children)) children = wrapWithArrowFn(children);

      // <span></span> -> ["span", {}, ""]
      if (Array.isArray(children) && children.length === 0) {
        children = {
          type: "Literal",
          value: "",
        };
      }

      return {
        type: "ArrayExpression",
        elements: [
          {
            type: "Literal",
            value: tagName,
          },
          {
            type: "ObjectExpression",
            properties: tagName == null ? {} : restOfProps,
          },
          children,
        ],
      };
    }),
  ) as ESTree.Program;
}

function hasNodeASignal(node: ESTree.Node, allowProperties = false) {
  let hasSignal = false;

  if (NO_REACTIVE_CHILDREN_EXPRESSION.has(node?.type)) return hasSignal;

  JSON.stringify(node, (key, value) => {
    if (!allowProperties && value?.type === "Property") return null;

    hasSignal ||=
      value?.type === "MemberExpression" &&
      value?.object?.type === "Identifier" &&
      value?.property?.type === "Identifier" &&
      SIGNAL_PROPERTIES.has(value?.property?.name);

    return value;
  });

  return hasSignal;
}
