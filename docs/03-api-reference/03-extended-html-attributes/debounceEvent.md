---
title: debounce[Event]
description: Use `debounce[Event]` attribute to debounce a server action
---

## Reference

### `debounceClick={400}`

Brisa extends all the HTML element events (`onInput`, `onMouseOver`, `onTouchStart`...) to allow to debounce the action call by replacing the `on` prefix to `debounce`.

```tsx
<input
  type="text"
  onInput={(e) => console.log(e.target.value)}
  debounceInput={400}
/>
```

The time unit consistently remains in **milliseconds**.

In this example, the call to the server and consequently the execution of `console.log` will only take place `400ms` after the user ceases typing in the textbox.

#### Parameters:

- `milliseconds` - Number of milliseconds to debounce the event.

> [!CAUTION]
>
> Only works in the HTML elements that trigger the action, if you use it in the components as a prop it will only work if you use it inside the component to link it with the HTML element that triggers the action. The only exception is to use it in a web-component from a server component, as the web components are transformed into real HTML elements that trigger actions, then in this case it does work.

> [!CAUTION]
>
> This is only implemented for server actions, for browsers events inside web components it does not apply since we do not modify the original event.

### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ✅      |
| Web Component     | ❌      |
| SSR Web Component | ❌      |
