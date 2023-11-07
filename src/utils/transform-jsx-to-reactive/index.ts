import { ESTree } from "meriyah";
import AST from "../ast";
import getPropsNames from "./get-props-names";
import getWebComponentAst from "./get-web-component-ast";
import transformToReactiveArrays from "./transform-to-reactive-arrays";
import defineBrisaElement from "./define-brisa-element";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");
const ALTERNATIVE_FOLDER_REGEX = new RegExp(".*/web-components/@.*?/");
const WEB_COMPONENT_REGEX = new RegExp(".*/web-components/.*");

export default function transformJSXToReactive(code: string, path: string) {
  if (path.match(ALTERNATIVE_FOLDER_REGEX)) return code;

  const ast = parseCodeToAST(code);
  const reactiveAst = transformToReactiveArrays(ast);
  const [componentBranch, index] = getWebComponentAst(reactiveAst);

  if (!componentBranch) return code;

  const propNames = getPropsNames(
    componentBranch as ESTree.FunctionDeclaration,
  );

  if (!path.match(WEB_COMPONENT_REGEX)) return generateCodeFromAST(reactiveAst);

  const [importDeclaration, brisaElement] = defineBrisaElement(
    componentBranch as ESTree.FunctionDeclaration,
    propNames,
  );

  // Wrap the component with brisaElement
  if (typeof index === "number") {
    (reactiveAst.body[index] as any).declaration = brisaElement;
  }

  // Add the import declaration
  reactiveAst.body.unshift(importDeclaration as ESTree.ImportDeclaration);

  return generateCodeFromAST(reactiveAst);
}
