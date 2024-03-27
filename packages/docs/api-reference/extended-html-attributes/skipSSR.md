---
description: Use `skipSSR` attribute to run web components only in client-side skipping the server-side rendering.
---

# skipSSR

## Reference

### `skipSSR={boolean}`

Use `skipSSR` attribute to run web components only in client-side skipping the server-side rendering (SSR).

There are cases where we can avoid the SSR of some web component. It makes sense for these web components that are not available in the initial rendered page, for example they appear after some web interaction, such as a modal.

To do this, all web components have available the `skipSSR` attribute. It's `true` by default _(this attribute does not need to be used when it is `true`)_, but you can use it to turn to `false`. This can be used in any web-component, either consumed from another web-component or from a server component.

```tsx
return <some-web-component skipSSR />;
```

### Support

It can be used in both Server Components and Web Components, but the attribute must always be in a custom element, i.e. a **web component**.
