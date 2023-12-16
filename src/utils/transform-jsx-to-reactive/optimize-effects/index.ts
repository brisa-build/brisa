import { ESTree } from "meriyah";

type EffectNode = ESTree.CallExpression & { effectDeps: string[] };
type WebContextDetails = {
  effectName: string;
  cleanupName: string;
  identifier?: string;
};
type Properties = (
  | ESTree.Property
  | ESTree.RestElement
  | ESTree.CallExpression["callee"]
)[];

const DECLARATION_NODE_TYPES = new Set([
  "FunctionDeclaration",
  "VariableDeclarator",
]);

const EFFECT_EXECUTION_TYPES = new Set([
  "CallExpression",
  "FunctionDeclaration",
]);

/**
 * Optimizes effects doing 2 things:
 *
 * 1. Register each sub-effect of each effect function with the 'r' function. These way each time
 *    an effect is called, all its sub-effects are cleaned up and re-registered.
 * 2. Pass the effect id to the cleanup function so it can be cleaned up individually.
 *
 * @param {ESTree.FunctionDeclaration} componentBranch - The component branch to optimize.
 * @param {Set<string>} allVariableNames - Set of all variable names declared in the component's scope.
 * @returns {ESTree.FunctionDeclaration} The optimized component branch.
 *
 * @example
 * const optimizedComponent = optimizeEffects(componentBranch, variableNamesSet);
 */
export default function optimizeEffects(
  componentBranch: ESTree.FunctionDeclaration,
  allVariableNames = new Set<string>(),
): ESTree.FunctionDeclaration {
  const webContextAst = componentBranch.params[1];

  if (!webContextAst) return componentBranch;

  const webContextDetails: WebContextDetails = {
    effectName: "effect",
    cleanupName: "cleanup",
  };

  const { assignRNameToNode, getRNameFromIdentifier, getEffectIdentifier } =
    getSubEffectManager(allVariableNames);

  if (webContextAst.type === "ObjectPattern") {
    const modified = setWebContextProperties(webContextAst.properties);
    if (!modified) return componentBranch;
  } else if (webContextAst.type === "Identifier") {
    webContextDetails.identifier = webContextAst.name;
  }

  return {
    ...componentBranch,
    body: {
      ...componentBranch.body,
      body: JSON.parse(
        JSON.stringify(
          JSON.parse(JSON.stringify(componentBranch.body?.body, traverseA2B)),
          traverseAgainA2B,
        ),
        traverseB2A,
      ),
    },
  } as ESTree.FunctionDeclaration;

  // The first traverse is needed to get the effect identifier, the cleanup
  // identifier, and assign 'r' names to effects params and propagate effect
  // dependencies to inner effects
  function traverseA2B(this: any, key: string, node: any) {
    if (
      node?.type === "VariableDeclaration" &&
      node?.declarations[0]?.id?.type === "ObjectPattern" &&
      webContextDetails.identifier === node?.declarations[0]?.init?.name
    ) {
      setWebContextProperties(node?.declarations[0]?.id?.properties);
    }

    if (node?.callee?.name === webContextDetails.effectName) {
      assignRNameToNode(node, { parent: this });
    }

    propagateEffectDeps(node, this);

    return node;
  }

  // This second traverse, once we have the effect identifier, is needed to
  // add the effectDeps to the effect function.
  // ex: effect(someFn); function someFn(r) {} // adding 'r' as dependency
  function traverseAgainA2B(this: any, key: string, node: any) {
    if (
      DECLARATION_NODE_TYPES.has(node?.type) &&
      node?.id?.name === getEffectIdentifier()
    ) {
      return JSON.parse(
        JSON.stringify(node, (k, v) => {
          if (v?.constructor === Object)
            v.effectDeps = [getRNameFromIdentifier(node?.id?.name)];
          return v;
        }),
      );
    }

    return node;
  }

  // This third traverse is needed to:
  // - wrap each sub-effect function with its dependencies
  //   ex: effect((r) => effect(r1 => {})) --> effect((r) => effect(r(r1 => {})));
  // - add 'r.id' as second parameter to cleanups used inside effects
  function traverseB2A(this: any, key: string, node: any) {
    if (
      DECLARATION_NODE_TYPES.has(node?.type) &&
      node?.id?.name === getEffectIdentifier()
    ) {
      return transformInnerEffect(node, this);
    }

    if (
      node?.callee?.property?.name &&
      node?.callee?.object?.name !== webContextDetails.identifier
    ) {
      return node;
    }

    const name = node?.callee?.name ?? node?.callee?.property?.name;

    if (name !== webContextDetails.effectName) return node;

    return transformInnerEffect(node, this);
  }

  // This function is called to each sub-effect function to wrap it with
  // its dependencies and to add 'r.id' as second parameter to cleanups
  // used inside effects
  function transformInnerEffect(effect: EffectNode, parent: EffectNode) {
    const effectIdentifier = (effect as any)?.id?.name;
    const takenName = getRNameFromIdentifier(effectIdentifier);

    if (takenName) {
      effect.effectDeps = [takenName];
      assignRNameToNode(effect, { takenName, parent });
    }

    const parser = (key: string, innerVal: any) => {
      if (!EFFECT_EXECUTION_TYPES.has(innerVal?.type)) return innerVal;
      if (
        innerVal?.callee?.property?.name &&
        innerVal?.callee?.object?.name !== effectIdentifier
      ) {
        return innerVal;
      }

      const innerName =
        innerVal?.callee?.name ?? innerVal?.callee?.property?.name;

      if (innerName !== webContextDetails.cleanupName) return innerVal;

      // Add 'r.id' as second parameter to cleanups used inside effects
      const arg = {
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: innerVal.effectDeps?.[0] ?? rName,
        },
        property: { type: "Identifier", name: "id" },
        computed: false,
      };

      return {
        ...innerVal,
        arguments: [innerVal.arguments[0], arg],
      };
    };

    const rName = effect.effectDeps?.[0];
    const param = { type: "Identifier", name: rName };
    const modifiedEffect = JSON.parse(JSON.stringify(effect), parser);

    if (modifiedEffect.params) {
      modifiedEffect.params = [param];
    } else if (modifiedEffect.init) {
      modifiedEffect.init.params = [param];
    } else if (modifiedEffect?.arguments) {
      modifiedEffect.arguments[0].params = [param];
    }

    return wrapEffectWithDependencies(modifiedEffect, parent);
  }

  // This function is called to set the effect name, cleanup name and identifier
  // from the webContext properties that have all web components as second parameter
  //
  // ex: here "e" is the effect name and "c" is the cleanup name:
  // const Component = (props, {state, effect: e, cleanup: c}) => {}
  //
  function setWebContextProperties(properties: Properties) {
    let setted = false;

    for (let property of properties) {
      const { key, value, type } = property;

      if (type === "RestElement") {
        webContextDetails.identifier = (property as any).argument.name;
        setted = true;
        continue;
      }

      if (key.type !== "Identifier" || value.type !== "Identifier") continue;
      if (key.name === webContextDetails.effectName) {
        webContextDetails.effectName = value.name;
        setted = true;
      }
      if (key.name === webContextDetails.cleanupName) {
        webContextDetails.cleanupName = value.name;
        setted = true;
      }
    }

    return setted;
  }
}

/**
 * Add effect dependencies array to the node or array node items to propagate it.
 *
 * @param {any} value - The object or array of objects to which to add effect dependencies.
 * @param {any} parent - The parent object containing the effect dependencies.
 *
 * @example
 * propagateEffectDeps(value, parent);
 */
function propagateEffectDeps(node: EffectNode, parent: EffectNode) {
  if (typeof node !== "object" || node === null || node.effectDeps) return;

  if (Array.isArray(node)) {
    for (let item of node) propagateEffectDeps(item, parent);
    return;
  }

  if (!Array.isArray(parent) && parent.effectDeps) {
    node.effectDeps = parent.effectDeps;
    return;
  }
}

/**
 * Wraps an effect function with its dependencies.
 *
 * @param {any} effect - The effect function or object to be wrapped.
 * @param {any} parent - The parent object containing information about dependencies.
 * @returns {any} The modified effect function or object with dependencies wrapped.
 *
 * @example
 * const wrappedEffect = wrapEffectWithDependencies(effect, parent);
 */
function wrapEffectWithDependencies(effect: EffectNode, parent: EffectNode) {
  const deps = parent.effectDeps ?? [];
  let newEffectNode: EffectNode = effect;

  for (const depName of deps) {
    const innerFn = (newEffectNode.arguments?.[0] ??
      newEffectNode) as EffectNode;

    if (depName === innerFn?.callee?.name) continue;

    const callStatement: EffectNode = {
      type: "CallExpression",
      callee: {
        type: "Identifier",
        name: depName,
      },
      arguments: [innerFn],
      effectDeps: deps,
    };

    if (newEffectNode.arguments) newEffectNode.arguments = [callStatement];
    else newEffectNode = callStatement;
  }

  return newEffectNode;
}

/**
 * Generates a function that creates unique names for 'r' variables.
 * It checks if the name is already used by a variable declared in the component
 * or in the component's scope. If the name is taken, it appends '$' to the end of the name.
 *
 * @param {Set<string>} allVariableNames - Set of all variable names declared in the component's scope.
 * @returns {Function} A function that generates unique names for 'r' variables.
 *
 * @example
 * const generateUniqueRName = getRNameGenerator(allVariableNames);
 * generateUniqueRName(); // Returns 'r'
 * generateUniqueRName(); // Returns 'r1'
 * generateUniqueRName(); // Returns 'r2$' (if 'r2' is already taken)
 */
function getRNameGenerator(allVariableNames: Set<string>) {
  const registeredRNames = new Set<string>();
  let count = 0;

  return () => {
    let defaultName = `r${count ? count : ""}`;

    // Update the name if it's already taken adding a '$' at the end
    while (
      registeredRNames.has(defaultName) ||
      allVariableNames.has(defaultName)
    ) {
      defaultName += "$";
    }

    registeredRNames.add(defaultName);
    count += 1;

    return defaultName;
  };
}

/**
 * Provides a manager for handling sub-effects within the optimizeEffects function.
 *
 * This manager handles the registration of sub-effects with the 'r' function and
 * manages the assignment of unique 'r' variable names.
 *
 * @param {Set<string>} allVariableNames - Set of all variable names already declared
 * @returns {{
 *   getRNameFromIdentifier: (identifier: string) => string | undefined,
 *   getEffectIdentifier: () => string | undefined,
 *   assignRNameToNode: (node: any, options: { takenName?: string; parent: any }) => void
 * }}
 *
 * @example
 * const { getRNameFromIdentifier, getEffectIdentifier, assignRNameToNode } = getSubEffectManager(variableNamesSet);
 * const rName = getRNameFromIdentifier("someIdentifier");
 * const effectId = getEffectIdentifier();
 * assignRNameToNode(node, { takenName: "takenName", parent: parentNode });
 */
function getSubEffectManager(allVariableNames: Set<string>) {
  const generateUniqueRName = getRNameGenerator(allVariableNames);
  const identifierRName = new Map<string, string>();
  let effectIdentifier: string | undefined;

  return {
    getRNameFromIdentifier: (identifier: string) =>
      identifierRName.get(identifier),
    getEffectIdentifier: () => effectIdentifier,
    assignRNameToNode: (
      node: any,
      { takenName, parent }: { takenName?: string; parent: any },
    ) => {
      const args = node?.arguments?.[0] ?? {};

      let rName =
        takenName ??
        node?.init?.params?.[0]?.name ??
        args.params?.[0]?.name ??
        generateUniqueRName();

      node.effectDeps = Array.from(
        new Set([
          rName,
          ...(parent?.effectDeps ?? []),
          ...(node?.effectDeps ?? []),
        ]),
      );

      if (args.type === "Identifier") {
        effectIdentifier = args.name;
        identifierRName.set(args.name, rName);
      }
    },
  };
}
