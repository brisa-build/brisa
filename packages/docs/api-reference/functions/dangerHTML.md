---
description: inject HTML string into the DOM
---

# dangerHTML

## Reference

### `dangerHTML(html: string): DangerHTMLOutput`

Make situations that we want to inject HTML that we have in string to the DOM. For these occasions, you can use the `dangerHTML` function. Since without this function it is escaped by security.

```tsx
import { dangerHTML } from "brisa";

export default function SomeComponent() {
  return (
    <>
      {/* Escaped by default (doesn't work for security): */}
      {'<script>alert("This is escaped and is not going to work")</script>'}

      {/* Force to inject an string as HTML: */}
      {dangerHTML(
        '<script>alert("This is injected and is going to work")</script>',
      )}
    </>
  );
}
```

Another way to use `dangerHTML` is to import an HTML file and inject it into the DOM. For this, you can use the `with` keyword to import the file with the type `text`.

```tsx
import html from "./file.html" with { type: "text" };

export default function Page() {
  return dangerHTML(html);
}
```

> [!NOTE]
>
> A better way to serve static HTML without having to render is by using the Brisa [prerender macro](/api-reference/macros/prerender).

#### Parameters:

- `html`: The HTML code in string that you want to inject.

#### Returns:

- `DangerHTMLOutput` It is a JSX element type that Brisa JSX-runtime understands as an element.

### Support

| Component         | Support |
| ----------------- | ------- |
| Server Component  | ✅      |
| Web Component     | ✅      |
| SSR Web Component | ✅      |
