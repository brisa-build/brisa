---
description: Learn how to set up Brisa with Bun test runner and Playwright.
---

# Testing

In Brisa, there are a few different types of tests you can write, each with its own purpose and use cases. This page provides an overview of types and commonly used tools you can use to test your application.

## Types of tests

- **Unit testing** involves testing individual units (or blocks of code) in isolation. In Brisa, a unit can be a single function or component.
  - **Component testing** is a more focused version of unit testing where the primary subject of the tests is Brisa components. This may involve testing how components are rendered, their interaction with props, and their behavior in response to user events.
  - **Integration testing** involves testing how multiple units work together. This can be a combination of components and functions.
- **End-to-End (E2E) Testing** involves testing user flows in an environment that simulates real user scenarios, like the browser. This means testing specific tasks (e.g. signup flow) in a production-like environment.
- **Snapshot testing** involves capturing the rendered output of a component and saving it to a snapshot file. When tests run, the current rendered output of the component is compared against the saved snapshot. Changes in the snapshot are used to indicate unexpected changes in behavior.

## Guides

See the guides below to learn how to set up Brisa with these commonly used testing tools:

TODO: Implement the testing tooling + these guides
