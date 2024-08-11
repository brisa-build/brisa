---
description: Determines if an object is an instance of the Throwable class.
---

# isThrowable

## Reference

### `isThrowable(error: Error): boolean`

The `isThrowable` function checks if a given object is an instance of the Brisa Throwable class. In Brisa, `Throwable` instances are used to handle specific scenarios such as re-rendering, navigation, and not-found errors:

- **rerender** from [`rerenderInAction`](/api-reference/server-apis/rerenderInAction) API.
- **navigate** from [`navigate`](/api-reference/functions/navigate) API.
- **notFound** from [`notFound`](/api-reference/functions/notFound) API.

## Example usage

```tsx
import { isThrowable } from "brisa";

// ...
catch (error) {
  if (isThrowable(error)) throw error;
}
```

#### Parameters:

- `error`: The error object that needs to be checked if it's a `Throwable`.

#### Returns:

- A `boolean` indicating whether the provided error is an instance of the `Throwable` class.

## Submethods

### `isThrowable.rerender(error: Error): boolean`

Determines if an object is an instance of the Brisa Throwable class for re-rendering.

```tsx
import { isThrowable } from "brisa";

// ...
catch (error) {
  if (isThrowable.rerender(error)) {
    console.log("It's a rerender throwable!");
  }
}
```

#### Parameters:

- `error`: The error object that needs to be checked if it's a `rerender` throwable.

#### Returns:

- A `boolean` indicating whether the provided error is an instance of the `rerender` throwable.

### `isThrowable.navigate(error: Error): boolean`

Determines if an object is an instance of the Brisa Throwable class for navigation.

```tsx
import { isThrowable } from "brisa";

// ...
catch (error) {
  if (isThrowable.navigate(error)) {
    console.log("It's a navigate throwable!");
  }
}
```

#### Parameters:

- `error`: The error object that needs to be checked if it's a `navigate` throwable.

#### Returns:

- A `boolean` indicating whether the provided error is an instance of the `navigate` throwable.

### `isThrowable.notFound(error: Error): boolean`

Determines if an object is an instance of the Brisa Throwable class for not-found errors.

```tsx
import { isThrowable } from "brisa";

// ...
catch (error) {
  if (isThrowable.notFound(error)) {
    console.log("It's a not-found throwable!");
  }
}
```

#### Parameters:

- `error`: The error object that needs to be checked if it's a `notFound` throwable.

#### Returns:

- A `boolean` indicating whether the provided error is an instance of the `notFound` throwable.


## Types

```ts
interface IsThrowable extends Function {
  (error: Error): boolean;
  rerender: (error: Error) => boolean;
  navigate: (error: Error) => boolean;
  notFound: (error: Error) => boolean;
}

export const isThrowable: IsThrowable;
```å