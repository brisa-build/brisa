import { ESTree } from "meriyah";
import generateUniqueVariableName from "@/utils/client-build-plugin/generate-unique-variable-name";
import getComponentVariableNames from "@/utils/client-build-plugin/get-component-variable-names";
import getPropsNames, {
  getPropNamesFromExport,
} from "@/utils/client-build-plugin/get-props-names";
import getWebComponentAst from "@/utils/client-build-plugin/get-web-component-ast";
import manageWebContextField from "@/utils/client-build-plugin/manage-web-context-field";
import mapComponentStatics from "@/utils/client-build-plugin/map-component-statics";
import { FN } from "@/utils/client-build-plugin/constants";
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
  props: string[];
  vars: Set<string>;
  statics?: Statics;
};

export default function transformToReactiveProps(ast: ESTree.Program): Result {
  const [component, defaultExportIndex, identifierDeclarationIndex] =
    getWebComponentAst(ast);
  const defaultComponentName = "Component";

  if (!component)
    return { ast, componentName: "", props: [], vars: new Set(), statics: {} };

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
      props: staticsOut.props,
      vars: staticsOut.vars,
      componentName: staticName,
    };

    staticAst.body = staticsOut.component;

    return staticAst;
  });

  return {
    ast: newAst,
    componentName,
    props: out.props,
    vars: out.vars,
    statics,
  };
}

export function transformComponentToReactiveProps(
  component: any,
  propNamesFromExport: string[],
) {
  const componentVariableNames = getComponentVariableNames(component);
  const [propsNames, renamedPropsNames, defaultPropsValues] = getPropsNames(
    component,
    propNamesFromExport,
  );
  const propsNamesAndRenamesSet = new Set([
    ...propsNames,
    ...renamedPropsNames,
    ...propNamesFromExport,
  ]);
  const registeredProps = new Set<string>();
  const allVariableNames = new Set([...propsNames, ...componentVariableNames]);
  const declaration = component?.declarations?.[0];
  const componentBody = component?.body ?? declaration?.init.body;

  // TODO: Use this derivedProps to add the .value where these derived props are used
  const derivedProps = addDerivedProps(component, allVariableNames);
  const transformedProps = new Set<string>();

  function isExistingPropName(field: any, setToStop?: Set<string>) {
    if (!field) return false;
    let result = false;

    JSON.stringify(field, (k, v) => {
      if (result || (v?.type && setToStop?.has(v.type))) return null;
      result ||= v?.type === "Identifier" && registeredProps.has(v?.name);
      return v;
    });

    return result;
  }

  // _skip fix when there are variable declarations in
  // different scope with the same name as the prop in
  // the component body.
  // Issue: https://github.com/brisa-build/brisa/issues/284
  function traverseAToB(this: any, key: string, value: any) {
    if (value === "Identifier" && propsNamesAndRenamesSet.has(this.name)) {
      registeredProps.add(this.name);
      return value;
    }

    if (this._skip && typeof value === "object" && value !== null) {
      value._skip = true;
      return value;
    }

    if (
      value?.type === "VariableDeclaration" &&
      isExistingPropName(value?.declarations, FN)
    ) {
      this._skip = true;
      value._skip = true;
      return value;
    }

    if (FN.has(value?.type) && isExistingPropName(value?.params)) {
      this._skip = true;
      value._skip = true;
    }

    return value;
  }

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

    // Avoid adding .value in:
    //  const { foo: a, bar: b } = props
    // We don't want this:
    //  const { foo: a.value, bar: b.value } = props.value
    const isPropFromObjectExpression =
      this?.type === "Property" && this?.key === value;

    if (
      value?.type === "Identifier" &&
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
    JSON.stringify(componentBody, traverseAToB),
    traverseB2A,
  );

  const newComponent = declaration
    ? { ...declaration?.init, body: newComponentBody }
    : newComponentBody;

  return { component: newComponent, vars: allVariableNames, props: propsNames };
}

function getComponentBody(component: any) {
  return (
    component?.body?.body ??
    component?.body ??
    component?.declarations?.[0]?.init?.body?.body ??
    component?.declarations?.[0]?.init?.body
  );
}

function getComponentParams(component: any) {
  const declaration = component?.declarations?.[0];
  return declaration?.init?.params ?? component?.params ?? [];
}

function addDerivedProps(component: any, allVariableNames: Set<string>) {
  const params = getComponentParams(component);
  const derivedName = generateUniqueVariableName("derived", allVariableNames);
  const propsOptimizations = getPropsOptimizations(params[0], derivedName);
  const propsOptimizationsAst = propsOptimizations.flatMap(
    (c) => parseCodeToAST(c).body[0],
  );
  const componentBody = getComponentBody(component);

  if (!propsOptimizations.length) return [];

  // The compiler will add an "derived" argument to the component
  manageWebContextField(component, derivedName, "derived");

  params[0] = {
    type: "Identifier",
    name: PROPS_OPTIMIZATION_IDENTIFIER,
  };

  if (Array.isArray(componentBody)) {
    componentBody.unshift(...propsOptimizationsAst);
  } else if (componentBody === component?.body) {
    component.body = {
      type: "BlockStatement",
      body: [
        ...propsOptimizationsAst,
        {
          type: "ReturnStatement",
          argument: componentBody,
        },
      ],
    };
  }

  // Return the name of the derived props
  return propsOptimizationsAst.map((node: any) => node.declarations[0].id.name);
}
