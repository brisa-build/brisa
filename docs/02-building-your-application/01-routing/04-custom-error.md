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

Example [server component](/docs/components-details/server-components):
```tsx
import { RequestContext } from 'brisa';

export default function SomeServerComponent() {
  return; /* some JSX */
}

SomeServerComponent.error = ({ error }, requestContext: RequestContext) => {
  return <p>Oops! {error.message}</p>;
};
```

Example [web component](/docs/components-details/web-components):
```tsx
import { WebContext } from 'brisa';

export default function SomeWebComponent() {
  /* some JSX */
}

SomeWebComponent.error = ({ error }, webContext: WebContext) => {
  return <p>Oops! {error.message}</p>;
};
```

This works for both server and web components. The difference is that web-components have access to the [webContext](/docs/building-your-application/data-fetching/web-context) while server-components have access to the [requestContext](/docs/building-your-application/data-fetching/request-context).
