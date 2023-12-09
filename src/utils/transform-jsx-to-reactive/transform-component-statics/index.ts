import { ESTree } from "meriyah";
import optimizeEffects from "../optimize-effects";

const COMPONENT_STATICS = new Set(["error", "suspense"]);
const FUNCTION_ESXPRESSION_TYPES = new Set([
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

export default function transformComponentStatics(
  ast: ESTree.Program,
  componentName: string,
  allVariableNames: Set<string>
) {
  const identifiers = new Set<string>();

  return JSON.parse(
    // Traversing A to B
    JSON.stringify(ast, function (key, value) {
      if (
        isComponentProperty(value) &&
        value?.left?.object?.name === componentName
      ) {
        if (value.right.type === "Identifier") {
          identifiers.add(value.right.name);
        } else {
          value.right = optimizeEffects(value.right, allVariableNames);
        }
      }

      if (isFromObjectAssign(value)) {
        for (const argument of value.arguments) {
          for (const property of argument?.properties ?? []) {
            if (!COMPONENT_STATICS.has(property?.key?.name)) continue;
            if (property.value.type === "Identifier") {
              identifiers.add(property.value.name);
            } else {
              property.value = optimizeEffects(
                property.value,
                allVariableNames
              );
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
        parent.init = optimizeEffects(parent.init, allVariableNames);
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
  identifiers: Set<string>
) {
  return (
    value?.type === "Identifier" &&
    identifiers.has(value?.name) &&
    parent?.type === "VariableDeclarator" &&
    FUNCTION_ESXPRESSION_TYPES.has(parent.init?.type)
  );
}
