---
description: Use `indicate[Event]` attribute to control the pending status of the server action via an `indicator`
---

# indicate[Event]

## Reference

### `indicateClick={IndicatorSignal}`

Brisa extends all the HTML element events (`onInput`, `onMouseOver`, `onTouchStart`...) to allow to control the pending status of the server action by replacing the `on` prefix to `indicate`.

The value is the generated `IndicatorSignal` by the `indicate` method:

- Read more docs about [`indicate`](/building-your-application/data-fetching/request-context#indicate) in Server Components.
- Read more docs about [`indicate`](/building-your-application/data-fetching/web-context#indicate) in Web Components.

```tsx 6
const indicator = indicate('some-action-name')
// ...
<input
  type="text"
  onInput={(e) => console.log(e.target.value)}
  indicateInput={indicator} // IndicatorSignal
  debouceInput={300}
/>
```

In this example, we are registering the indicator in the `onClick` server action through the `indicate[Event]` attribute.

#### Parameters:

- `IndicatorSignal` - Indicator signal generared by [`indicate`](/building-your-application/data-fetching/request-context#indicate) method.

> [!CAUTION]
>
> This `indicate[Event]` attribute is only implemented in server components, because the server actions are only in server components.

### More docs

For more details, take a look to:

- [`indicate`](/building-your-application/data-fetching/request-context#indicate) method in server components.
- [`indicate`](/building-your-application/data-fetching/web-context#indicate) method in web components.
- [`indicator`](/api-reference/extended-html-attributes/indicator) HTML extended attribute to use it in any element of server/web components.

### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ✅      |
| Web Component     | ❌      |
| SSR Web Component | ❌      |
