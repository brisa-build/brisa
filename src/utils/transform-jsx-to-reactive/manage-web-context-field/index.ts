export default function manageWebContextField(
  componentAST: any,
  fieldName: string,
  originalFieldName: string,
) {
  const componentParams =
    componentAST.params ?? componentAST.declarations?.[0]?.init?.params ?? [];
  const property = {
    type: "Property",
    key: {
      type: "Identifier",
      name: originalFieldName,
    },
    value: {
      type: "Identifier",
      name: fieldName,
    },
    kind: "init",
    computed: false,
    method: false,
    shorthand: fieldName === originalFieldName,
  };

  // convert function () {} to function ({}) {}
  if (!componentParams?.length) {
    componentParams.push({
      type: "ObjectPattern",
      properties: [],
    });
  }

  // convert function ({}) {} to function ({}, { effect }) {}
  if (componentParams?.length === 1) {
    componentParams.push({
      type: "ObjectPattern",
      properties: [property],
    });
  }
  // convert function ({}, { state }) {} to function ({}, { state, effect }) {}
  else if (componentParams[1]?.type === "ObjectPattern") {
    const existFieldName = componentParams[1].properties.some(
      (prop: any) => prop.key.name === originalFieldName,
    );
    if (!existFieldName) componentParams[1].properties.push(property);
  }
  // convert function ({}, context) {} to function ({ effect, ...context }) {}
  else if (componentParams[1]?.type === "Identifier") {
    const props = componentParams[1];
    componentParams[1] = {
      type: "ObjectPattern",
      properties: [
        property,
        {
          type: "RestElement",
          argument: props,
        },
      ],
    };
  }

  // Replace all introduced effect calls by the compiler with the new field name (effect -> effect$)
  // these cases are rare, but they can happen when the user uses some variable named "effect"
  if (originalFieldName === "effect" && originalFieldName !== fieldName) {
    for (let statement of componentAST.body.body) {
      if (statement.isEffect) {
        statement.expression.callee.name = fieldName;
      }
    }
  }
}
