import { ESTree } from "meriyah";

import AST from "../ast";
import defineBrisaElement from "./define-brisa-element";
import getWebComponentAst from "./get-web-component-ast";
import mergeEarlyReturnsInOne from "./merge-early-returns-in-one";
import optimizeEffects from "./optimize-effects";
import transformToDirectExport from "./transform-to-direct-export";
import transformToReactiveArrays from "./transform-to-reactive-arrays";
import transformToReactiveProps from "./transform-to-reactive-props";
import mapComponentStatics from "./map-component-statics";
import replaceExportDefault from "./replace-export-default";
import getReactiveReturnStatement from "./get-reactive-return-statement";
import {
  ALTERNATIVE_PREFIX,
  NATIVE_FOLDER,
  WEB_COMPONENT_REGEX,
} from "./constants";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");
const BRISA_INTERNAL_PATH = "__BRISA_CLIENT__";

export default function transformJSXToReactive(code: string, path: string) {
  const isInternal = path.startsWith(BRISA_INTERNAL_PATH);

  if (path.includes(NATIVE_FOLDER) && !isInternal) {
    return code;
  }

  const ast = parseCodeToAST(code);
  const astWithDirectExport = transformToDirectExport(ast);
  const out = transformToReactiveProps(astWithDirectExport);
  const reactiveAst = transformToReactiveArrays(out.ast, path);
  const propsSet = new Set(out.props);
  let [componentBranch, exportIndex, identifierIndex] =
    getWebComponentAst(reactiveAst);

  if (
    !componentBranch ||
    (path.includes(ALTERNATIVE_PREFIX) && !isInternal) ||
    (!path.match(WEB_COMPONENT_REGEX) && !isInternal)
  ) {
    return generateCodeFromAST(reactiveAst);
  }

  for (const { props = [] } of Object.values(out.statics ?? {})) {
    for (const prop of props) propsSet.add(prop);
  }

  componentBranch = mergeEarlyReturnsInOne(
    optimizeEffects(componentBranch, out.vars),
  );

  // Merge early returns in one + optimize effects inside statics (suspense + error phases)
  mapComponentStatics(reactiveAst, out.componentName, (value, name) => {
    const comp = getReactiveReturnStatement(
      mergeEarlyReturnsInOne(value),
      name,
    ) as ESTree.FunctionDeclaration;
    if (out.statics?.[name]) {
      return optimizeEffects(comp, out.statics[name]!.vars);
    }
    return comp;
  });

  const [importDeclaration, brisaElement, componentAst] = defineBrisaElement(
    componentBranch,
    Array.from(propsSet),
    out.componentName,
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

  // Useful for internal web components as context-provider
  if (isInternal) {
    const internalComponentName = path.split(BRISA_INTERNAL_PATH).at(-1)!;
    return generateCodeFromAST(
      replaceExportDefault(reactiveAst, internalComponentName),
    );
  }

  return generateCodeFromAST(reactiveAst);
}
