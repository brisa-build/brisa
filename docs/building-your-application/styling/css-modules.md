---
title: CSS Modules
description: Learn how to style your pages using CSS Modules in Brisa
---

# CSS Modules

In Brisa, you can use CSS Modules to style your components. CSS Modules allow you to define styles for individual components without worrying about naming conflicts or global styles.

## Adding CSS Modules

To add CSS Modules to your components, create a CSS file with the desired styles and import it into your component. For example, you can create a `styles.module.css` file with the following content:

```css
/* styles.module.css */
.container {
  background-color: red;
}
```

Next, import the CSS file in your component and use the generated class names to apply the styles. For example, you can create a `my-component.tsx` file with the following content:

```tsx
// my-component.tsx
import styles from "./styles.module.css";

const MyComponent = () => {
  return (
    <div className={styles.container}>
      Hello, world!
    </div>
  );
};
```

In the example above, the `styles` object contains the generated class names from the `styles.module.css` file. By using the `className` attribute with the appropriate class name, you can apply the styles defined in the CSS Module to your component.

> [!TIP]
>
> CSS Modules are a great way to encapsulate styles and prevent naming conflicts in your components. They also make it easier to manage styles for individual components without affecting other parts of your website.

TODO: Confirm CSS Modules after Bun CSS Parser, waiting to finish this task: https://github.com/brisa-build/brisa/issues/156