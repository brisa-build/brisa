---
description: Learn how to prerender pages to have a hybrid static/dynamic app
---

# Static pages

## Prerender some pages in `output="server"`

In Brisa you can prerender pages to have a static/dynamic hybrid app. Although in the [configuration is `output="server"`](/building-your-application/configuring/output) you can indicate which pages you want to prerender during the build and then only have to serve the generated HTML file.

For this to be possible, you have to put `prerender` named export on your pages:

```tsx
export const prerender = true;

export default function MyPage() {
  // ...
}
```

The `prerender` export can be a `boolean` or a `() => {[param: string]: string|string[]}[] | async () => {[param: string]: string|string[]}[]` (only in the case of dynamic routes to indicate all the necesary params to prerender).

In the case of a page that is not `[dynamic]`, `[[...catchAll]]`, or `[...rest]`, the `boolean` is enough.

> [!NOTE]
>
> The `boolean` only applies when the `output="server"`, for the other [output](/building-your-application/configuring/output) types all pages will automatically be pre-rendered since there will be no server.

## Prerender dynamic routes

In the case of a page that is `[dynamic]`, `[[...catchAll]]`, or `[...rest]`, we need to use the `prerender` export in a different way.

Example of `/pokemons/[slug].tsx`:

```tsx
import type { RequestContext } from 'brisa';
import { pokemons } from "@/data";

// To prerender all pokemons, it is necessary to provide the 
// slug of "/pokemons/[slug].tsx"
export function prerender() {
  return pokemons.map((pokemon) => ({
    slug: pokemon.slug,
  }));
}

export default function PokemonPage({}, { route }: RequestContext) {
  const slug = route.params.slug; // Read [slug] param
  const pokemon = pokemons.find((p) => p.slug === slug);

  return <h1>{pokemon.name}</h1>;
}
```
In this case, to prerender all pokemons, it is necessary that the prerender function returns an array with the slug of `/pokemons/[slug].tsx`.

The `prerender` function can be synchronous or asynchronous, if you need to do `fetch` or any async operation you can do it without problems.

> [!NOTE]
>
> This `prerender` option works for all types of [`output`](/building-your-application/configuring/output). In the case of already `static` output, it provides some useful information to convert dynamic paths to static ones, without this property, the example can not invert the pokemon paths.

## When should I use `prerender`?

You should use `prerender` if the page has no dynamic data and must be pre-rendered (for SEO) to be very fast.

## When does `prerender` run?

The `prerender` will only run during build in production, it will not be called during runtime. The code is never taken to client-side.

## Where can I use `prerender`?

The `prerender` can only be used inside paths that are pages (inside `src/pages`), it cannot be used anywhere else.