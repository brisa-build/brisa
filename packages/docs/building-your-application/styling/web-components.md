---
title: Styling Web Components
description: Learn how to style your web components in Brisa
---

# Styling Web Components

Brisa provides a different ways to style your web components, including:

- **Global Styles in Web Components**: By default, Brisa adopts the global style sheets to the shadow DOM, so you don't need to worry about this.
- **CSS Template String**: A powerful way to create reactive styles to signals within web components.
- **CSS Modules**: You can import CSS files directly into your web components. It's useful to separate styles into different files.

## Global Styles in Web Components

Web components by default encapsulate their styles inside their shadow DOM, the downside of this is that you can't style them from the outside, so global styles won't affect them. In Brisa, we adopted by default the global style sheets to the shadow DOM, in this way works more like others frameworks like React or Vue and you don't need to worry about this.

However, if you want to disable the automatic adopted global style sheets, you can do it by resetting the [`adoptedStyleSheets`](https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets) property:

```tsx
import type { WebContext } from "brisa";

export default function MyWebComponent({}, { effect, self, css }: WebContext) {
  effect(() => {
    self.shadowRoot.adoptedStyleSheets = [];
  });

  // It only applies this encapsulated style:
  css`
    div {
      color: red;
    }
  `;

  // It doesn't apply the "div" styles defined in the
  // global style sheets, only the ones defined in the
  // CSS template literal will be applied
  return <div>Hello World</div>;
}
```

To apply global styles, you need to import the CSS file in the **`src/layout.tsx`** file:

```tsx
import "./global.css";
```

> [!NOTE]
>
> For more information about global styles, check the [Global Styles](/building-your-application/styling/global-styles) page.

## CSS Template String

The CSS template string is a powerful way to create reactive styles to signals within web components. It allows you to define styles in a template literal and use the `css` tag to apply them to the shadow DOM.

```tsx
import type { WebContext } from "brisa";

export default function MyWebComponent({ color }, { css }: WebContext) {
  css`
    div {
      color: ${color};
    }
  `;

  return <div>Hello World</div>;
}
```

In this example, the `color` prop is reactive, so when it changes, the style will be updated accordingly. Also useful to create animations, hover effects, and more.

> [!TIP]
>
> You can use **tag names** directly in the CSS template string because is scoped to the shadow DOM, so you don't need to worry about naming conflicts with other components, or outside styles.

> [!NOTE]
>
> For more information about CSS template string, check the [CSS Template Literal](/building-your-application/styling/css-template-literal) page.

## CSS Modules

You can import CSS files directly into your web components. It's useful to separate styles into different files and keep your components more organized.

```tsx
import type { WebContext } from "brisa";
import styles from "./MyWebComponent.module.css";

export default function MyWebComponent() {
  return <div class={styles.foo}>Hello World</div>;
}
```

In this example, the `styles` object contains all the CSS classes defined in the `MyWebComponent.module.css` file. You can use them directly in the `class` attribute of the HTML element.

> [!TIP]
>
> [CSS Modules](https://github.com/css-modules/css-modules) are not using the encapsulated shadow DOM, but is using a different approach to encapsulate the styles locally to avoid naming conflicts and improve maintainability.

> [!NOTE]
>
> For more information about CSS Modules, check the [CSS Modules](/building-your-application/styling/css-modules) page.

TODO: Confirm CSS Modules after the implementation of this task: https://github.com/brisa-build/brisa/issues/156

## CSS inlined in JSX

You can also use the `style` attribute to apply styles directly to the HTML element. This is useful for simple styles or when you need to apply styles dynamically.

```tsx
import type { WebContext } from "brisa";

export default function MyWebComponent({ color }, { css }: WebContext) {
  return <div style={{ color }}>Hello World</div>;
}
```

In this example, the `color` prop is applied directly to the `style` attribute of the `div` element. You can use any CSS property in the `style` object.

> [!NOTE]
>
> For more information about CSS inlined in JSX, check the [CSS inlined in JSX](/building-your-application/styling/css-inlined-in-jsx) page.
