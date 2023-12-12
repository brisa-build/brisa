import { ESTree } from "meriyah";

import AST from "../ast";
import { ALTERNATIVE_FOLDER_REGEX, WEB_COMPONENT_REGEX } from "./constants";
import defineBrisaElement from "./define-brisa-element";
import getWebComponentAst from "./get-web-component-ast";
import mergeEarlyReturnsInOne from "./merge-early-returns-in-one";
import optimizeEffects from "./optimize-effects";
import transformToDirectExport from "./transform-to-direct-export";
import transformToReactiveArrays from "./transform-to-reactive-arrays";
import transformToReactiveProps from "./transform-to-reactive-props";
import mapComponentStatics from "./map-component-statics";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");

export default function transformJSXToReactive(code: string, path: string) {
  if (path.match(ALTERNATIVE_FOLDER_REGEX)) return code;

  const ast = parseCodeToAST(code);
  const astWithDirectExport = transformToDirectExport(ast);
  const out = transformToReactiveProps(astWithDirectExport);
  const reactiveAst = transformToReactiveArrays(out.ast, path);
  const propsSet = new Set(out.props);
  let [componentBranch, exportIndex, identifierIndex] =
    getWebComponentAst(reactiveAst);

  for (const { props = [] } of Object.values(out.statics ?? {})) {
    for (const prop of props) propsSet.add(prop);
  }

  // TODO: should also transform statics
  componentBranch = mergeEarlyReturnsInOne(componentBranch!);

  if (!componentBranch || !path.match(WEB_COMPONENT_REGEX)) {
    return generateCodeFromAST(reactiveAst);
  }

  // Optimize effects inside web-component + suspense + error phases
  componentBranch = optimizeEffects(componentBranch, out.vars);
  mapComponentStatics(reactiveAst, out.componentName, (value, name) => {
    if(out.statics?.[name]) {
      return optimizeEffects(value, out.statics[name]!.vars);
    }
    return value;
  })

  const [importDeclaration, brisaElement, componentAst] = defineBrisaElement(
    componentBranch,
    Array.from(propsSet),
    out.componentName
  );

  // #### Wrap the component with brisaElement ####
  // Replace: export default function Component() {}
  // To: export default brisaElement(Component)
  (reactiveAst.body[exportIndex!] as any).declaration = brisaElement;

  // Replace the component with reactive component
  if (identifierIndex !== -1) {
    // If it was: export default Component (identifier) -> we can replace the original
    // component with the new one.
    reactiveAst.body[identifierIndex!] = componentAst as ESTree.Statement;
  } else {
    // In case of: export default function Component() {} (not identifier), so we need
    // to insert the updated component because the old one was replaced to
    // brisaElement(Component)
    reactiveAst.body.splice(exportIndex!, 0, componentAst as ESTree.Statement);
  }

  // Add the import declaration
  reactiveAst.body.unshift(importDeclaration as ESTree.ImportDeclaration);

  return generateCodeFromAST(reactiveAst);
}
