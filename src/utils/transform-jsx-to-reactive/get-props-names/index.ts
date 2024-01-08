import { ESTree } from "meriyah";
import getWebComponentAst from "@/utils/transform-jsx-to-reactive/get-web-component-ast";
import mapComponentStatics from "@/utils/transform-jsx-to-reactive/map-component-statics";

const CHILDREN = "children";

export default function getPropsNames(
  webComponentAst: any,
  propNamesFromExport: string[] = [],
): [string[], string[], Record<string, ESTree.Literal>] {
  const propsAst =
    webComponentAst?.params?.[0] ??
    webComponentAst?.declarations?.[0]?.init?.params?.[0];
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

      if (renamedPropName === CHILDREN && name === CHILDREN) {
        continue;
      }

      renamedPropNames.push(renamedPropName);
      propNames.push(name);

      if (prop.value?.type === "AssignmentPattern") {
        defaultPropsValues[renamedPropName] = prop.value.right;
      }
    }

    const [, renames] = getPropsNamesFromIdentifier("", webComponentAst);

    renamedPropNames.push(...renames);

    return [
      unify(propNames, propNamesFromExport),
      unify(renamedPropNames, propNamesFromExport),
      defaultPropsValues,
    ];
  }

  if (propsAst?.type === "Identifier") {
    const identifier = propsAst.name;
    const res = getPropsNamesFromIdentifier(identifier, webComponentAst);
    return [
      unify(res[0], propNamesFromExport),
      unify(res[1], propNamesFromExport),
      res[2],
    ];
  }

  return [propNamesFromExport, propNamesFromExport, {}];
}

function getPropsNamesFromIdentifier(
  identifier: string,
  ast: any,
): [string[], string[], Record<string, ESTree.Literal>] {
  const propsNames = new Set<string>([]);
  const renamedPropsNames = new Set<string>([]);
  const identifiers = new Set<string>([identifier]);

  JSON.stringify(ast, (key, value) => {
    // props.name
    if (
      value?.object?.type === "Identifier" &&
      value?.property?.type === "Identifier" &&
      identifiers.has(value?.object?.name)
    ) {
      const name =
        value?.property?.name !== CHILDREN ? value?.property?.name : null;

      if (name) {
        propsNames.add(name);
        renamedPropsNames.add(name);
      }
    }

    // const { name } = props
    else if (
      value?.init?.type === "Identifier" &&
      value?.id?.properties &&
      identifiers.has(value?.init?.name)
    ) {
      for (const prop of value.id.properties) {
        // spread props like: const { name, ...rest } = props
        if (prop?.key?.name && prop.key.name !== CHILDREN) {
          propsNames.add(prop.key.name);
        }
        // add as identifier the rest props like: const { ...rest } = props
        if (prop?.type === "RestElement") {
          identifiers.add(prop.argument.name);
        }
        // renamed props like: const { name: renamedName } = props
        if (prop?.value?.name) renamedPropsNames.add(prop.value.name);
      }
    }

    // const foo = props.name
    else if (
      value?.type === "VariableDeclarator" &&
      value?.init?.object?.type === "Identifier" &&
      value?.init?.property?.type === "Identifier" &&
      identifiers.has(value?.init?.object?.name)
    ) {
      propsNames.add(value?.init?.property?.name);
      renamedPropsNames.add(value?.init?.property?.name);
    }

    return value;
  });

  return [[...propsNames], [...renamedPropsNames], {}];
}

export function getPropNamesFromExport(ast: ESTree.Program) {
  const exportProps = ast.body.find(
    (node) =>
      node.type === "ExportNamedDeclaration" &&
      node.declaration?.type === "VariableDeclaration" &&
      (node as any).declaration?.declarations?.[0]?.id?.name === "props",
  ) as any;

  return (
    exportProps?.declaration?.declarations?.[0]?.init?.elements?.map(
      (el: ESTree.Literal) => el.value,
    ) ?? []
  );
}

export function getPropNamesFromStatics(ast: ESTree.Program) {
  const [componentBrach] = getWebComponentAst(ast);
  const componentName = componentBrach?.id?.name!;
  const propNamesFromExport = getPropNamesFromExport(ast);
  const propNamesStaticMap = new Map<
    string,
    [string[], string[], Record<string, ESTree.Literal>]
  >();

  mapComponentStatics(ast, componentName, (staticValue, staticName) => {
    const res = getPropsNames(staticValue, propNamesFromExport);
    propNamesStaticMap.set(staticName, res);
    return staticValue;
  });

  return propNamesStaticMap;
}

function unify(arr1: string[], arr2: string[]) {
  const set = new Set([...arr1, ...arr2]);
  return [...set];
}
