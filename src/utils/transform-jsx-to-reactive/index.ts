import { ESTree } from "meriyah";

import AST from "../ast";
import { ALTERNATIVE_FOLDER_REGEX, WEB_COMPONENT_REGEX } from "./constants";
import defineBrisaElement from "./define-brisa-element";
import generateUniqueVariableName from "./generate-unique-variable-name";
import getWebComponentAst from "./get-web-component-ast";
import mergeEarlyReturnsInOne from "./merge-early-returns-in-one";
import optimizeEffects from "./optimize-effects";
import transformToDirectExport from "./transform-to-direct-export";
import transformToReactiveArrays from "./transform-to-reactive-arrays";
import transformToReactiveProps from "./transform-to-reactive-props";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");

export default function transformJSXToReactive(code: string, path: string) {
  if (path.match(ALTERNATIVE_FOLDER_REGEX)) return code;

  const ast = parseCodeToAST(code);
  const astWithDirectExport = transformToDirectExport(ast);

  // TODO: should also transform statics
  const out =
    transformToReactiveProps(astWithDirectExport);
  const reactiveAst = transformToReactiveArrays(out.ast, path);
  let [componentBranch, index] = getWebComponentAst(reactiveAst) as [
    ESTree.FunctionDeclaration,
    number
  ];

  // TODO: should also transform statics
  componentBranch = mergeEarlyReturnsInOne(componentBranch);

  if (!componentBranch || !path.match(WEB_COMPONENT_REGEX)) {
    return generateCodeFromAST(reactiveAst);
  }

  const componentName = componentBranch.id?.name ?? generateUniqueVariableName("Component", out.vars);

  // TODO: should also transform statics
  componentBranch = optimizeEffects(componentBranch, out.vars);

  const [importDeclaration, brisaElement, componentAst] = defineBrisaElement(
    componentBranch,
    out.props,
    componentName
  );

  // Wrap the component with brisaElement
  if (typeof index === "number") {
    (reactiveAst.body[index] as any).declaration = brisaElement;
    reactiveAst.body.splice(
      index,
      0,
      componentAst as ESTree.Statement
    );
  }

  // Add the import declaration
  reactiveAst.body.unshift(
    importDeclaration as ESTree.ImportDeclaration
  );

  return generateCodeFromAST(reactiveAst);
}
