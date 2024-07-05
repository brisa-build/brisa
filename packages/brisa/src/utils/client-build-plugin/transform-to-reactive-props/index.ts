import { ESTree } from "meriyah";
import generateUniqueVariableName from "@/utils/client-build-plugin/generate-unique-variable-name";
import getComponentVariableNames from "@/utils/client-build-plugin/get-component-variable-names";
import getPropsNames, {
  getPropNamesFromExport,
} from "@/utils/client-build-plugin/get-props-names";
import getWebComponentAst from "@/utils/client-build-plugin/get-web-component-ast";
import manageWebContextField from "@/utils/client-build-plugin/manage-web-context-field";
import mapComponentStatics from "@/utils/client-build-plugin/map-component-statics";
import getPropsOptimizations from "@/utils/client-build-plugin/get-props-optimizations";
import AST from "@/utils/ast";

const { parseCodeToAST } = AST("tsx");
const PROPS_OPTIMIZATION_IDENTIFIER = "__b_props__";

type Statics = {
  suspense?: Result;
  error?: Result;
};

type Result = {
  ast: ESTree.Program;
  componentName: string;
  observedAttributes: string[];
  vars: Set<string>;
  statics?: Statics;
};

export default function transformToReactiveProps(ast: ESTree.Program): Result {
  const [component, defaultExportIndex, identifierDeclarationIndex] =
    getWebComponentAst(ast);
  const defaultComponentName = "Component";

  if (!component)
    return {
      ast,
      componentName: "",
      observedAttributes: [],
      vars: new Set(),
      statics: {},
    };

  const propsFromExport = getPropNamesFromExport(ast);
  const statics: Statics = {};
  const componentIndex =
    identifierDeclarationIndex !== -1
      ? identifierDeclarationIndex
      : defaultExportIndex;

  const out = transformComponentToReactiveProps(component, propsFromExport);

  let componentName = defaultComponentName;

  const newAst = {
    ...ast,
    body: ast.body.map((node, index) => {
      if (index !== componentIndex) return node;

      const hasDeclaration = "declaration" in (node as any);
      const comp = hasDeclaration
        ? (node as any)?.declaration
        : (node as any)?.declarations?.[0];

      componentName =
        comp?.id?.name ??
        generateUniqueVariableName(defaultComponentName, out.vars);

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
    const staticsOut = transformComponentToReactiveProps(
      staticAst,
      propsFromExport,
    );

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

export function transformComponentToReactiveProps(
  component: any,
  propNamesFromExport: string[],
) {
  const componentVariableNames = getComponentVariableNames(component);
  const [observedAttributes, renamedPropsNames, defaultPropsValues] =
    getPropsNames(component, propNamesFromExport);
  let allVariableNames = new Set([
    ...observedAttributes,
    ...componentVariableNames,
  ]);
  const declaration = component?.declarations?.[0];
  const componentBody = component?.body ?? declaration?.init.body;
  const transformedProps = new Set<string>();
  const params = getComponentParams(component);
  const derivedName = generateUniqueVariableName("derived", allVariableNames);
  const derivedPropsInfo = getDerivedProps(
    component,
    derivedName,
    allVariableNames,
  );
  const propsNamesAndRenamesSet = new Set([
    ...observedAttributes,
    ...renamedPropsNames,
    ...propNamesFromExport,
    ...derivedPropsInfo.propNames,
  ]);

  allVariableNames = new Set([
    ...allVariableNames,
    ...derivedPropsInfo.propNames,
  ]);

  if (derivedPropsInfo.propsOptimizationsAst.length) {
    manageWebContextField(component, derivedName, "derived");
  }

  injectDerivedProps({
    componentBody: componentBody,
    componentParams: params,
    derivedName,
    optimizationASTLines: derivedPropsInfo.propsOptimizationsAst,
  });

  function traverseB2A(this: any, key: string, value: any) {
    if (this?.type === "VariableDeclarator" && this.id === value) {
      // Fix: https://github.com/brisa-build/brisa/issues/275
      if (this.init?.type === "CallExpression" && value.name) {
        transformedProps.add(value.name);
      }

      return JSON.parse(JSON.stringify(value), (key, value) => {
        return value?.isSignal ? value.object : value;
      });
    }

    const isIdentifier = value?.type === "Identifier";
    const isIdentifierInsideMemberExpression =
      isIdentifier && this?.type === "MemberExpression";

    if (isIdentifierInsideMemberExpression) {
      const memberExpression = firstMemberExpression(this);
      const isOptimizationIdentifier =
        memberExpression.object.name === PROPS_OPTIMIZATION_IDENTIFIER;

      if (isOptimizationIdentifier && memberExpression.property !== value) {
        return value;
      }
    }

    // Avoid adding .value in:
    //  const { foo: a, bar: b } = props
    // We don't want this:
    //  const { foo: a.value, bar: b.value } = props.value
    const isPropFromObjectExpression =
      this?.type === "Property" && this?.key === value;

    if (
      isIdentifier &&
      !value?._skip &&
      propsNamesAndRenamesSet.has(value?.name) &&
      !transformedProps.has(this?.object?.name) &&
      !isPropFromObjectExpression &&
      !value?.name?.startsWith("on")
    ) {
      // allow: console.log({ propName })
      // transforming to: console.log({ propName: propName.value })
      if (this?.type === "Property") this.shorthand = false;

      // add signal, transforming:
      //  <div>{propName}</div>
      // to:
      //  <div>{propName.value}</div>
      return {
        type: "MemberExpression",
        object: value,
        property: {
          type: "Identifier",
          name: "value",
        },
        computed: false,
        isSignal: true,
      };
    }

    return value;
  }

  const newComponentBody = JSON.parse(
    JSON.stringify(componentBody),
    traverseB2A,
  );

  const newComponent = declaration
    ? { ...declaration?.init, body: newComponentBody }
    : newComponentBody;

  return {
    component: newComponent,
    vars: allVariableNames,
    observedAttributes,
  };
}

function getComponentParams(component: any) {
  const declaration = component?.declarations?.[0];
  return declaration?.init?.params ?? component?.params ?? [];
}

function getDerivedProps(
  component: any,
  derivedName: string,
  allVariableNames: Set<string>,
) {
  const params = getComponentParams(component);
  const propsOptimizations = getPropsOptimizations(params[0], derivedName);
  const propsOptimizationsAst = propsOptimizations.flatMap(
    (c) => parseCodeToAST(c).body[0],
  );

  const propNames = propsOptimizationsAst.map(
    (node: any) => node.declarations[0].id.name,
  );

  return { propsOptimizationsAst, propNames, derivedName };
}

function injectDerivedProps({
  componentBody,
  componentParams,
  optimizationASTLines,
}: {
  componentBody: any;
  componentParams: any;
  derivedName: string;
  optimizationASTLines: any[];
}) {
  if (optimizationASTLines.length === 0) return;

  componentParams[0] = {
    type: "Identifier",
    name: PROPS_OPTIMIZATION_IDENTIFIER,
  };

  componentBody.body = [...optimizationASTLines, ...componentBody.body];
}

function firstMemberExpression(memberExpression: any) {
  if (memberExpression?.object?.type === "MemberExpression") {
    return firstMemberExpression(memberExpression.object);
  }

  return memberExpression;
}
