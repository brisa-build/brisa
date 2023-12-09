import { ESTree } from "meriyah";

import AST from "../ast";
import { ALTERNATIVE_FOLDER_REGEX, WEB_COMPONENT_REGEX } from "./constants";
import defineBrisaElement from "./define-brisa-element";
import getComponentVariableNames from "./get-component-variable-names";
import getWebComponentAst from "./get-web-component-ast";
import mergeEarlyReturnsInOne from "./merge-early-returns-in-one";
import optimizeEffects from "./optimize-effects";
import transformComponentStatics from "./transform-component-statics";
import transformToDirectExport from "./transform-to-direct-export";
import transformToReactiveArrays from "./transform-to-reactive-arrays";
import transformToReactiveProps from "./transform-to-reactive-props";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");

export default function transformJSXToReactive(code: string, path: string) {
  if (path.match(ALTERNATIVE_FOLDER_REGEX)) return code;

  const ast = parseCodeToAST(code);
  const astWithDirectExport = transformToDirectExport(ast);
  const [astWithPropsDotValue, propNames, isAddedDefaultProps] =
    transformToReactiveProps(astWithDirectExport);
  const reactiveAst = transformToReactiveArrays(astWithPropsDotValue, path);
  let [componentBranch, index] = getWebComponentAst(reactiveAst) as [
    ESTree.FunctionDeclaration,
    number
  ];

  componentBranch = mergeEarlyReturnsInOne(componentBranch);

  if (!componentBranch || !path.match(WEB_COMPONENT_REGEX)) {
    return generateCodeFromAST(reactiveAst);
  }

  const componentVariableNames = getComponentVariableNames(componentBranch);
  const allVariableNames = new Set([...propNames, ...componentVariableNames]);

  componentBranch = optimizeEffects(componentBranch, allVariableNames);

  const [importDeclaration, brisaElement, componentAst] = defineBrisaElement(
    componentBranch,
    propNames,
    allVariableNames,
    isAddedDefaultProps
  );

  const reactiveAstWithStatics = transformComponentStatics(
    reactiveAst,
    componentBranch.id?.name!,
    allVariableNames
  );

  // Wrap the component with brisaElement
  if (typeof index === "number") {
    (reactiveAstWithStatics.body[index] as any).declaration = brisaElement;
    reactiveAstWithStatics.body.splice(
      index,
      0,
      componentAst as ESTree.Statement
    );
  }

  // Add the import declaration
  reactiveAstWithStatics.body.unshift(
    importDeclaration as ESTree.ImportDeclaration
  );

  return generateCodeFromAST(reactiveAstWithStatics);
}
