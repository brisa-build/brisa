---
description: RenderInitiator is an object that contains properties to determine the initiator of a render.
---

# `RenderInitiator`

Similar to an enum, `RenderInitiator` is an object that contains the following properties:

- `INITIAL_REQUEST`: Indicates that the rendering was initiated by an initial request.
- `SPA_NAVIGATION`: Indicates that the rendering was initiated by a SPA navigation.
- `SERVER_ACTION`: Indicates that the rendering was initiated by a server action.

## Example usage:

In the next example, we use `RenderInitiator` to determine if the render was initiated by a server action.

```tsx 4
import { RenderInitiator } from 'brisa';

export default function MyComponent(props, { renderInitiator }) {
  const isAnAction = renderInitiator === RenderInitiator.SERVER_ACTION;
  return (
    <div>
      {isAnAction ? 'This is a rerender from an action' : 'Another type of render'}
    </div>
  );
}
```

## Types:

```tsx
export interface RenderInitiatorType {
  readonly INITIAL_REQUEST: 'INITIAL_REQUEST';
  readonly SPA_NAVIGATION: 'SPA_NAVIGATION';
  readonly SERVER_ACTION: 'SERVER_ACTION';
}

export const RenderInitiator: RenderInitiatorType;
```