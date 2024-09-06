---
description: Use the `renderOn` attribute to prerender components in build time.
---

# renderOn

Useful for prerendering components in build time. You can mix static and dynamic content in the same page thanks of this partial prerendering attribute.

To make this possible, optimizations are made in build-time and the [Bun Macros](https://bun.sh/docs/bundler/macros) are used connected to our internal rendering to make it easier for you to do it.

> [!WARNING]
>
> You have to take into account that it will improve the time to render the page in runtime, but at the same time it will worsen the build time.

## Reference

### `renderOn={'build' | 'runtime'}`

The `renderOn` attribute is present on the `<Component>` element to specify the rendering mode of the component.

There are two possible values:

- `build`: The component will be prerendered in build time.
- `runtime`: The component will be rendered in runtime. _(default)_

By default, the value is `runtime`.

Example:

Imagine we have this component that makes an external request for static resources:

**src/components/some-component.tsx**:

```tsx
export default async function SomeComponent() {
   const res = await fetch(/* some external service */);

   return <div>Result: {await res.json()}</div>
}
```

Then it is consumed from some page or another component with the `renderOn` prop as `build`:

```tsx
return <SomeComponent renderOn="build" />;
```

Then, it will be automatically transformed at build-time to a `return` similar to this:

```tsx
return dangerHTML('<div>Result: foo</div>')
```

You can also use it in Web Components, for example:

```tsx
return <web-component renderOn="build" />;
```

And it will be transformed to:

```tsx
return dangerHTML('<web-component><template shadowroot="open">Result: foo</template></web-component>')
```

> [!CAUTION]
>
> Only the initial HTML of the web component can be prerendered, once it is hydrated it will be rendered again from the client.

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
| SSR Web Component | ✅      |
