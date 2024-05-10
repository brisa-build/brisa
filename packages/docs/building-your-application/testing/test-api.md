---
description: Learn how to use the testing API in Brisa
---

# Testing API

Brisa exposes a testing API that extends the Bun test runner with custom APIs to streamline the testing process. These APIs are designed to simplify the testing of Brisa components and their behavior.

## `render`

Renders a Brisa component into a container and returns a set of actions to interact with the component.

Example:

```tsx
import { render } from "brisa/test";
import { test, expect } from "bun:test";

function Button() {
  return <button onClick={() => console.log("clicked")}>Click me</button>;
}

test("component", async () => {
  const { container } = await render(<Button />);
  const button = container.querySelector("button");

  expect(button).toHaveTextContent("Click me");
});
```

The second argument is an optional `baseElement` that you can use to render the component into a specific element (by default, it uses the `document.documentElement`).

Example:

```tsx
import { render } from "brisa/test";
import { test, expect } from "bun:test";

test("component", async () => {
  const baseElement = document.createElement("div");
  await render(<button>Click me</button>, baseElement);

  expect(baseElement.querySelector("button")).toHaveTextContent("Click me");
});
```

Types:

```ts
render(element: JSX.Element | Response | string, baseElement?: HTMLElement
): Promise<{ container: HTMLElement, unmount: () => void }>;
```

## `serveRoute`

Request a Brisa route and return the [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response). These routes can be API endpoints, pages, assets, or any other type of route.

Example:

```tsx
import { serveRoute } from "brisa/test";
import { test, expect } from "bun:test";

test("route", async () => {
  const response = await serveRoute("/api/hello");
  const data = await response.json();

  expect(data).toEqual({ message: "Hello, world!" });
});
```

For the pages, you can use it with the `render` function to render the page:

```tsx
import { render, serveRoute } from "brisa/test";
import { test, expect } from "bun:test";

test("page", async () => {
  const response = await serveRoute("/about");
  const { container } = await render(response);

  expect(container).toHaveTextContent("About us");
});
```

> [!TIP]
>
> You can use `render` after `serveRoute` to render the page and interact with it, and you can pass the `response` or the `response.text()` directly to the `render` function.

Types:

```ts
serveRoute(route: string): Promise<Response>;
```

## `userEvent`

Simulates user events on a target element.

Example:

```tsx
import { render, userEvent } from "brisa/test";
import { test, expect } from "bun:test";

test("user event", async () => {
  const { container } = await render(<button>Click me</button>);
  const button = container.querySelector("button");

  await userEvent.click(button); // Simulate a click event
});
```

Each method simulates a different user event:

- `click`: Simulates a click event.
  ```js
  await userEvent.click(button);
  ```
- `dblClick`: Simulates a double click event.
  ```js
  await userEvent.dblClick(button);
  ```
- `type`: Simulates typing text into an input.
  ```js
  await userEvent.type(input, "Hello, world!");
  ```
- `hover`: Simulates hovering over an element.
  ```js
  await userEvent.hover(element);
  ```
- `unhover`: Simulates unhovering an element.
  ```js
  await userEvent.unhover(element);
  ```
- `focus`: Simulates focusing on an element.
  ```js
  await userEvent.focus(input);
  ```
- `blur`: Simulates blurring an element.
  ```js
  await userEvent.blur(input);
  ```
- `select`: Simulates selecting an option from a dropdown.
  ```js
  await userEvent.select(select, "option-1");
  ```
- `deselect`: Simulates deselecting an option from a dropdown.
  ```js
  await userEvent.deselect(select, "option-1");
  ```
- `upload`: Simulates uploading a file.
  ```js
  await userEvent.upload(input, file);
  ```
- `clear`: Simulates clearing an input.
  ```js
  await userEvent.clear(input);
  ```
- `tab`: Simulates pressing the tab key.
  ```js
  await userEvent.tab();
  ```
- `paste`: Simulates pasting text into an input.
  ```js
  await userEvent.paste(input, "Hello, world!");
  ```

Types:

```ts
userEvent: {
  click(element: Element): Promise<void>;
  dblClick(element: Element): Promise<void>;
  type(element: Element, text: string): Promise<void>;
  hover(element: Element): Promise<void>;
  unhover(element: Element): Promise<void>;
  focus(element: Element): Promise<void>;
  blur(element: Element): Promise<void>;
  select(element: Element, value: string): Promise<void>;
  deselect(element: Element, value: string): Promise<void>;
  upload(element: Element, file: File): Promise<void>;
  clear(element: Element): Promise<void>;
  tab(): Promise<void>;
  paste(element: Element, text: string): Promise<void>;
};
```

## `waitFor`

Waits for a condition to be true before continuing with the test. This is useful when you need to wait for an element to be visible, for example, when testing animations or asynchronous behavior.

Example:

```tsx
import { render, waitFor } from "brisa/test";
import { test, expect } from "bun:test";

test("wait for", async () => {
  const { container } = await render(<button>Click me</button>);
  const button = container.querySelector("button");

  await waitFor(() => expect(button).toBeVisible());
});
```

Types:

```ts
waitFor(condition: () => void): Promise<void>;
```

## `debug`

Prints the HTML of the rendered component to the console in a readable format.

Example:

```tsx
import { render, debug } from "brisa/test";
import { test, expect } from "bun:test";

test("debug", async () => {
  const { container } = await render(<button>Click me</button>);
  debug();
});
```

Types:

```ts
debug(): void;
```
