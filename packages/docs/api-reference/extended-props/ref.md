---
description: Use `ref` attribute to reference to HTML element
---

# ref

## Reference

### `ref={Signal}`

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

If you need multi-refs for an array, you can do it this way:

```tsx 7-9
export default (
  { items = [] }: Props,
  { effect, state, derived }: WebContext,
) => {
  // Every time the "items" property change,
  // the "derived" updates the refs
  const refs = derived(() =>
    Array.from({ length: items.length }).map(() => state(null)),
  );

  effect(() => {
    refs.value.forEach((ref, i) => {
      if (ref.value) {
        ref.value.innerHTML = `Updated ${i}`;
      }
    });
  });

  return (
    <>
      {items.map((item, i) => (
        <div ref={refs.value[i]}>{item}</div>
      ))}
    </>
  );
};
```

> [!TIP]
>
> Signals in Brisa, like `state()`, `derived()`, and `effect()` can be used without the rules of hooks. You can use them in any order and in any place in your component. This is why you can use `state()` inside a `derived()` function.

### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ❌      |
| Web Component     | ✅      |
| SSR Web Component | ✅      |
