---
title: CSS Template Literal
description: Learn how to style your pages using CSS template literals in Brisa
---

# CSS Template Literal

In Brisa, you can add CSS styles to your components using CSS template literals. This allows you to define styles for individual elements without creating a separate CSS file.

## Adding CSS Styles

To add CSS styles to an element using a template literal, create a template string with the desired styles. For example, you can add a red background color to a `<div>` element like this:

```tsx
export default const MyWebComponent = ({}, { css }) => {
  css`
    div {
      background-color: red;
    }
  `;

  return (
    <div>
      Hello, world!
    </div>
  );
};
```

In Brisa, you can use CSS template literals with both Web Components and Server Components. Web Components encapsulate their styles, while Server Components do not. This means that styles defined with CSS template literals in a Web Component will only apply to that component, while styles defined in a Server Component will apply globally to all components on the page.
