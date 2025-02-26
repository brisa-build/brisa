---
title: "Brisa 0.1.2"
created: 10/18/2024
description: "Brisa release notes for version 0.1.2"
author: Aral Roca
author_site: https://x.com/aralroca
---

This release fixes 12 bugs. It also includes some improvements and new features, thanks to all contibutors:

- [@Anonymous961](https://github.com/Anonymous961)
- [@amatiasq](https://github.com/amatiasq)
- [@enzonotario](https://github.com/enzonotario)
- [@gariasf](https://github.com/gariasf)
- [@aralroca](https://github.com/aralroca)

## Add `idleTimeout` for Bun & Node.js runtimes

In this version, we have added the `idleTimeout` property to the `brisa.config.ts` file. This property allows you to set the maximum amount of time a connection is allowed to be idle before the server closes it. A connection is idling if there is no data sent or received.

**brisa.config.ts**:

```ts 4
import type { Configuration } from "brisa";

export default {
  idleTimeout: 10,
} satisfies Configuration;
```

[Learn more about the `idleTimeout` property](/building-your-application/configuring/idle-timeout).

## Stream SQLite queries

Async generators can now be used in conjunction with SQLite queries to stream HTML content. This is useful when you want to render a large amount of data without blocking the main thread and the user can start seeing the content as it is being fetched.

```tsx
import { Database } from "bun:sqlite";

const db = new Database("db.sqlite");

export default function MovieList() {
  return (
    <ul>
      <MovieItems />
    </ul>
  );
}

// Streaming HTML from SQLite query
async function* MovieItems() {
  for (const movie of db.query("SELECT title, year FROM movies")) {
    yield (
      <li>
        {movie.title} ({movie.year})
      </li>
    );
  }
}
```

- [Learn more about async component generators](/building-your-application/data-management/fetching#async-generators).

## `i18n` fixes and improvements

In this version, it is possible to use formatters through `format` inside Web Components. This property captures the interpolations to format them as you like, for example:

```json
{
  "hello": "Hola, {{name}}",
  "helloWithFormat": "Hola, {{name, uppercase}}"
}
```

To consume it:

```ts
t("hello", { name: "Brisa" }); // Hola, Brisa
t("helloWithFormat", { name: "Brisa" }); // Hola, BRISA
```

In this case, the `helloWithFormat` key will be formatted to `uppercase`. To define all the formatters, you can check the [i18n documentation](/building-your-application/internationalization#formatters).

## Complex extensions in `fileSystemRouter`

In this version, we have added support to composed extensions in `fileSystemRouter`, e.g.: `.d.ts`.

- [Learn more about the `fileSystemRouter` property](/api-reference/server-apis/fileSystemRouter#filesystemrouter).

## Fix bug SPA Navigation with server actions

In this version, we have fixed a bug that occurred when the same element was in different routes but in each route had a different server action.

## Fix some bugs in Windows

There are still some bugs in Windows that will be fixed for the next release, but for the time being this version fixes some bugs such as the detection of Web Components.

## Skip `undefined` attributes

Previously it could happen that an element had an `"undefined"`, e.g.: `<div class="undefined">`, now it has been fixed so that the attribute is not added if the value is `undefined`.

## Add issue templates on GitHub

In this version, we have added issue templates to help you create better issues.

Thanks to [@Anonymous961](https://github.com/Anonymous961) for their contribution 🎉

## Fix errors in Brisa Playground

In this version, we have fixed some wrong errors in the Brisa Playground console.

## Improve `CONTRIBUTING.md`

In this version, we have improved the `CONTRIBUTING.md` file to help you contribute to the project.

Thanks to [@Anonymous961](https://github.com/Anonymous961) for their contribution 🎉

## What's Changed

- docs: add issue templates by [@Anonymous961](https://github.com/Anonymous961) in [#536](https://github.com/brisa-build/brisa/pull/536)
- fix: not log \_Fragment (swc of playground) by [@aralroca](https://github.com/aralroca) in [#542](https://github.com/brisa-build/brisa/pull/542)
- fix: skip set attribute when value is `undefined` by [@aralroca](https://github.com/aralroca) in [#543](https://github.com/brisa-build/brisa/pull/543)
- fix: adapt `i18n.t` with HTML (`elements`) to work on WC by [@aralroca](https://github.com/aralroca) in [#544](https://github.com/brisa-build/brisa/pull/544)
- fix(i18n): use `interpolation` and `format` inside Web Components by [@aralroca](https://github.com/aralroca) in [#546](https://github.com/brisa-build/brisa/pull/546)
- docs: update CONTRIBUTING.md by [@Anonymous961](https://github.com/Anonymous961) in [#547](https://github.com/brisa-build/brisa/pull/547)
- fix: "Upgrade Bun" message prompts the user to install their current version by [@amatiasq](https://github.com/amatiasq) in [#549](https://github.com/brisa-build/brisa/pull/549)
- fix: fix composed extensions in `fileSystemRouter` by [@aralroca](https://github.com/aralroca) in [#552](https://github.com/brisa-build/brisa/pull/552)
- update engines && publish commits actions by [@enzonotario](https://github.com/enzonotario) in [#553](https://github.com/brisa-build/brisa/pull/553)
- fix(playground): stringify declaration files on monaco editor by [@aralroca](https://github.com/aralroca) in [#555](https://github.com/brisa-build/brisa/pull/555)
- fix(actions): publish commits via pkg-pr-new by [@enzonotario](https://github.com/enzonotario) in [#557](https://github.com/brisa-build/brisa/pull/557)
- fix: fix detecting WC in Windows by [@aralroca](https://github.com/aralroca) in [#548](https://github.com/brisa-build/brisa/pull/548)
- chore: upgrade diffing algorithm by [@aralroca](https://github.com/aralroca) in [#559](https://github.com/brisa-build/brisa/pull/559)
- fix: fix WC regex for Windows by [@aralroca](https://github.com/aralroca) in [#561](https://github.com/brisa-build/brisa/pull/561)
- chore: upgrade bun & deps by [@aralroca](https://github.com/aralroca) in [#562](https://github.com/brisa-build/brisa/pull/562)
- chore: homepage content nits by [@gariasf](https://github.com/gariasf) in [#530](https://github.com/brisa-build/brisa/pull/530)
- docs: improve async component generators docs by [@aralroca](https://github.com/aralroca) in [#563](https://github.com/brisa-build/brisa/pull/563)
- fix: add different keys on actions by [@aralroca](https://github.com/aralroca) in [#564](https://github.com/brisa-build/brisa/pull/564)
- feat: add idleTimeout by [@aralroca](https://github.com/aralroca) in [#566](https://github.com/brisa-build/brisa/pull/566)

## New Contributors

- [@Anonymous961](https://github.com/Anonymous961) made their first contribution in [#536](https://github.com/brisa-build/brisa/pull/536)

**Full Changelog**: [https://github.com/brisa-build/brisa/compare/0.1.1...0.1.2](https://github.com/brisa-build/brisa/compare/0.1.1...0.1.2)
