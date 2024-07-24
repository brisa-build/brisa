import type { Controller } from '@/utils/extend-stream-controller';
import isAnAction from '@/utils/is-an-action';

const ACTION_PREFIX = 'data-action';

export default function processServerComponentProps(
  props: Record<string, unknown>,
  parentProps?: Record<string, unknown>,
  controller?: Controller,
) {
  const processedProps: Record<string, unknown> = {};
  let actions: unknown[] | undefined;

  for (const prop in props) {
    const key = prop.toLowerCase();
    const actionIdKey = `${ACTION_PREFIX}-${key}`;
    const value = props[prop];

    // It is necessary that it continues being a function, if you make console.log
    // of the props or use the function in the own rendering of the component
    // instead of an action it should still work. However, adding the actionId
    // property to the function then makes it much easier from render-attributes
    // to rebuild the data-action attributes again.
    if (typeof value === 'function' && actionIdKey in props && !('actionId' in value)) {
      if (!actions) {
        actions = getActionDependencies(parentProps, controller?.getParentComponentId());
      }

      Object.assign(value, {
        actionId: props[actionIdKey],
        actions,
        cid: controller?.getComponentId(),
      });
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

function getActionDependencies(parentProps?: Record<string, unknown>, componentId = '') {
  const parentDependencies = [];
  let grandparentsDependencies;

  // It is necessary to register the dependencies of the actions that are in the props
  // of the parent component because many times from an action could be called to another
  // one and we want the actions to work similar to the browsers events.
  for (const parentProp in parentProps) {
    const action = parentProps[parentProp];

    if (isAnAction(action)) {
      parentDependencies.push([parentProp, action.actionId, componentId]);

      if (!grandparentsDependencies && Array.isArray(action.actions) && action.actions.length > 0) {
        grandparentsDependencies = action.actions;
      }
    }
  }

  return parentDependencies.length ? [parentDependencies, ...(grandparentsDependencies ?? [])] : [];
}
