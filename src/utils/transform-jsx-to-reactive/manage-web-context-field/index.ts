export default function manageWebContextField(
  componentAST: any,
  fieldName: string,
  originalFieldName: string
) {
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
  if (!componentAST.params?.length) {
    componentAST.params.push({
      type: "ObjectPattern",
      properties: [],
    });
  }

  // convert function ({}) {} to function ({}, { h }) {}
  if (componentAST.params?.length === 1) {
    componentAST.params.push({
      type: "ObjectPattern",
      properties: [property],
    });
  }
  // convert function ({}, { state }) {} to function ({}, { state, h }) {}
  else if (componentAST.params[1]?.type === "ObjectPattern") {
    const existH = componentAST.params[1].properties.some(
      (prop: any) => prop.key.name === originalFieldName
    );
    if (!existH) componentAST.params[1].properties.push(property);
  }
  // convert function ({}, context) {} to function ({ h, ...context }) {}
  else if (componentAST.params[1]?.type === "Identifier") {
    const props = componentAST.params[1];
    componentAST.params[1] = {
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
