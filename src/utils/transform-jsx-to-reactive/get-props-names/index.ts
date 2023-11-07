import { ESTree } from "meriyah";

export default function getPropsNames(
  webComponentAst: ESTree.FunctionDeclaration | ESTree.ArrowFunctionExpression,
) {
  const propsAst = webComponentAst.params[0];

  if (propsAst?.type === "ObjectPattern") {
    return propsAst.properties.map((prop) => (prop as any).key.name);
  }

  if (propsAst?.type === "Identifier") {
    const identifier = propsAst.name;
    return getPropsNamesFromIdentifier(identifier, webComponentAst);
  }

  return [];
}

function getPropsNamesFromIdentifier(identifier: string, ast: any) {
  const propsNames = new Set<string>([]);

  JSON.stringify(ast, (key, value) => {
    // props.name
    if (
      value?.object?.type === "Identifier" &&
      value?.object?.name === identifier &&
      value?.property?.type === "Identifier"
    ) {
      propsNames.add(value?.property?.name);
    }

    // const { name } = props
    if (
      value?.init?.type === "Identifier" &&
      value?.init?.name === identifier &&
      value?.id?.properties
    ) {
      for (const prop of value.id.properties) {
        // avoid spread props like: const { name, ...rest } = props
        if (prop?.key?.name) propsNames.add(prop.key.name);
      }
    }

    return value;
  });

  return [...propsNames];
}
