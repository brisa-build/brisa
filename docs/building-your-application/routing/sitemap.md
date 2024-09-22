---
description: Learn how to generate a sitemap for your Brisa project
---

# Sitemap

A [sitemap](https://en.wikipedia.org/wiki/Site_map) is a file that lists the URLs for a site. It allows devs to include additional information about each URL: when it was last updated, how often it changes, and how important it is in relation to other URLs in the site. This information helps search engines crawl your site more intelligently.

To create the `sitemap.xml` file during the build process, you can create this file in your project:

- `src/sitemap.ts`
- `src/sitemap.js`
- `src/sitemap/index.ts`
- `src/sitemap/index.js`

> [!IMPORTANT]
>
> The `sitemap.xml` file will be generated in the root of the output directory. And this generation only happens in production mode. You can try it with `brisa build && brisa start`.

> [!CAUTION]
>
> In order that the `sitemap.xml` file works, you need to add to your `src/public/robots.txt` file the following line:
>
> ```sh
> Sitemap: https://example.com/sitemap.xml
> ```
> **Note:** Replace `https://example.com` with your domain.

## Example of `src/sitemap.ts`

```ts
import type { Sitemap } from "brisa";

export default [{
  loc: "https://example.com",
  lastmod: "2021-10-01T00:00:00.000Z",
  changefreq: "daily",
  priority: 1.0,
  images: [
    {
      loc: "https://example.com/image.jpg",
      title: "Image title",
      caption: "Image caption",
    },
  ],
}] as Sitemap;
```

The generated `sitemap.xml` will be:

**sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com</loc>
    <lastmod>2021-10-01T00:00:00.000Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://example.com/image.jpg</image:loc>
      <image:title>Image title</image:title>
      <image:caption>Image caption</image:caption>
    </image:image>
  </url>
</urlset>
```

## Let's make it simpler

Many times there is a lot of additional information that we don't want, if this is your case, that you only want the `<loc>`, you can use the [`fileSystemRouter`](/docs/api-reference/server-apis/fileSystemRouter) from Brisa:

```ts
import path from "node:path";
import type { Sitemap } from "brisa";
import { fileSystemRouter } from "brisa/server";

const { routes } = fileSystemRouter({ dir: 
  path.join(import.meta.dirname, "pages") 
});

console.log(routes);
// [
//   ['/', '/Users/aralroca/my-app/src/pages/index.tsx'],
//   ['/about', '/Users/aralroca/my-app/src/pages/about.tsx'],
// ]

export default routes.map(([pathname]) => ({
  loc: `https://example.com${pathname}`,
})) as Sitemap;
```

However, even if you need additional information, you can put it at the page level as you like and use the `filePath` of the entry that `routes` returns to load this extra information.

Example:

```ts
import path from "node:path";
import type { Sitemap } from "brisa";
import { fileSystemRouter } from "brisa/server";

const { routes } = fileSystemRouter({ 
  dir: path.join(import.meta.dirname, "pages") 
});

async function sitemap(): Promise<Sitemap> {
  return Promise.all(routes.map(async ([pathname, filePath]) => ({
    loc: `https://example.com${pathname}`,
    ...((await import(filePath)).sitemap ?? {}),
  })));
}

export default sitemap();
```

And in your page:

```ts
export const sitemap = {
  lastmod: "2021-10-01T00:00:00.000Z",
  changefreq: "daily",
  priority: 1.0,
  images: [
    {
      loc: "https://example.com/image.jpg",
      title: "Image title",
      caption: "Image caption",
    },
  ],
};
```

## Map `.md` content

In the case that your dynamic pages are linked to `.md` files, for example `/blog/[slug].tsx` that is linked to the content of `src/posts/*.md`, you can use the `fileSystemRouter` to point directly to `posts` and change the extension:

```ts
import type { Sitemap } from 'brisa';
import path from 'node:path';
import { fileSystemRouter } from 'brisa/server';

const origin = 'https://example.com';
const pagesDir = path.join(import.meta.dirname, 'pages');
const postsDir = path.join(import.meta.dirname, 'posts');

const pages = fileSystemRouter({ dir: pagesDir });
const posts = fileSystemRouter({
    dir: postsDir,
    // Change the extension to .md
		fileExtensions: ['.md'],
});

const staticPages = pages.routes.filter(
  ([pathname]) => pathname !== '/blog/[slug]' && pathname !== '/_404'
);

export default [
	...staticPages.map(([pathname]) => ({
			loc: origin + pathname,
	})),
  // Dynamic pages (posts):
	...posts.routes.map(([pathname]) => ({
			loc: origin + '/blog' + pathname,
	})),
] satisfies Sitemap;
```

## Types

The `Sitemap` type is:

```ts
type SitemapItem = {
  loc: string;
  lastmod?: string;
  changefreq?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority?: number;
  images?: {
    loc: string;
    title?: string;
    caption?: string;
  }[];
  videos?: {
    thumbnail_loc: string;
    title: string;
    description: string;
    content_loc: string;
    player_loc: string;
    duration?: number;
    expiration_date?: string;
    rating?: number;
    view_count?: number;
    publication_date?: string;
    family_friendly?: string;
    tag?: string;
    live?: 'yes' | 'no';
    requires_subscription?: 'yes' | 'no';
    restriction?: string;
    platform?: string;
    uploader?: string;
  }[];
};

type Sitemap = SitemapItem[] | Promise<SitemapItem[]>;
```
