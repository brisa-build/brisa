import { ESTree } from "meriyah";

export default function getPropsNames(
  webComponentAst: ESTree.FunctionDeclaration | ESTree.ArrowFunctionExpression,
) {
  const propsAst = webComponentAst?.params?.[0];
  const propNames = [];
  const renamedPropNames = [];

  if (propsAst?.type === "ObjectPattern") {
    for (const prop of propsAst.properties as any[]) {
      if (prop.type === "RestElement") {
        const [names, renamedNames] = getPropsNamesFromIdentifier(
          prop.argument.name,
          webComponentAst,
        );

        propNames.push(...names);
        renamedPropNames.push(...renamedNames);
        continue;
      }

      renamedPropNames.push(prop.value.name ?? prop.key.name);
      propNames.push(prop.key.name);
    }

    return [propNames, renamedPropNames];
  }

  if (propsAst?.type === "Identifier") {
    const identifier = propsAst.name;
    return getPropsNamesFromIdentifier(identifier, webComponentAst);
  }

  return [[], []];
}

function getPropsNamesFromIdentifier(identifier: string, ast: any) {
  const propsNames = new Set<string>([]);
  const renamedPropsNames = new Set<string>([]);

  JSON.stringify(ast, (key, value) => {
    // props.name
    if (
      value?.object?.type === "Identifier" &&
      value?.object?.name === identifier &&
      value?.property?.type === "Identifier"
    ) {
      propsNames.add(value?.property?.name);
      renamedPropsNames.add(value?.property?.name);
    }

    // const { name } = props
    if (
      value?.init?.type === "Identifier" &&
      value?.init?.name === identifier &&
      value?.id?.properties
    ) {
      for (const prop of value.id.properties) {
        // spread props like: const { name, ...rest } = props
        if (prop?.key?.name) propsNames.add(prop.key.name);
        // renamed props like: const { name: renamedName } = props
        if (prop?.value?.name) renamedPropsNames.add(prop.value.name);
      }
    }

    // const foo = props.name
    if (
      value?.type === "VariableDeclarator" &&
      value?.init?.object?.type === "Identifier" &&
      value?.init?.object?.name === identifier &&
      value?.init?.property?.type === "Identifier"
    ) {
      propsNames.add(value?.init?.property?.name);
      renamedPropsNames.add(value?.id?.name);
    }

    return value;
  });

  return [[...propsNames], [...renamedPropsNames]];
}
