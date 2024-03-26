---
description: Use `ref` attribute to reference to HTML element
---

# ref

## Reference

### `ref={string}`

When the `ref` attribute is used on an HTML element, you can access the current value of that `ref` through the `ref.value` property.

```tsx 2,8,9,11
export default ({}, { onMount, cleanup, state }: WebContext) => {
  const ref = state(null);

  function onClick(e) {
    console.log("Event via ref", e);
  }

  onMount(() => ref.value.addEventListener("click", onClick));
  cleanup(() => ref.value.removeEventListener("click", onClick));

  return <div ref={ref}>Example</div>;
};
```

> [!WARNING]
>
> If you run it on an [`effect`](/building-your-application/components-details/web-components.html#effects-effect-method), keep in mind that they run before it has been mounted and you will not yet have access to the element.

### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ❌      |
| Web Component     | ✅      |
| SSR Web Component | ✅      |
