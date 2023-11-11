import { ESTree } from "meriyah";
import AST from "../ast";
import getWebComponentAst from "./get-web-component-ast";
import transformToReactiveArrays from "./transform-to-reactive-arrays";
import defineBrisaElement from "./define-brisa-element";
import getComponentVariableNames from "./get-component-variable-names";
import { ALTERNATIVE_FOLDER_REGEX, WEB_COMPONENT_REGEX } from "./constants";
import transformToReactiveProps from "./transform-to-reactive-props";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");

export default function transformJSXToReactive(code: string, path: string) {
  if (path.match(ALTERNATIVE_FOLDER_REGEX)) return code;

  const ast = parseCodeToAST(code);
  const [astWithPropsDotValue, propNames] = transformToReactiveProps(ast);
  const reactiveAst = transformToReactiveArrays(astWithPropsDotValue);
  const [componentBranch, index] = getWebComponentAst(reactiveAst) as [
    ESTree.FunctionDeclaration,
    number,
  ];

  if (!componentBranch || !path.match(WEB_COMPONENT_REGEX)) {
    return generateCodeFromAST(reactiveAst);
  }

  const componentVariableNames = getComponentVariableNames(componentBranch);
  const allVariableNames = new Set([...propNames, ...componentVariableNames]);
  let hyperScriptVarName = "h";

  while (allVariableNames.has(hyperScriptVarName)) hyperScriptVarName += "$";

  const [importDeclaration, brisaElement] = defineBrisaElement(
    componentBranch,
    propNames,
    hyperScriptVarName,
  );

  // Wrap the component with brisaElement
  if (typeof index === "number") {
    (reactiveAst.body[index] as any).declaration = brisaElement;
  }

  // Add the import declaration
  reactiveAst.body.unshift(importDeclaration as ESTree.ImportDeclaration);

  return generateCodeFromAST(reactiveAst);
}
