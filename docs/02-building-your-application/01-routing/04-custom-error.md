---
title: Custom Errors
description: Override and extend the built-in Error page to handle custom errors.
---

## 404 Page

To create a custom 404 page you can create a `src/pages/_404.js` file.

```jsx filename="src/pages/_404.js"
export default function Custom404() {
  return <h1>404 - Page Not Found</h1>;
}
```

> [!TIP] 
> **Good to know**: In this page you can access to the `request context`, `fetch` data, change the `head` content (meta tags, etc), and change the `response headers`, in the same way of the rest of pages.

## 500 Page

To customize the 500 page you can create a `src/pages/_500.js` file.

```jsx filename="src/pages/_500.js"
export default function Custom500({ error }, requestContext) {
  return <h1>500 - {error.message}</h1>;
}
```

> [!TIP] 
> **Good to know**: In this page you can access to the `request context`, `fetch` data, change the `head` content (meta tags, etc), and change the `response headers`, in the same way of the rest of pages.

### Errors in component-level

If you want to control errors at the component level instead of displaying a whole new page with the error, you can make the components have the error extension by adding the `ComponentName.error`:

```jsx
export default function SomeComponent() {
  return; /* some JSX */
}

SomeComponent.error = ({ error }, requestContext) => {
  return <p>Oops! {error.message}</p>;
};
```
