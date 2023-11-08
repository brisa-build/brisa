import { ESTree } from "meriyah";
import AST from "../ast";
import getPropsNames from "./get-props-names";
import getWebComponentAst from "./get-web-component-ast";
import transformToReactiveArrays from "./transform-to-reactive-arrays";
import defineBrisaElement from "./define-brisa-element";
import getComponentVariableNames from "./get-component-variable-names";
import { ALTERNATIVE_FOLDER_REGEX, WEB_COMPONENT_REGEX } from "./constants";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");

export default function transformJSXToReactive(code: string, path: string) {
  if (path.match(ALTERNATIVE_FOLDER_REGEX)) return code;

  const ast = parseCodeToAST(code);
  const reactiveAst = transformToReactiveArrays(ast);
  const [componentBranch, index] = getWebComponentAst(reactiveAst) as [
    ESTree.FunctionDeclaration,
    number,
  ];

  if (!componentBranch) return generateCodeFromAST(reactiveAst);

  const propNames = getPropsNames(componentBranch);
  const componentVariableNames = getComponentVariableNames(componentBranch);
  const allVariableNames = new Set([...propNames, ...componentVariableNames]);
  let hyperScriptVarName = "h";

  while (allVariableNames.has(hyperScriptVarName)) hyperScriptVarName += "$";

  if (!path.match(WEB_COMPONENT_REGEX)) return generateCodeFromAST(reactiveAst);

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
