import type { ESTree } from 'meriyah';
import generateUniqueVariableName from '@/utils/client-build-plugin/generate-unique-variable-name';
import getComponentVariableNames from '@/utils/client-build-plugin/get-component-variable-names';
import getPropsNames, { getPropNamesFromExport } from '@/utils/client-build-plugin/get-props-names';
import getWebComponentAst from '@/utils/client-build-plugin/get-web-component-ast';
import manageWebContextField from '@/utils/client-build-plugin/manage-web-context-field';
import mapComponentStatics from '@/utils/client-build-plugin/map-component-statics';
import getPropsOptimizations from '@/utils/client-build-plugin/get-props-optimizations';
import AST from '@/utils/ast';
import skipPropTransformation from '@/utils/client-build-plugin/skip-prop-transformation';

const { parseCodeToAST } = AST('tsx');
const PROPS_OPTIMIZATION_IDENTIFIER = '__b_props__';
const DERIVED_NAME = 'derived';

type Statics = {
  suspense?: Result;
  error?: Result;
};

type Result = {
  ast: ESTree.Program;
  componentName: string;
  observedAttributes: Set<string>;
  vars: Set<string>;
  statics?: Statics;
};

export default function transformToReactiveProps(ast: ESTree.Program): Result {
  const [component, defaultExportIndex, identifierDeclarationIndex] = getWebComponentAst(ast);
  const defaultComponentName = 'Component';

  if (!component)
    return {
      ast,
      componentName: '',
      observedAttributes: new Set(),
      vars: new Set(),
      statics: {},
    };

  const propsFromExport = getPropNamesFromExport(ast);
  const statics: Statics = {};
  const componentIndex =
    identifierDeclarationIndex !== -1 ? identifierDeclarationIndex : defaultExportIndex;

  const out = transformComponentToReactiveProps(component, propsFromExport);

  let componentName = defaultComponentName;

  const newAst = {
    ...ast,
    body: ast.body.map((node, index) => {
      if (index !== componentIndex) return node;

      const hasDeclaration = 'declaration' in (node as any);
      const comp = hasDeclaration ? (node as any)?.declaration : (node as any)?.declarations?.[0];

      componentName = comp?.id?.name ?? generateUniqueVariableName(defaultComponentName, out.vars);

      if (hasDeclaration) {
        return {
          ...node,
          declaration: { ...comp, body: out.component },
        };
      }

      if (Array.isArray((node as any).declarations)) {
        return {
          ...node,
          declarations: [
            {
              ...(node as any).declarations[0],
              init: out.component,
            },
          ],
        };
      }

      return { ...node, body: out.component };
    }),
  } as ESTree.Program;

  mapComponentStatics(newAst, componentName, (staticAst, staticName) => {
    const staticsOut = transformComponentToReactiveProps(staticAst, propsFromExport);

    statics[staticName] = {
      ast: staticsOut.component,
      observedAttributes: staticsOut.observedAttributes,
      vars: staticsOut.vars,
      componentName: staticName,
    };

    staticAst.body = staticsOut.component;

    return staticAst;
  });

  return {
    ast: newAst,
    componentName,
    observedAttributes: out.observedAttributes,
    vars: out.vars,
    statics,
  };
}

export function transformComponentToReactiveProps(component: any, propNamesFromExport: string[]) {
  const componentVariableNames = getComponentVariableNames(component);
  const firstLevelVars = getFistLevelVariables(component);
  const declaration = component?.declarations?.[0];
  const params = getComponentParams(component);
  const propsIdentifierName = getPropsIdentifierName(params[0]);
  const derivedName = generateUniqueVariableName(DERIVED_NAME, new Set(componentVariableNames));
  const derivedPropsInfo = getDerivedProps(component, derivedName);

  if (derivedPropsInfo.propsOptimizationsAst.length) {
    manageWebContextField(component, derivedName, DERIVED_NAME);
  }

  // This method mutates the component
  injectDerivedProps({
    component,
    componentParams: params,
    derivedName,
    optimizationASTLines: derivedPropsInfo.propsOptimizationsAst,
  });

  // Recover the component body after the mutation
  const componentBody = component?.body ?? declaration?.init.body;
  const [observedAttributes, renamedPropsNames, destructuredProps] = getPropsNames(
    component,
    propNamesFromExport,
  );
  const allVariableNames = new Set([
    ...observedAttributes,
    ...componentVariableNames,
    ...derivedPropsInfo.propNames,
  ]);

  const propsNamesAndRenamesSet = new Set([
    ...observedAttributes,
    ...renamedPropsNames,
    ...propNamesFromExport,
    ...derivedPropsInfo.propNames,
  ]);

  const traverseA2B = skipPropTransformation(
    componentBody,
    propsNamesAndRenamesSet,
    propsIdentifierName,
    destructuredProps,
  );

  function traverseB2A(this: any, key: string, value: any) {
    const isProperty = this?.type === 'Property';

    // Avoid adding .value in:
    //  const { foo: a, bar: b } = props
    // We don't want this:
    //  const { foo: a.value, bar: b.value } = props.value
    const isPropFromObjectExpression = isProperty && this?.key === value;

    // Avoid adding .value if there is a variable "const foo = props.foo"
    const isMemberExpressionProperty =
      this?.property === value && this?.type === 'MemberExpression';
    const isInitialVariable = !isMemberExpressionProperty && firstLevelVars.has(value?.name);

    if (
      value?.type === 'Identifier' &&
      !value?._force_skip &&
      !isPropFromObjectExpression &&
      !isInitialVariable &&
      propsNamesAndRenamesSet.has(value?.name) &&
      !value?.name?.startsWith('on') &&
      !value?._skip?.includes(value?.name)
    ) {
      // allow: console.log({ propName })
      // transforming to: console.log({ propName: propName.value })
      if (isProperty) {
        this.shorthand = false;
      }

      // add signal, transforming:
      //  <div>{propName}</div>
      // to:
      //  <div>{propName.value}</div>
      return {
        type: 'MemberExpression',
        object: value,
        property: {
          type: 'Identifier',
          name: 'value',
        },
        computed: false,
        isSignal: true,
      };
    }

    return value;
  }

  const newComponentBody = JSON.parse(JSON.stringify(componentBody, traverseA2B), traverseB2A);

  const newComponent = declaration
    ? { ...declaration?.init, body: newComponentBody }
    : newComponentBody;

  return {
    component: newComponent,
    vars: allVariableNames,
    observedAttributes,
  };
}

function getPropsIdentifierName(props: any) {
  if (props?.name) return props.name;
  // Rest props
  if (props?.type === 'ObjectPattern') {
    return props.properties.at(-1)?.argument?.name;
  }
}

function getComponentParams(component: any) {
  const declaration = component?.declarations?.[0];
  return declaration?.init?.params ?? component?.params ?? [];
}

function getDerivedProps(component: any, derivedName: string) {
  const propNames = [];
  const params = getComponentParams(component);
  const propsOptimizations = getPropsOptimizations(params[0], derivedName);
  const propsOptimizationsAst = propsOptimizations.flatMap((c) => parseCodeToAST(c).body[0]);

  for (const node of propsOptimizationsAst) {
    const name = (node as any).declarations[0].id.name;
    if (name) propNames.push(name);
  }

  return { propsOptimizationsAst, propNames, derivedName };
}

function getComponentBody(component: any) {
  return (
    component?.body?.body ??
    component?.body ??
    component?.declarations?.[0]?.init?.body?.body ??
    component?.declarations?.[0]?.init?.body
  );
}

function injectDerivedProps({
  component,
  componentParams,
  optimizationASTLines,
}: {
  component: any;
  componentParams: any;
  derivedName: string;
  optimizationASTLines: any[];
}) {
  if (optimizationASTLines.length === 0) return;

  const componentBody = getComponentBody(component);

  componentParams[0] = {
    type: 'Identifier',
    name: PROPS_OPTIMIZATION_IDENTIFIER,
  };

  if (Array.isArray(componentBody)) {
    componentBody.unshift(...optimizationASTLines);
  } else if (componentBody === component?.body) {
    component.body = {
      type: 'BlockStatement',
      body: [
        ...optimizationASTLines,
        {
          type: 'ReturnStatement',
          argument: componentBody,
        },
      ],
    };
  }
}

function getFistLevelVariables(component: any) {
  const componentBody = getComponentBody(component);
  const vars = new Set();

  if (!Array.isArray(componentBody)) return vars;

  for (const node of componentBody) {
    if (node?.type !== 'VariableDeclaration') continue;

    for (const declaration of node.declarations) {
      if (declaration?.id?.name) vars.add(declaration.id.name);
    }
  }

  return vars;
}
