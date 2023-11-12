import { ESTree } from "meriyah";

const CHILDREN = "children";

export default function getPropsNames(
  webComponentAst: ESTree.FunctionDeclaration | ESTree.ArrowFunctionExpression,
): [string[], string[], Record<string, ESTree.Literal>] {
  const propsAst = webComponentAst?.params?.[0];
  const propNames = [];
  const renamedPropNames = [];
  let defaultPropsValues: Record<string, ESTree.Literal> = {};

  if (propsAst?.type === "ObjectPattern") {
    for (const prop of propsAst.properties as any[]) {
      if (prop.type === "RestElement") {
        const [names, renamedNames, defaultProps] = getPropsNamesFromIdentifier(
          prop.argument.name,
          webComponentAst,
        );

        propNames.push(...names);
        renamedPropNames.push(...renamedNames);
        defaultPropsValues = { ...defaultPropsValues, ...defaultProps };
        continue;
      }

      const name = prop.key.name;
      const renamedPropName = prop.value.left?.name ?? prop.value.name ?? name;

      if (renamedPropName === CHILDREN && prop.key.name === CHILDREN) {
        continue;
      }

      renamedPropNames.push(renamedPropName);
      propNames.push(name);

      if (prop.value?.type === "AssignmentPattern") {
        defaultPropsValues[renamedPropName] = prop.value.right;
      }
    }

    return [propNames, renamedPropNames, defaultPropsValues];
  }

  if (propsAst?.type === "Identifier") {
    const identifier = propsAst.name;
    return getPropsNamesFromIdentifier(identifier, webComponentAst);
  }

  return [[], [], {}];
}

function getPropsNamesFromIdentifier(
  identifier: string,
  ast: any,
): [string[], string[], Record<string, ESTree.Literal>] {
  const propsNames = new Set<string>([]);
  const renamedPropsNames = new Set<string>([]);

  JSON.stringify(ast, (key, value) => {
    // props.name
    if (
      value?.object?.type === "Identifier" &&
      value?.object?.name === identifier &&
      value?.property?.type === "Identifier"
    ) {
      const name =
        value?.property?.name !== CHILDREN ? value?.property?.name : null;

      if (name) {
        propsNames.add(name);
        renamedPropsNames.add(name);
      }
    }

    // const { name } = props
    if (
      value?.init?.type === "Identifier" &&
      value?.init?.name === identifier &&
      value?.id?.properties
    ) {
      for (const prop of value.id.properties) {
        // spread props like: const { name, ...rest } = props
        if (prop?.key?.name && prop.key.name !== CHILDREN)
          propsNames.add(prop.key.name);
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

  return [[...propsNames], [...renamedPropsNames], {}];
}
