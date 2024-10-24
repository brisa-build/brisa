---
description: Initiator is an object that contains properties to determine the initiator of a request.
---

# `Initiator`

Similar to an enum, `Initiator` is an object that contains the following properties:

- `INITIAL_REQUEST`: Indicates that the rendering was initiated by an initial request.
- `SPA_NAVIGATION`: Indicates that the rendering was initiated by a SPA navigation.
- `SERVER_ACTION`: Indicates that the rendering was initiated by a server action.
- `API_REQUEST`: Indicates that the rendering was initiated by an API request.

## Example usage:

In the next example, we use `Initiator` to determine if the render was initiated by a server action.

```tsx 4
import { Initiator } from "brisa";

export default function MyComponent(props, { initiator }) {
  const isAnAction = renderInitiator === Initiator.SERVER_ACTION;
  return (
    <div>
      {isAnAction
        ? "This is a rerender from an action"
        : "Another type of render"}
    </div>
  );
}
```

## Types:

```tsx
export interface InitiatorType {
  readonly INITIAL_REQUEST: "INITIAL_REQUEST";
  readonly SPA_NAVIGATION: "SPA_NAVIGATION";
  readonly SERVER_ACTION: "SERVER_ACTION";
  readonly API_REQUEST: "API_REQUEST";
}

export const Initiator: InitiatorType;
```
