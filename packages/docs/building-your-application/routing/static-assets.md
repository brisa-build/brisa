---
description: Create your first page and shared layout with the Pages Router.
---

# Static Assets in `public`

Brisa can serve static files, like images, under a folder called `public` in the root directory. Files inside `public` can then be referenced by your code starting from the base URL (`/`).

For example, the file `public/images/cat.png` can be viewed by visiting the `/images/cat.png` path. The code to display that image might look like:

```tsx 4
export function Cat({ id, alt }) {
  return (
    <img
      src={`/images/${id}.png`}
      alt={alt}
      class="cat"
      loading="lazy"
      width="64"
      height="64"
    />
  );
}
```

The folder is also useful for `robots.txt`, `favicon.ico`, Google Site Verification, and any other static files (including `.html`). But make sure to not have a static file with the same name as a file in the `pages/` directory, as this will result in an error.

> [!TIP]
>
> We recommend to create subfolders to avoid conflicts with page names: `/public/assets` or `/public/images`, `/public/fonts`, etc.
