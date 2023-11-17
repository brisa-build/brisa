import { ESTree } from "meriyah";

export default function getComponentVariableNames(
  componentBranch: ESTree.FunctionDeclaration
) {
  const varNames = new Set<string>([]);

  JSON.stringify(componentBranch, (key, value) => {
    // const somevar = "Aral" -> register somevar as a variable
    if (value?.type === "VariableDeclarator" && value.id.name) {
      varNames.add(value.id.name);
    }

    // somevar.name -> register somevar as a variable
    if (
      value?.object?.type === "Identifier" &&
      value?.property?.type === "Identifier"
    ) {
      varNames.add(value?.object?.name);
    }

    // const { name } = somevar -> register "somevar" and "name" as a variable
    if (value?.init?.type === "Identifier" && value?.id?.properties) {
      varNames.add(value.init.name);

      for (const prop of value.id.properties) {
        // spread props like: const { ...rest } = props
        if (prop?.type === "RestElement") varNames.add(prop.argument.name);
        // object props like: const { name } = props
        else if (prop?.key?.name) varNames.add(prop.key.name);
      }
    }

    return value;
  });

  return [...varNames];
}
