---
description: Use the `renderMode` attribute to specify the rendering mode of the next document after following the link.
---

# renderMode

## Reference

### `renderMode={'reactivity' | 'transition' | 'native'}`

The `renderMode` attribute is present on the `<a>` element to specify the render mode of the next document after following the link.

There are three possible values:

- `reactivity`: The next document will be rendered using reactivity (it only changes the parts of the page that have changed).
- `transition`: The next document will be rendered using reactivity and also using View Transition API.
- `native`: The next document will be rendered using the browser's native rendering engine.

By default, the value is `reactivity`.

**Note**: If the origin of the next document is different from the current document, the value will be ignored, and the next document will be rendered using the browser's native rendering engine.

Example:

```tsx
return <a href="/" renderMode="transition" />;
```

### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ✅      |
| Web Component     | ✅      |
| SSR Web Component | ✅      |
