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

- **Unit testing** involves testing individual units (or blocks of code) in isolation. In Brisa, a unit can be a single function or component.
  - **Component testing** is a more focused version of unit testing where the primary subject of the tests is Brisa components. This may involve testing how components are rendered, their interaction with props, and their behavior in response to user events.
  - **Integration testing** involves testing how multiple units work together. This can be a combination of components and functions.
- **End-to-End (E2E) Testing** involves testing user flows in an environment that simulates real user scenarios, like the browser. This means testing specific tasks (e.g. signup flow) in a production-like environment.
- **Snapshot testing** involves capturing the rendered output of a component and saving it to a snapshot file. When tests run, the current rendered output of the component is compared against the saved snapshot. Changes in the snapshot are used to indicate unexpected changes in behavior.
