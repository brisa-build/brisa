const ACTION_PREFIX = "data-action";

export default function processServerComponentProps(
  props: Record<string, unknown>,
) {
  const processedProps: Record<string, unknown> = {};

  for (const prop in props) {
    const key = prop.toLowerCase();
    const actionIdKey = `${ACTION_PREFIX}-${key}`;
    const value = props[prop];

    // It is necessary that it continues being a function, if you make console.log
    // of the props or use the function in the own rendering of the component
    // instead of an action it should still work. However, adding the actionId
    // property to the function then makes it much easier from render-attributes
    // to rebuild the data-action attributes again.
    if (typeof value === "function" && actionIdKey in props) {
      Object.assign(value, { actionId: props[actionIdKey] });
    }

    // These props are injected into build-time in order to manage the actions.
    // In the case of the components we don't need them to be passed below, we
    // only need them here to relate the action with its id and pass it below
    // together with the action.
    //
    // In the render-attributes method then if this case is taken into account
    // to return the data-action properties at the element level.
    if (key.startsWith(ACTION_PREFIX)) continue;

    processedProps[prop] = value;
  }

  return processedProps;
}
