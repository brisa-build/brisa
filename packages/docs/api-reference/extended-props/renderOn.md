---
description: Use the `renderOn` attribute to prerender components in build time.
---

# renderOn

Useful for prerendering components in build time. You can mix static and dynamic content in the same page thanks of this partial prerendering attribute.

## Reference

### `renderOn={'build' | 'runtime'}`

The `renderOn` attribute is present on the `<Component>` element to specify the rendering mode of the component.

There are two possible values:

- `build`: The component will be prerendered in build time.
- `runtime`: The component will be rendered in runtime. I

By default, the value is `runtime`.

Example:

```tsx
return <Component renderOn="build" />;
```

Or in a Web Component:

```tsx
return <web-component renderOn="build" />;
```

> [!IMPORTANT]
>
> The rest of the properties that are passed to it must be serializable and static, as they are executed at build time. Otherwise, it will throw an error.

> [!NOTE]
>
> The attribute in the web components is stripped and will not be visible in the DOM.


### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ✅      |
| Web Component     | ✅      |
| SSR Web Component | ✅      |
