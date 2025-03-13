---
title: CSS Modules
description: Learn how to style your pages using CSS Modules in Brisa
---

# CSS Modules

In Brisa, you can style your components _(server & web components)_ using CSS Modules, which provide a scoped and modular approach to styling. This helps prevent global CSS conflicts by ensuring styles are isolated to individual components.

## Adding CSS Modules

To use CSS Modules in Brisa, create a `.module.css` file with your styles and import it into your component. Each class name is automatically transformed into a unique identifier to avoid conflicts.

### Example Usage

Create a CSS file named `styles.module.css`:

```css
/* styles.module.css */
.container {
  background-color: red;
  padding: 16px;
  border-radius: 8px;
}
```

Then, import and use it in your component:

```tsx
import styles from "./styles.module.css";

export default function MyComponent() {
  return (
    <div class={styles.container}>
      Hello, world!
    </div>
  );
}
```

### Scoped Styles

CSS Modules ensure that styles are scoped to the component where they are imported. This means that styles defined in `styles.module.css` will not affect other components, preventing unintentional style overrides.

### Using Dynamic Class Names

If you need to apply dynamic class names, you can use JavaScript string interpolation:

```tsx
import styles from "./styles.module.css";

export default function DynamicComponent({ isActive }) {
  return (
    <div class={`${styles.container} ${isActive ? styles.active : ""}`}>
      Dynamic Styles
    </div>
  );
}
```

### Benefits of CSS Modules

- **Scoped Styles:** Avoids conflicts with other components.
- **Static Analysis:** Helps catch unused styles in your codebase.
- **Performance:** CSS Modules are compiled and optimized at build time.
    
Using CSS Modules in Brisa, you can write maintainable and encapsulated styles without worrying about global conflicts.