---
description: Learn how to set up Brisa with Bun test runner
---

# Testing Introduction

Brisa utilizes the [Bun test runner](https://bun.sh/docs/cli/test) to execute tests, coupled with [@happy-dom/global-registrator](https://github.com/capricorn86/happy-dom/wiki/Global-Registrator) for DOM manipulation within the tests. Additionally, Brisa exposes a [testing API](/building-your-application/testing/test-api) and extends [test matchers](/building-your-application/testing/matchers) with to streamline integration with components in the tests.

## Getting started

To use tests in Brisa, you need to have the `bunfig.toml` file on the root of the project with this configuration:

```toml
[test]
preload = "brisa/test"
```

This allows to preload all the [matchers](/building-your-application/testing/matchers) from Brisa and it will also take care of loading [happy-dom](https://github.com/capricorn86/happy-dom) library in case you don't have it as `devDependencies`, which is a prerequisite that `brisa/test` needs to run DOM tests.

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

#### Component testing

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
import { render, userEvent } from "brisa/test";
import { test, expect } from "bun:test";

// Imagine that Button and App are two different
// imports from different files.
function Button() {
  return <button onClick={() => console.log("clicked")}>Click me</button>;
}

function App() {
  return <Button />;
}

test("integration", async () => {
  const { container } = await render(<App />);
  const button = container.querySelector("button");

  expect(button).toHaveTextContent("Click me");

  await userEvent.click(button);
  expect(console.log).toHaveBeenCalledWith("clicked");
});
```

### End-to-End (E2E) Testing

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
  expect(container).toMatchSnapshot();
});
```

To update snapshots, use the `--update-snapshots` flag.

```sh
bun test --update-snapshots
```
