import { ESTree } from "meriyah";
import generateUniqueVariableName from "@/utils/client-build-plugin/generate-unique-variable-name";
import getComponentVariableNames from "@/utils/client-build-plugin/get-component-variable-names";
import getPropsNames, {
  getPropNamesFromExport,
} from "@/utils/client-build-plugin/get-props-names";
import getWebComponentAst from "@/utils/client-build-plugin/get-web-component-ast";
import manageWebContextField from "@/utils/client-build-plugin/manage-web-context-field";
import mapComponentStatics from "@/utils/client-build-plugin/map-component-statics";

type Prop = (ESTree.MemberExpression | ESTree.Identifier) & {
  isSignal?: true;
};

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
  const defaultPropsEntries = Object.entries(defaultPropsValues);

  addDefaultPropsToBody(defaultPropsEntries, component, allVariableNames);

  const declaration = component?.declarations?.[0];
  const params = declaration?.init?.params ?? component?.params ?? [];
  const componentBody = component?.body ?? declaration?.init.body;
  const transformedProps = new Set<string>();

  // Remove props from component params
  for (let propParam of params[0]?.properties ?? []) {
    const propName =
      propParam.value?.left?.name ??
      propParam.value?.name ??
      propParam.key?.name;

    if (
      propParam?.type !== "Property" ||
      !propName ||
      !propsNamesAndRenamesSet.has(propName) ||
      !defaultPropsValues[propName] ||
      propParam?.value?.right?.value !== defaultPropsValues[propName]?.value
    ) {
      continue;
    }

    propParam.value = {
      type: "Identifier",
      name: propName,
    };
  }

  function isExistingPropName(field: any) {
    let result = false;

    JSON.stringify(field, (k, v) => {
      if (v?.type === "Identifier" && registeredProps.has(v?.name)) {
        result = true;
      }
      return result ? null : v;
    });

    return result;
  }

  function isObjectPatternProp(value: any) {
    const type = value?.id?.type ?? value?.type;
    const properties = value?.id?.properties ?? value?.properties;
    return type === "ObjectPattern" && properties.some?.(isExistingPropName);
  }

  function isSomeItemPropName(v: any) {
    return (
      isExistingPropName(v) ||
      v?.some?.(isExistingPropName) ||
      v?.some?.(isObjectPatternProp) ||
      isObjectPatternProp(v)
    );
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
      value?.type !== "VariableDeclaration" &&
      value?.type !== "FunctionDeclaration"
    ) {
      return value;
    }

    if (
      isSomeItemPropName(value?.declarations) ||
      value?.params?.some?.(isSomeItemPropName)
    ) {
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

// Set default props values inside component body
function addDefaultPropsToBody(
  defaultPropsEntries: [string, ESTree.Literal, string?][],
  component: any,
  allVariableNames: Set<string>,
) {
  let isAddedDefaultProps = false;
  const componentBody =
    component?.body?.body ??
    component?.body ??
    component?.declarations?.[0]?.init?.body?.body ??
    component?.declarations?.[0]?.init?.body;

  for (let [propName, propValue, usedOperator = "??"] of defaultPropsEntries) {
    const operator =
      ((propValue as any)?.usedOperator ?? usedOperator) === "??"
        ? "??="
        : "||=";

    let identifier;

    let prop: Prop = identifier
      ? {
          type: "MemberExpression",
          object: {
            type: "Identifier",
            name: identifier,
          },
          property: {
            type: "Identifier",
            name: propName,
          },
          computed: false,
        }
      : {
          type: "Identifier",
          name: propName,
        };

    const effectStatement = {
      type: "ExpressionStatement",
      isEffect: true,
      expression: {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: "effect",
        },
        arguments: [
          {
            type: "ArrowFunctionExpression",
            params: [],
            body: {
              type: "AssignmentExpression",
              left: prop,
              operator,
              right: propValue,
            },
            async: false,
            expression: true,
          },
        ],
      },
    } as ESTree.ExpressionStatement;

    if (Array.isArray(componentBody)) {
      componentBody.unshift(effectStatement);
    } else if (componentBody === component?.body) {
      component.body = {
        type: "BlockStatement",
        body: [
          effectStatement,
          {
            type: "ReturnStatement",
            argument: componentBody,
          },
        ],
      };
    }

    isAddedDefaultProps = true;
  }

  // The compiler will add an "effect" argument to the component
  if (isAddedDefaultProps) {
    manageWebContextField(
      component,
      generateUniqueVariableName("effect", allVariableNames),
      "effect",
    );
  }
}
