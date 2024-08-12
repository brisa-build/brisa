---
description: The `fileSystemRouter` API is used to serve files from the file system.
---

# fileSystemRouter

The `fileSystemRouter` API is used to serve files from the file system. Internally, we use it for pages and API routes.

```sh
pages
├── index.tsx
├── settings.tsx
├── blog
│   ├── [slug].tsx
│   └── index.tsx
└── [[...catchall]].tsx
```

The API of `fileSystemRouter` is the same API of [`Bun.FileSystemRouter`](https://bun.sh/docs/api/file-system-router) with some differences:

- You can also use the `fileSystemRouter` API in Node.js.
- There are some fixes and improvements in the API.
- The `fileSystemRouter` API (with Bun runtime) is faster than the `Bun.FileSystemRouter` API.

> [!TIP]
>
> The `fileSystemRouter` API is used internally by the Brisa server to serve files from the file system. However, you can also use it in your [Custom Server](/building-your-application/configuring/custom-server).

## Reference

### `fileSystemRouter(options: FileSystemRouterOptions): FileSystemRouter`

The `fileSystemRouter` function creates a new instance of the file system router.

#### Parameters

- `options`: An object with the following properties:
  - `dir`: The directory to serve files from.
  - `fileExtensions`: An array of file extensions to serve. Default: `['.tsx', '.jsx', '.ts', '.mjs', '.cjs', '.js']`.

#### Returns

- A `FileSystemRouter` object with the following properties:
  - `routes`: A record with the routes and file paths.
  - `match(route: string): MatchedBrisaRoute | null`: A function to match a route with the file system routes.

## Example usage

```tsx
import { fileSystemRouter } from 'brisa/server';

const router = fileSystemRouter({
  dir: 'pages',
});

const matchedRoute = router.match('/blog/hello-world?foo=bar');

if (matchedRoute) {
  console.log(matchedRoute); 
  // {
  //   filePath: 'pages/blog/[slug].tsx',
  //   kind: 'dynamic',
  //   name: '/blog/[slug]',
  //   pathname: '/blog/hello-world',
  //   src: 'blog/[slug].tsx',
  //   params: { slug: 'hello-world' },
  //   query: { foo: 'bar' },
  // }
}
```

## `match` method

The `match` method receives a route and returns a `MatchedBrisaRoute` object or `null`.

### `MatchedBrisaRoute`

The `MatchedBrisaRoute` object has the following properties:

- `filePath`: The file path of the matched route.
- `kind`: The kind of route (`exact`, `dynamic`, `catch-all`, `optional-catch-all`).
- `name`: The route name.
- `pathname`: The matched pathname.
- `src`: The source file path.
- `params`: The route params.
- `query`: The route query.

## `routes` property

The `routes` property is a record with the routes and file paths.

```tsx
import { fileSystemRouter } from 'brisa/server';

const router = fileSystemRouter({
  dir: 'pages',
});

console.log(router.routes);
// {
//   '/': 'pages/index.tsx',
//   '/settings': 'pages/settings.tsx',
//   '/blog/[slug]': 'pages/blog/[slug].tsx',
//   '/blog': 'pages/blog/index.tsx',
//   '/[[...catchall]]': 'pages/[[...catchall]].tsx',
// }
```


