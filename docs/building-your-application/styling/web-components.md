---
title: Styling Web Components
description: Learn how to style your web components in Brisa
---

# Styling Web Components

Brisa provides a different ways to style your web components, including:

- [**Global Styles in Web Components**](#global-styles-in-web-components): By default, Brisa adopts the global style sheets to the shadow DOM, so you don't need to worry about this.
- [**CSS Template String**](#css-template-string): A powerful way to create reactive styles to signals within web components.
- [**CSS inlined in JSX**](#css-inlined-in-jsx): You can use the `style` attribute to apply styles directly to the HTML element.
- [**Tailwind CSS**](#tailwind-css): A CSS framework that lets you use utility classes instead of writing CSS.

## Global Styles in Web Components

Web components by default encapsulate their styles inside their shadow DOM, the downside of this is that you can't style them from the outside, so global styles won't affect them. In Brisa, we adopted by default the global style sheets to the shadow DOM, in this way works more like others frameworks like React or Vue and you don't need to worry about this.

To apply global styles, you need to import the CSS file in the [**`src/layout.tsx`**](/building-your-application/routing/pages-and-layouts) file:

```tsx
import "./global.css";
```

> [!NOTE]
>
> For more information about global styles, check the [Global Styles](/building-your-application/styling/global-styles) page.

However, if you want to disable the automatic adopted global style sheets, you can do it by resetting the [`adoptedStyleSheets`](https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets) property:

```tsx
import type { WebContext } from "brisa";

export default function MyWebComponent({}, { self, css }: WebContext) {
  // Turn off the automatic adopted global style sheets (also work in SSR)
  self.shadowRoot.adoptedStyleSheets = [];

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

> [!TIP]
>
> You can use the `self` object to access the shadow DOM and manipulate it directly. During SSR, the `self` object is an object with an empty `shadowRoot`, but when you add an empty array on `adoptedStyleSheets` property, it will disable the automatic adopted global style sheets on [Declarative Shadow DOM](https://developer.chrome.com/docs/css-ui/declarative-shadow-dom) too.

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

## Tailwind CSS

The shadow DOM is adapted to be possible to use Tailwind CSS classes in your elements.

```tsx
import type { WebContext } from "brisa";

export default function MyWebComponent() {
  return <div className="bg-gray-100">Hello World</div>;
}
```

> [!NOTE]
>
> Read more about how to integrate Tailwind CSS in your Brisa project in the [Tailwind CSS](/building-your-application/integrations/tailwind-css) page.
