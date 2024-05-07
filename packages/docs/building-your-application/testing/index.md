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

## Getting started

To use tests in Brisa, you need to have the `bunfig.toml` file on the root of the project with this configuration:

```toml
[test]
preload = "brisa/test"
```

This allows to preload all the matchers from Brisa and it will also take care of loading [happy-dom](https://github.com/capricorn86/happy-dom) library in case you don't have it as `devDependencies`, which is a prerequisite that `brisa/test` needs to run DOM tests.

## Matchers

- `toHaveAttribute`: Verifies whether a specified attribute exists within the target element.
- `toHaveTagName`: Checks if the target element has a specific HTML tag.
- `toHaveRenderedText`: Ensures that the target element renders the expected text content.
- `toContainRenderedText`: Verifies if the rendered text content contains a specific string.
- `toHaveStyle`: Validates the styling properties of the target element.
- `toHaveClass`: Checks for the presence of a specified CSS class within the target element.
- `toHaveValue`: Verifies the current value of form elements such as input fields.
- `toHaveFocus`: Indicates whether the target element currently has focus.
- `toBeVisible`: Checks if the target element is visible within the DOM.
- `toBeEnabled`: Verifies that the target element is enabled and interactive.
- `toBeDisabled`: Indicates whether the target element is disabled and non-interactive.
- `toBeChecked`: Checks if the target element is checked.
- `toBeSelected`: Indicates whether the target element is selected.
- `toBeRequired`: Indicates whether the target element is required.
- `toBeInvalid`: Indicates whether the target element is invalid.
- `toBeValid`: Checks if the target element is valid.
- `toBeInputTypeOf`: Verifies the target element type.

## API
