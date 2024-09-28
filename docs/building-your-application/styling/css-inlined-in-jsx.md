---
title: CSS Inlined in JSX
description: Learn how to style your pages using CSS inlined in JSX in Brisa
---

# CSS Inlined in JSX

In Brisa, you can add CSS styles directly to your JSX components using the `style` attribute. This allows you to define styles for individual elements without creating a separate CSS file.

## Adding CSS Styles

To add CSS styles to an element in JSX, use the `style` attribute and pass an object with the desired styles. For example, you can add a red background color to a `<div>` element like this:

```tsx
const MyComponent = () => {
  return (
    <div style={{ backgroundColor: "red" }}>
      Hello, world!
    </div>
  );
};
```

In the example above, the `style` attribute is set to an object with the `backgroundColor` property set to `"red"`. This will apply a red background color to the `<div>` element.

> [!TIP]
>
> Using TypeScript with inline styles is a great way to ensure type safety and avoid common CSS errors.