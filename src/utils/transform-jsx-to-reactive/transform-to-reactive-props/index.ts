import { ESTree } from "meriyah";
import generateUniqueVariableName from "@/utils/transform-jsx-to-reactive/generate-unique-variable-name";
import getComponentVariableNames from "@/utils/transform-jsx-to-reactive/get-component-variable-names";
import getPropsNames, {
  getPropNamesFromExport,
} from "@/utils/transform-jsx-to-reactive/get-props-names";
import getWebComponentAst from "@/utils/transform-jsx-to-reactive/get-web-component-ast";
import manageWebContextField from "@/utils/transform-jsx-to-reactive/manage-web-context-field";
import mapComponentStatics from "@/utils/transform-jsx-to-reactive/map-component-statics";

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
  const allVariableNames = new Set([...propsNames, ...componentVariableNames]);
  const defaultPropsEntries = Object.entries(defaultPropsValues);

  addDefaultPropsToBody(defaultPropsEntries, component, allVariableNames);

  const declaration = component?.declarations?.[0];
  const params = declaration?.init?.params ?? component?.params ?? [];
  const componentBody = component?.body ?? declaration?.init.body;

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

  const newComponentBody = JSON.parse(
    JSON.stringify(componentBody),
    function (key, value) {
      // Avoid adding .value in:
      //  const { foo: a, bar: b } = props
      // We don't want this:
      //  const { foo: a.value, bar: b.value } = props.value
      if (this?.type === "VariableDeclarator" && this.id === value) {
        return JSON.parse(JSON.stringify(value), (key, value) => {
          return value?.isSignal ? value.object : value;
        });
      }

      const isPropFromObjectExpression =
        this?.type === "Property" && this?.key === value;

      if (
        value?.type === "Identifier" &&
        propsNamesAndRenamesSet.has(value?.name) &&
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
    },
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
