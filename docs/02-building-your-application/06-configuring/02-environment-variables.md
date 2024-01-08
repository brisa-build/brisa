---
title: Environment Variables
description: Learn to add and access environment variables in your Brisa application.
---

Brisa comes with built-in support for environment variables thanks to Bun, which allows you to do the following:

- [Use `.env.local` to load environment variables](#loading-environment-variables)
- [Bundle environment variables for the browser by prefixing with `BRISA_PUBLIC_`](#bundling-environment-variables-for-the-browser)

## Loading Environment Variables

Brisa has built-in support for loading environment variables from `.env.local` into `process.env`.

```txt filename=".env.local"
DB_HOST=localhost
DB_USER=myuser
DB_PASS=mypassword
```

This loads `process.env.DB_HOST`, `process.env.DB_USER`, and `process.env.DB_PASS` into the Bun environment automatically allowing you to use them in [Brisa data fetching methods](/docs/building-your-application/data-fetching), [middleware](/docs/building-your-application/routing/middleware) and [API routes](/docs/building-your-application/routing/api-routes).

For example, using middleware:

```ts filename="src/middleware.ts"
import { type RequestContext } from "brisa";
import myDB from "some-db";

export default async function middleware(request: RequestContext) {
  const db = await myDB.connect({
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
  });
  // ...
}
```

Using [API Routes](/docs/building-your-application/routing/api-routes):

```ts filename="src/api/hello.ts"
import { type RequestContext } from "brisa";

export function GET(request: RequestContext) {
  const db = await myDB.connect({
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
  });
  // ...
}
```

Bun also exposes these variables via `Bun.env` and `import.meta.env`, which is a simple alias of `process.env` and you can use it in server files.

```ts
Bun.env.DB_PASS; // => "secret"
import.meta.env.DB_PASS; // => "secret"
```

> [!NOTE]
>
> Please note that Brisa will load the `.env` files **only** from the root folder and **not** from the `/src` folder.

## Bundling Environment Variables for the Browser

Non-`BRISA_PUBLIC_` environment variables are only available in the Bun environment, meaning they aren't accessible to the browser (the client runs in a different _environment_).

In order to make the value of an environment variable accessible in the browser, Brisa can "inline" a value, at build time, into the js bundle that is delivered to the client, replacing all references to `process.env.[variable]` with a hard-coded value. To tell it to do this, you just have to prefix the variable with `BRISA_PUBLIC_`. For example:

```txt filename="Terminal"
BRISA_PUBLIC_ANALYTICS_ID=abcdefghijk
```

This will tell Brisa to replace all references to `process.env.BRISA_PUBLIC_ANALYTICS_ID` in the Bun environment with the value from the environment in which you run `brisa build`, allowing you to use it anywhere in your code. It will be inlined into any JavaScript sent to the browser.

> [!NOTE]
>
> After being built, your app will no longer respond to changes to these environment variables. For instance, if you build and deploy a single Docker image to multiple environments, all `BRISA_PUBLIC_` variables will be frozen with the value evaluated at build time, so these values need to be set appropriately when the project is built. If you need access to runtime environment values, you'll have to setup your own API to provide them to the client (either on demand or during initialization).

```tsx filename="src/web-components/web-component.tsx"
import { type WebContext } from "brisa";
import setupAnalyticsService from "@/lib/my-analytics-service";

function WebComponent({}, { effect }: WebContext) {
  effect(() => {
    // 'BRISA_PUBLIC_ANALYTICS_ID' can be used here as it's prefixed by 'BRISA_PUBLIC_'.
    // It will be transformed at build time to `setupAnalyticsService('abcdefghijk')`.
    setupAnalyticsService(process.env.BRISA_PUBLIC_ANALYTICS_ID);
  });

  return <h1>Hello World</h1>;
}

export default WebComponent;
```

Note that dynamic lookups will _not_ be inlined, such as:

```js
// This will NOT be inlined, because it uses a variable
const varName = "BRISA_PUBLIC_ANALYTICS_ID";
setupAnalyticsService(process.env[varName]);

// This will NOT be inlined, because it uses a variable
const env = process.env;
setupAnalyticsService(env.BRISA_PUBLIC_ANALYTICS_ID);
```

## Default Environment Variables

In general only one `.env.local` file is needed. However, sometimes you might want to add some defaults for the `development` (`bun dev`) or `production` (`bun start`) environment.

Brisa allows you to set defaults in `.env` (all environments), `.env.development` (development environment), and `.env.production` (production environment).

`.env.local` always overrides the defaults set.

> [!IMPORTANT]
>
> `.env`, `.env.development`, and `.env.production` files should be included in your repository as they define defaults. **`.env*.local` should be added to `.gitignore`**, as those files are intended to be ignored. `.env.local` is where secrets can be stored.

## Test Environment Variables

Apart from `development` and `production` environments, there is a 3rd option available: `test`. In the same way you can set defaults for development or production environments, you can do the same with a `.env.test` file for the `testing` environment (though this one is not as common as the previous two). Brisa will not load environment variables from `.env.development` or `.env.production` in the `testing` environment.

This one is useful when running tests with tools like `playwright` or `cypress` where you need to set specific environment vars only for testing purposes. Test default values will be loaded if `NODE_ENV` is set to `test`, though you usually don't need to do this manually as testing tools will address it for you.

There is a small difference between `test` environment, and both `development` and `production` that you need to bear in mind: `.env.local` won't be loaded, as you expect tests to produce the same results for everyone. This way every test execution will use the same env defaults across different executions by ignoring your `.env.local` (which is intended to override the default set).

> [!TIP]
>
> Similar to Default Environment Variables, `.env.test` file should be included in your repository, but `.env.test.local` shouldn't, as `.env*.local` are intended to be ignored through `.gitignore`.

## Environment Variable Load Order

Environment variables are looked up in the following places, in order, stopping once the variable is found.

1. `process.env`
1. `.env.$(NODE_ENV).local`
1. `.env.local` (Not checked when `NODE_ENV` is `test`.)
1. `.env.$(NODE_ENV)`
1. `.env`

For example, if `NODE_ENV` is `development` and you define a variable in both `.env.development.local` and `.env`, the value in `.env.development.local` will be used.

> [!NOTE]
>
> The allowed values for `NODE_ENV` are `production`, `development` and `test`.

> [!TIP]
>
> If the environment variable `NODE_ENV` is unassigned, Brisa automatically assigns `development` when running the `brisa dev` command, or `production` for `brisa build` and `brisa start`.

### Quotation marks

Brisa supports double quotes, single quotes, and template literal backticks:

```txt#.env
FOO='hello'
FOO="hello"
FOO=`hello`
```

### Expansion

Environment variables are automatically _expanded_. This means you can reference previously-defined variables in your environment variables.

```txt#.env
FOO=world
BAR=hello$FOO
```

```ts
process.env.BAR; // => "helloworld"
```

This is useful for constructing connection strings or other compound values.

```txt#.env
DB_USER=postgres
DB_PASSWORD=secret
DB_HOST=localhost
DB_PORT=5432
DB_URL=postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
```

This can be disabled by escaping the `$` with a backslash.

```txt#.env
FOO=world
BAR=hello\$FOO
```

```ts
process.env.BAR; // => "hello$FOO"
```

### `dotenv`

Generally speaking, you won't need `dotenv` or `dotenv-expand` anymore, because Bun reads `.env` files automatically.

## TypeScript

In TypeScript, all properties of `process.env` are typed as `string | undefined`.

```ts
Bun.env.whatever;
// string | undefined
```

To get autocompletion and tell TypeScript to treat a variable as a non-optional string, we'll use [interface merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#merging-interfaces).

```ts
declare module "bun" {
  interface Env {
    AWESOME: string;
  }
}
```

Add this line to any file in your project. It will globally add the `AWESOME` property to `process.env` and `Bun.env`.

```ts
process.env.AWESOME; // => string
```
