import { ESTree } from "meriyah";

const COMPONENT_STATICS = new Set(["error", "suspense"]);
const FUNCTION_ESXPRESSION_TYPES = new Set([
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

export default function mapComponentStatics(
  ast: ESTree.Program,
  componentName: string,
  mapFn: (
    value: ESTree.FunctionDeclaration,
    name: "suspense" | "error"
  ) => ESTree.FunctionDeclaration
) {
  const identifiers = new Map<string, "suspense" | "error">();

  return JSON.parse(
    // Traversing A to B
    JSON.stringify(ast, function (key, value) {
      if (
        isComponentProperty(value) &&
        value?.left?.object?.name === componentName
      ) {
        if (value.right.type === "Identifier") {
          identifiers.set(value.right.name, value?.left?.property?.name);
          return value;
        }
        value.right = mapFn(value.right, value?.left?.property?.name);
      }

      if (isFromObjectAssign(value)) {
        for (const argument of value.arguments) {
          for (const property of argument?.properties ?? []) {
            if (!COMPONENT_STATICS.has(property?.key?.name)) continue;
            if (property.value.type === "Identifier") {
              identifiers.set(property.value.name, property?.key?.name);
            } else {
              property.value = mapFn(property.value, property?.key?.name);
            }
          }
        }
      }

      return value;
    }),
    // Traversing B to A
    function (key, value) {
      const parent = this;

      if (isDetectedIdentifier(value, parent, identifiers)) {
        parent.init = mapFn(parent.init, identifiers.get(value.name)!);
      }

      return value;
    }
  );
}

function isComponentProperty(value: any) {
  return (
    value?.type === "AssignmentExpression" &&
    value?.left?.type === "MemberExpression" &&
    COMPONENT_STATICS.has(value?.left?.property?.name)
  );
}

function isFromObjectAssign(value: any) {
  return (
    value?.type === "CallExpression" &&
    value?.callee?.type === "MemberExpression" &&
    value?.callee?.object?.name === "Object" &&
    value?.callee?.property?.name === "assign" &&
    +value?.arguments?.length
  );
}

function isDetectedIdentifier(
  value: any,
  parent: any,
  identifiers: Map<string, string>
) {
  return (
    value?.type === "Identifier" &&
    identifiers.has(value?.name) &&
    parent?.type === "VariableDeclarator" &&
    FUNCTION_ESXPRESSION_TYPES.has(parent.init?.type)
  );
}
