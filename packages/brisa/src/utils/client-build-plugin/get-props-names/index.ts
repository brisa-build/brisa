import type { ESTree } from 'meriyah';
import getWebComponentAst from '@/utils/client-build-plugin/get-web-component-ast';
import mapComponentStatics from '@/utils/client-build-plugin/map-component-statics';

type PropSet = Set<string>;

const CHILDREN = 'children';

export default function getPropsNames(
  webComponentAst: any,
  propNamesFromExport: string[] = [],
): [PropSet, PropSet, PropSet] {
  const propsAst =
    webComponentAst?.params?.[0] ??
    webComponentAst?.declarations?.[0]?.init?.params?.[0];
  const propNames = [];
  const renamedPropNames = [];
  const standaloneProps = [];

  if (propsAst?.type === 'ObjectPattern') {
    for (const prop of propsAst.properties as any[]) {
      if (prop.type === 'RestElement') {
        const [names, renamedNames, standaloneNames] =
          getPropsNamesFromIdentifier(prop.argument.name, webComponentAst);

        propNames.push(...names);
        renamedPropNames.push(...renamedNames);
        standaloneProps.push(...standaloneNames);
        continue;
      }

      const name = prop.key.name;
      const renamedPropName = prop.value.left?.name ?? prop.value.name ?? name;

      if (renamedPropName === CHILDREN && name === CHILDREN) {
        continue;
      }

      renamedPropNames.push(renamedPropName);
      propNames.push(name);
      standaloneProps.push(renamedPropName);
    }

    const [, renames, standaloneNames] = getPropsNamesFromIdentifier(
      '',
      webComponentAst,
    );

    renamedPropNames.push(...renames);
    standaloneProps.push(...standaloneNames);

    return [
      unify(propNames, propNamesFromExport),
      unify(renamedPropNames, propNamesFromExport),
      new Set(standaloneProps),
    ];
  }

  if (
    propsAst?.type === 'Identifier' ||
    (propsAst?.type === 'AssignmentPattern' &&
      propsAst.left.type === 'Identifier')
  ) {
    const identifier = propsAst.name ?? propsAst.left.name;
    const res = getPropsNamesFromIdentifier(identifier, webComponentAst);
    return [
      unify(res[0], propNamesFromExport),
      unify(res[1], propNamesFromExport),
      res[2],
    ];
  }

  const propNamesFromExportSet = new Set(propNamesFromExport);

  return [propNamesFromExportSet, propNamesFromExportSet, new Set()];
}

function getPropsNamesFromIdentifier(
  identifier: string,
  ast: any,
): [PropSet, PropSet, PropSet] {
  const propsNames = new Set<string>([]);
  const renamedPropsNames = new Set<string>([]);
  const standaloneProps = new Set<string>([]);
  const identifiers = new Set<string>([identifier]);

  JSON.stringify(ast, (key, value) => {
    // props.name
    if (
      value?.object?.type === 'Identifier' &&
      value?.property?.type === 'Identifier' &&
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
      value?.init?.type === 'Identifier' &&
      value?.id?.properties &&
      identifiers.has(value?.init?.name)
    ) {
      for (const prop of value.id.properties) {
        const isProp = prop?.key?.name && prop.key.name !== CHILDREN;
        const isRest = prop?.type === 'RestElement';
        const isRenamed = prop?.value?.name;

        // destructured props like: const { name, ...rest } = props
        if (isProp) propsNames.add(prop.key.name);

        // add as identifier the rest props like: const { ...rest } = props
        if (isRest) identifiers.add(prop.argument.name);

        // renamed props like: const { name: renamedName } = props
        if (isRenamed) renamedPropsNames.add(prop.value.name);

        // standalone props like: const { name } = props
        if (isProp && !isRenamed) standaloneProps.add(prop.key.name);
        else if (isRest && !isRenamed) standaloneProps.add(prop.argument.name);
        else if (isRenamed) standaloneProps.add(prop.value.name);
      }
    }

    // const foo = props.name
    else if (
      value?.type === 'VariableDeclarator' &&
      value?.init?.object?.type === 'Identifier' &&
      value?.init?.property?.type === 'Identifier' &&
      identifiers.has(value?.init?.object?.name)
    ) {
      propsNames.add(value?.init?.property?.name);
      renamedPropsNames.add(value?.init?.property?.name);
      standaloneProps.add(value?.init?.property?.name);
    }

    return value;
  });

  return [propsNames, renamedPropsNames, standaloneProps];
}

export function getPropNamesFromExport(ast: ESTree.Program) {
  const exportProps = ast.body.find(
    (node) =>
      node.type === 'ExportNamedDeclaration' &&
      node.declaration?.type === 'VariableDeclaration' &&
      (node as any).declaration?.declarations?.[0]?.id?.name === 'props',
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
  const propNamesStaticMap = new Map<string, [PropSet, PropSet, PropSet]>();

  mapComponentStatics(ast, componentName, (staticValue, staticName) => {
    const res = getPropsNames(staticValue, propNamesFromExport);
    propNamesStaticMap.set(staticName, res);
    return staticValue;
  });

  return propNamesStaticMap;
}

function unify(arr1: string[] | PropSet, arr2: string[] | PropSet) {
  return new Set([...arr1, ...arr2]);
}
