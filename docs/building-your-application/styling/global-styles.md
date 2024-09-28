---
title: Global Styles
description: Learn how to style your pages using global styles in Brisa
---

# Global Styles

Global styles are CSS rules that apply to all elements on your website. You can use global styles to set the default font, color, and other styles for your website.

In Brisa, you can add global styles to your website by creating a CSS file and importing it into your layout component.

## Adding Global Styles

To add global styles to your website, create a CSS file in the `src` directory of your project. For example, you can create `/src/styles/global.css` with the following content:

```css
body {
  font-family: Arial, sans-serif;
  color: #333;
}
```

Next, import the CSS file in the `src/layout.tsx` file:

```tsx
import "@/styles/global.css";
```

Now, the styles defined in the `global.css` file will be applied to all pages on your website.