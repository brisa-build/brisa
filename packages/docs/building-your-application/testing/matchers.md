---
description: Learn about the test matchers that you can use in Brisa
---

# Matchers

Brisa extends the Bun testing runner with custom matchers to streamline the testing process. These matchers are designed to simplify the testing of Brisa components and their behavior.

## `toHaveAttribute`

Verifies whether a specified attribute exists within the target element.

Example:

```ts
expect(element).toHaveAttribute("name", "value");
```

Types:

```ts
toHaveAttribute(name: string, value?: string): void;
```

## `toHaveTagName`

Checks if the target element has a specific HTML tag.

Example:

```ts
expect(div).toHaveTagName("div"); // pass
expect(span).toHaveTagName("div"); // fail
```

Types:

```ts
toHaveTagName(tagName: string): void;
```

## `toHaveTextContent`

Ensures that the target element renders the expected text content.

Example:

```ts
expect(text).toHaveTextContent("text"); // pass
expect(text).toHaveTextContent("xt"); // fail
```

Types:

```ts
toHaveTextContent(text: string): void;
```

## `toContainTextContent`

Verifies if the rendered text content contains a specific string.

Example:

```ts
expect(text).toContainTextContent("text"); // pass
expect(text).toContainTextContent("xt"); // pass
```

Types:

```ts
toContainTextContent(text: string): void;
```

## `toHaveStyle`

Validates the styling properties of the target element.

Example:

```ts
expect(red).toHaveStyle("color", "red"); // pass
expect(red).toHaveStyle("color", "blue"); // fail
```

Types:

```ts
toHaveStyle(property: string, value: string): void;
```

## `toHaveClass`

Checks for the presence of a specified CSS class within the target element.

Example:

```ts
expect(input).toHaveClass("form-control"); // pass
expect(button).toHaveClass("btn-primary"); // pass
```

Types:

```ts
toHaveClass(className: string): void;
```

## `toHaveValue`

Verifies the current value of form elements such as input fields.

Example:

```ts
expect(input).toHaveValue("example");
```

Types:

```ts
toHaveValue(value: string): void;
```

## `toHaveFocus`

Indicates whether the target element currently has focus.

Example:

```ts
expect(input).toHaveFocus();
expect(input).not.toHaveFocus();
```

Types:

```ts
toHaveFocus(): void;
```

## `toBeVisible`

Checks if the target element is visible within the DOM.

Example:

```ts
expect(element).toBeVisible();
expect(element).not.toBeVisible();
```

Types:

```ts
toBeVisible(): void;
```

## `toBeEnabled`

Verifies that the target element is enabled and interactive.

Example:

```ts
expect(button).toBeEnabled();
expect(button).not.toBeEnabled();
```

Types:

```ts
toBeEnabled(): void;
```

## `toBeDisabled`

Indicates whether the target element is disabled and non-interactive.

Example:

```ts
expect(button).toBeDisabled();
expect(button).not.toBeDisabled();
```

Types:

```ts
toBeDisabled(): void;
```

## `toBeChecked`

Checks if the target element is checked.

Example:

```ts
expect(checkbox).toBeChecked();
expect(checkbox).not.toBeChecked();
```

Types:

```ts
toBeChecked(): void;
```

## `toBeSelected`

Indicates whether the target element is selected.

Example:

```ts
expect(option).toBeSelected();
expect(option).not.toBeSelected();
```

Types:

```ts
toBeSelected(): void;
```

## `toBeRequired`

Indicates whether the target element is required.

Example:

```ts
expect(input).toBeRequired();
expect(input).not.toBeRequired();
```

Types:

```ts
toBeRequired(): void;
```

## `toBeInvalid`

Indicates whether the target element is invalid.

Example:

```ts
expect(input).toBeInvalid();
expect(input).not.toBeInvalid();
```

Types:

```ts
toBeInvalid(): void;
```

## `toBeValid`

Checks if the target element is valid.

Example:

```ts
expect(input).toBeValid();
expect(input).not.toBeValid();
```

Types:

```ts
toBeValid(): void;
```

## `toBeInputTypeOf`

Verifies the target element type.

Example:

```ts
expect(input).toBeInputTypeOf("text");
expect(input).not.toBeInputTypeOf("password");
```

Types:

```ts
toBeInputTypeOf(type: string): void;
```
