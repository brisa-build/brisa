---
description: Determines if an object is an instance of the Throwable class.
---

# throwable

`throwable` is an object that contains methods to check if an error is an internal Brisa trowable. It is used to handle specific scenarios such as re-rendering, navigation, and not-found errors.

- **throwable.is**: checks **all** throwable types.
- **throwable.isRerender** checks if an error is a re-render throwable (from [`rerenderInAction`](/api-reference/server-apis/rerenderInAction) API).
- **throwable.isNavigate** checks if an error is a navigate throwable (from [`navigate`](/api-reference/functions/navigate) API).
- **throwable.isNotFound** checks if an error is a not-found throwable (from [`notFound`](/api-reference/functions/notFound) API).

## Reference

### `throwable.is(error: Error): boolean`

The `throwable.is` function checks if a given error is some of the Brisa throwables: re-rendering, navigation, and not-found errors.

## Example usage

```tsx
import {throwable} from "brisa";

// ...
catch (error) {
  if (throwable.is(error)) throw error;
}
```

#### Parameters:

- `error`: The error object that needs to be checked if it's a `Throwable`.

#### Returns:

- A `boolean` indicating whether the provided error is an instance of the `Throwable` class.

## Submethods

### `throwable.isRerender(error: Error): boolean`

Determines if an error is a `Throwable` instance for re-rendering.

```tsx
import {throwable} from "brisa";

// ...
catch (error) {
  if (throwable.isRerender(error)) {
    console.log("It's a rerender throwable!");
  }
}
```

#### Parameters:

- `error`: The error object that needs to be checked if it's a `rerender` throwable.

#### Returns:

- A `boolean` indicating whether the provided error is an instance of the `rerender` throwable.

### `throwable.isNavigate(error: Error): boolean`

Determines if an error is a `Throwable` instance for navigation.

```tsx
import {throwable} from "brisa";

// ...
catch (error) {
  if (throwable.isNavigate(error)) {
    console.log("It's a navigate throwable!");
  }
}
```

#### Parameters:

- `error`: The error object that needs to be checked if it's a `navigate` throwable.

#### Returns:

- A `boolean` indicating whether the provided error is an instance of the `navigate` throwable.

### `throwable.isNotFound(error: Error): boolean`

Determines if an error is a `Throwable` instance for not-found errors.

```tsx
import {throwable} from "brisa";

// ...
catch (error) {
  if (throwable.isNotFound(error)) {
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
interface Throwable {
  is: (error: Error) => boolean;
  isRerender: (error: Error) => boolean;
  isNavigate: (error: Error) => boolean;
  isNotFound: (error: Error) => boolean;
}

export const throwable: Throwable;
```