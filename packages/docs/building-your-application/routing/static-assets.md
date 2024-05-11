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

## Compression applied to static assets

Brisa automatically compresses static assets in the `public` folder using Brotli and Gzip. This is done at build time, so the server doesn't need to compress the files on the fly.

When a browser requests a file, it sends an `Accept-Encoding` header to tell the server which compression algorithms it supports. The server then sends the file compressed with the best algorithm supported by the browser.

### Gzip

Gzip is a widely supported compression algorithm that reduces the size of files by up to 70%. It's [supported](https://caniuse.com/?search=gzip) by all modern browsers and is the most common compression algorithm used on the web.

### Brotli

Brotli is a newer compression algorithm developed by Google that can reduce file sizes by up to 30% more than Gzip. It's [supported](https://caniuse.com/brotli) by all modern browsers.
