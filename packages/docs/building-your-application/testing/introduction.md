---
description: Learn how to set up Brisa with Bun test runner
---

# Testing Introduction

Brisa utilizes the [Bun test runner](https://bun.sh/docs/cli/test) to execute tests, coupled with [@happy-dom/global-registrator](https://github.com/capricorn86/happy-dom/wiki/Global-Registrator) for DOM manipulation within the tests. Additionally, Brisa exposes a [testing API](/building-your-application/testing/test-api) and extends [test matchers](/building-your-application/testing/matchers) with to streamline integration with components in the tests.

> [!NOTE]
>
> Take a look at the [Bun test runner documentation](https://bun.sh/docs/cli/test) for more information on how to run tests and the available options.

## Getting started

To use tests in Brisa, you need to have the `bunfig.toml` file on the root of the project with this configuration:

```toml
[test]
preload = "brisa/test"
```

This allows to preload all the [matchers](/building-your-application/testing/matchers) from Brisa and it will also take care of initializing [happy-dom](https://github.com/capricorn86/happy-dom) library to manipulate the DOM.

## Testing Server Actions

After rendering the component, you can interact with it thanks to [`userEvent`](#userevent). For example, you can simulate a click event on a button:

```tsx
import { render, userEvent } from "brisa/test";
import { test, mock } from "bun:test";

test("server action test", async () => {
  const mockServerAction = mock(() => {});
  const { container } = await render(
    <button onClick={mockServerAction}>Click me</button>,
  );
  const button = container.querySelector("button");

  userEvent.click(button);

  expect(mockServerAction).toHaveBeenCalled();
});
```

It's very similar to browser events, but it has some differences, for example in `onSubmit` of a form, you can access directly to `event.formData`, because the browser event was already handled by the RPC layer and the form was submitted to the server, converting the [`SubmitEvent`](https://developer.mozilla.org/en-US/docs/Web/API/SubmitEvent) into a [`FormDataEvent`](https://developer.mozilla.org/en-US/docs/Web/API/FormDataEvent).

```tsx
import { render, userEvent } from "brisa/test";
import { test, mock } from "bun:test";

test("server action test", async () => {
  const mockServerAction = mock(() => {});
  const { container } = await render(
    <form onSubmit={(e) => mockServerAction(e.formData.get("name"))}>
      <input type="text" name="name" value="foo" />
      <button type="submit">Submit</button>
    </form>,
  );
  const form = container.querySelector("form");

  userEvent.submit(form);

  expect(mockServerAction).toHaveBeenCalledWith("foo");
});
```

> [!WARNING]
>
> [`rerenderInAction`](/api-reference/server-apis/rerenderInAction), [`navigate`](/api-reference/functions/navigate), and other actions that change the state of the application are not available in the test environment. You can use the [`mock`](https://bun.sh/docs/test/mocks) function to simulate the server action and test the component behavior.

## Testing Web Components

You can also test Web Components after rendering them. For example, you can test a custom element:

```tsx
import { render, userEvent } from "brisa/test";
import { test, expect } from "bun:test";

test("web component", async () => {
  const { container } = await render(<custom-counter />);
  const counter = container.querySelector("custom-counter")!.shadowRoot!;
  const [increment, decrement] = counter.querySelectorAll("button");

  expect(counter).toContainTextContent("0");

  userEvent.click(increment);

  expect(counter).toContainTextContent("1");

  userEvent.click(decrement);

  expect(counter).toContainTextContent("0");
});
```

> [!TIP]
>
> You can use the `shadowRoot` property to access the shadow DOM of a custom element.

## Testing API Endpoints

You can test API endpoints using the [`serveRoute`](/building-your-application/testing/test-api#serveroute) function. This function allows you to request a Brisa route and return the [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response). These routes can be API endpoints, pages, assets, or any other type of route.

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

For the pages, you can use it with the [`render`](/building-your-application/testing/test-api#render) function to render the page:

```tsx
import { render, serveRoute } from "brisa/test";
import { test, expect } from "bun:test";

test("page", async () => {
  const response = await serveRoute("/about");
  const { container } = await render(response);

  expect(container).toHaveTextContent("About us");
});
```

## Types of tests

### Unit testing

Involves testing individual units (or blocks of code) in isolation. In Brisa, a unit can be a single function or component.

Example:

```tsx
import { sum } from "./sum";
import { test, expect } from "bun:test";

test("sum", () => {
  expect(sum(1, 2)).toBe(3);
});
```

#### Component testing

Is a more focused version of unit testing where the primary subject of the tests is Brisa components. This may involve testing how components are rendered, their interaction with props, and their behavior in response to user events.

Example:

```tsx
import { render, userEvent } from "brisa/test";
import { test, expect } from "bun:test";

function Button() {
  return <button onClick={() => console.log("clicked")}>Click me</button>;
}

test("component", async () => {
  const { container } = await render(<Button />);
  const button = container.querySelector("button");

  expect(button).toHaveTextContent("Click me");

  await userEvent.click(button);
  expect(console.log).toHaveBeenCalledWith("clicked");
});
```

#### Integration testing

Involves testing how multiple units work together. This can be a combination of components and functions.

Example:

```tsx
import { render, userEvent, serveRoute } from "brisa/test";
import { test, expect } from "bun:test";

test("integration", async () => {
  const response = await serveRoute("/");
  const { container } = await render(response);
  const button = container.querySelector("button");

  expect(button).toHaveTextContent("Click me");

  await userEvent.click(button);
  expect(console.log).toHaveBeenCalledWith("clicked");
});
```

> [!NOTE]
>
> Brisa provides a [testing API](/building-your-application/testing/test-api) to help you interact with entrypoints and test their behavior. This is not considered full E2E testing because it doesn't simulate real user scenarios like a browser would do, but it can be used to test entrypoints of your application.

### End-to-End (E2E) Testing

Involves testing user flows in an environment that simulates real user scenarios, like the browser. This means testing specific tasks (e.g. signup flow) in a production-like environment.

Example with [Playwright](https://playwright.dev/):

```tsx
import { test, expect } from "bun:test";
import { webkit } from "playwright"; // Or 'chromium' or 'firefox'.

test("e2e", async () => {
  const browser = await webkit.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://example.com");
  await page.screenshot({ path: "screenshot.png" });
  await browser.close();
});
```

> [!NOTE]
>
> Brisa does not provide built-in support for E2E testing. You can use any E2E testing library like [Playwright](https://playwright.dev/), [Cypress](https://www.cypress.io/), or [Puppeteer](https://pptr.dev/).

### Snapshot testing

Involves capturing the rendered output of a component and saving it to a snapshot file. When tests run, the current rendered output of the component is compared against the saved snapshot. Changes in the snapshot are used to indicate unexpected changes in behavior.

Example:

```tsx
import { render } from "brisa/test";
import { test, expect } from "bun:test";

test("snapshot", async () => {
  const { container } = await render(<div>Hello, World!</div>);
  expect(container.innerHTML).toMatchSnapshot();
});
```

To update snapshots, use the `--update-snapshots` flag.

```sh
bun test --update-snapshots
```
