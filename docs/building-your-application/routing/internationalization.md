---
title: Internationalization (i18n)
description: Brisa has built-in support for internationalized routing, language detection and consume translations. Learn more here.

prev:
  text: "Authenticating"
  link: "02-building-your-application/01-routing/07-authenticating.md"
next:
  text: "Suspense and streaming"
  link: "02-building-your-application/01-routing/09-suspense-and-streaming.md"
---

Brisa has built-in support for internationalized ([i18n](https://en.wikipedia.org/wiki/Internationalization_and_localization#Naming)). You can provide a list of locales, the default locale, and domain-specific locales and Brisa will automatically handle the routing.

## Getting started

To get started, add the `src/i18n.(ts|js)` or `src/i18n/index.(ts|js)` file.

Locales are [UTS Locale Identifiers](https://www.unicode.org/reports/tr35/tr35-59/tr35.html#Identifiers), a standardized format for defining locales.

Generally a Locale Identifier is made up of a language, region, and script separated by a dash: `language-region-script`. The region and script are optional. An example:

- `en-US` - English as spoken in the United States
- `nl-NL` - Dutch as spoken in the Netherlands
- `nl` - Dutch, no specific region

If user locale is `nl-BE` and it is not listed in your configuration, they will be redirected to `nl` if available, or to the default locale otherwise.
If you don't plan to support all regions of a country, it is therefore a good practice to include country locales that will act as fallbacks.

```ts filename="src/i18n.ts" switcher
import { I18nConfig } from "brisa";

const i18nConfig: I18nConfig = {
  // These are all the locales you want to support in
  // your application
  locales: ["en-US", "fr", "nl-NL"],
  // This is the default locale you want to be used when visiting
  // a non-locale prefixed path e.g. `/hello`
  defaultLocale: "en-US",
  // This is a list of locale domains and the default locale they
  // should handle (these are only required when setting up domain routing)
  domains: {
    "example.com": {
      defaultLocale: "en-US",
    },
    "example.nl": {
      defaultLocale: "nl-NL",
    },
  },
};

export default i18nConfig;
```

```js filename="src/i18n.js" switcher
export default {
  // These are all the locales you want to support in
  // your application
  locales: ["en-US", "fr", "nl-NL"],
  // This is the default locale you want to be used when visiting
  // a non-locale prefixed path e.g. `/hello`
  defaultLocale: "en-US",
  // This is a list of locale domains and the default locale they
  // should handle (these are only required when setting up domain routing)
  domains: {
    "example.com": {
      defaultLocale: "en-US",
    },
    "example.nl": {
      defaultLocale: "nl-NL",
    },
  },
};
```

## Locale Strategies

There are two locale handling strategies: Sub-path Routing and Domain Routing.

### Sub-path Routing

Sub-path Routing puts the locale in the url path.

```js filename="src/i18n.js"
export default {
  locales: ["en-US", "fr", "nl-NL"],
  defaultLocale: "en-US",
};
```

With the above configuration `en-US`, `fr`, and `nl-NL` will be available to be routed to, and `en-US` is the default locale. If you have a `src/pages/blog.js` the following urls would be available:

- `/en-us/blog`
- `/fr/blog`
- `/nl-nl/blog`

### Domain Routing

By using domain routing you can change the `defaultLocale` of each domain:

```js filename="src/i18n.js"
export default {
  locales: ["en-US", "fr", "nl-NL"],
  defaultLocale: "en-US",
  domains: {
    "example.com": {
      defaultLocale: "en-US",
    },
    "example.nl": {
      defaultLocale: "nl-NL",
      protocol: "http", // by default is https
      dev: true, // by default is false
    },
  },
};
```

For example if you have `src/pages/blog.js` the following urls will be available:

- `example.com/blog` → `example.com/en-us/blog`
- `example.nl/blog` → `example.nl/nl-nl/blog`

If the browser language is not supported as locale, then it will redirect to `defaultLocale`.

## Automatic Locale Detection

When a user visits the application root (generally `/`), Brisa will try to automatically detect which locale the user prefers based on the [`Accept-Language`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Accept-Language) header and the current domain.

If a locale other than the default locale is detected, the user will be redirected to either:

- **When using Domain Routing:** The domain with that locale specified as the default

When using Domain Routing, if a user with the `Accept-Language` header `fr;q=0.9` visits `example.com`, they will be redirected to `example.fr` since that domain handles the `fr` locale by default.

When using Sub-path Routing, the user would be redirected to `/fr`.

## Accessing the locale information

You can access the locale information via the [`request context`](/docs/building-your-application/data-fetching/request-context):

- `locale` contains the currently active locale.
- `locales` contains all configured locales.
- `defaultLocale` contains the configured default locale.
- `pages` contains the configured pages.
- `t` function to consume translations.
- `overrideMessages` function to override messages at session level

Example in a page:

```tsx filename="src/pages/index.tsx" switcher
import { type RequestContext } from "brisa";

type Props = {
  name: string;
};

export default function Home({ name }: Props, requestContext: RequestContext) {
  const { locale, t, defaultLocale } = requestContext.i18n;

  if (locale === defaultLocale) {
    return (
      <h1>
        {i18n.t("strong-hello", { name }, { elements: { strong: <strong /> } })}
      </h1>
    );
  }

  return <h1>{t("hello", { name })}</h1>;
}
```

```ts filename="src/i18n/index.ts" switcher
import en from "./messages/en.json";
import es from "./messages/es.json";

export default {
  defaultLocale: "en",
  locales: ["en", "es"],
  messages: { en, es },
};
```

```json filename="src/i18n/messages/en.json" switcher
{
  "hello": "Hello {{name}}!",
  "strong-hello": "Hello <strong>{{name}}</strong>!"
}
```

```json filename="src/i18n/messages/es.json" switcher
{
  "hello": "¡Hola {{name}}!",
  "strong-hello": "¡Hola <strong>{{name}}</strong>!"
}
```

## Consume translations

Brisa supports to consume translations inspired by libraries such as [i18next](https://www.i18next.com/) and [next-translate](https://github.com/aralroca/next-translate).

> [!TIP]
>
> **Good to know**: It only occupies 400B of client code if you consume translations in the web-components, if you only use it in server-components, pages, layout, api, middleware, it is 0B of client code.

In order to consume translations, you need first to define the `messages` property in `src/i18n.js` file:

```ts filename="src/i18n/index.ts" switcher
import { I18nConfig } from "brisa";

import en from "./messages/en.json";
import es from "./messages/es.json";

const i18nConfig: I18nConfig<typeof en> = {
  defaultLocale: "en",
  locales: ["en", "es"],
  messages: { en, es },
};

export default i18nConfig;
```

```json filename="src/i18n/messages/en.json" switcher
{
  "hello": "Hello {{name}}!",
  "strong-hello": "Hello <strong>{{name}}</strong>!"
}
```

```json filename="src/i18n/messages/es.json" switcher
{
  "hello": "¡Hola {{name}}!",
  "strong-hello": "¡Hola <strong>{{name}}</strong>!"
}
```

After this, you can consume translations in every part of your app through the [request context](/docs/building-your-application/data-fetching/request-context): `middleware`, `api` routes, `page` routes, all page components, `responseHeaders`, `layout`, `Head` of each page...

> [!IMPORTANT]
>
> **Important in TypeScript**: The generic type `<typeof en>` in `I18nConfig` enables type-safe consumption of translations with the `t` function by resolving the keys, keys with plurals and nested keys from the preferred locale. This allows IDE autocompletion and type checking of translation keys throughout the codebase, improving productivity and avoiding translation bugs due to typos or invalid keys.

The generic `I18nConfig<typeof en>` allows you to activate type-safe consuming translations with the `t` function. Displaying to you all the keys from the preferred locale messages, resolving plurals and nested values.

Example in a component:

```tsx filename="src/components/hello.tsx" switcher
import { type RequestContext } from "brisa";

type Props = { name: string };

export default function Hello({ name }: Props, { i18n }: RequestContext) {
  return (
    <main>
      <h1>{i18n.t("hello", { name })}</h1>
      <h2>
        {i18n.t("strong-hello", { name }, { elements: { strong: <strong /> } })}
      </h2>
    </main>
  );
}
```

```js filename="src/components/hello.js" switcher
export default function Hello({ name }, { i18n }) {
  return <h1>{i18n.t("hello", { name })}</h1>;
}
```

The `t` function:

- **Input**:
  - **i18nKey**: `string` (key)
  - **query**: `object` _(optional)_ (example: `{ name: 'Leonard' }`). [See more](#interpolation)
  - **options**: `object` _(optional)_
    - **fallback**: `string` | `string[] `- fallback if i18nKey doesn't exist. [See more](#fallbacks).
    - **returnObjects**: `boolean` - Get part of the JSON with all the translations. [See more](#nested-messages).
    - **default**: `string` - Default translation for the key. If fallback keys are used, it will be used only after exhausting all the fallbacks.
    - **elements** - `JSX.Element[]` | `Record<string, JSX.Element>` - Useful to use HTML inside translations. In case of Array each index corresponds to the defined tag `<0>`/`<1>`. In case of object each key corresponds to the defined tag `<example>`.
- **Output**: `string` | `JSX.Element`

### Override Translations

You can employ the `i18n.overrideMessages` method to override messages at the session level. This method is applicable to all server parts using the [RequestContext](/docs/building-your-application/data-fetching/request-context) or in web components utilizing the [WebContext](/docs/building-your-application/data-fetching/web-context).

#### Override Translations in Server Parts

In situations where pages are connected to external i18n services and there is a need to fetch the latest translations from the external service on each request, this function proves useful.

```tsx filename="src/pages/index.tsx" switcher
import { type RequestContext } from "brisa";

export default async function Page({}, { i18n }: RequestContext) {
  await i18n.overrideMessages(async (originalMessages) => {
    const newMessages = await fetch(/* */).then((r) => r.json());
    return { ...originalMessages, ...newMessages };
  });

  // This translation may have been overwritten
  return <div>{i18n.t("foo")}</div>;
}
```

Consider the following middleware example for scenarios where a language is specific to one page and not available on others.

```ts filename="src/middleware.ts" switcher
import { type RequestContext, notFound } from "brisa";

export default async function middleware(request: RequestContext) {
  const { locale, overrideMessages } = request.i18n;

  // "ca" locale is only available on the home page
  if (locale === "ca") {
    // Throw 404 error for other pages with the same locale
    if (request.route.pathname !== "/") notFound();

    // Load "ca" messages from an external service
    const caMessages = await fetch(/* */).then((r) => r.json());

    // Save "ca" messages
    i18n.overrideMessages(() => caMessages);
  }
}
```

#### Override Translations in Web Components

Consider scenarios where you want to use it in web components to load a dynamically dictionary:

```tsx
import type { WebContext } from "brisa";

export default async function DynamicDictionary(
  {},
  { state, i18n }: WebContext,
) {
  const open = state<boolean>(false);
  let isDictionaryLoaded = false;

  async function onToggle() {
    if (!open.value && !isDictionaryLoaded) {
      isDictionaryLoaded = true;

      await i18n.overrideMessages(async (messages) => ({
        ...messages,
        dynamicDictionary: await fetch(/* some url */).then((res) =>
          res.json(),
        ),
      }));
    }

    open.value = !open.value;
  }

  return (
    <>
      <button onClick={onToggle}>
        {open.value ? i18n.t("close") : i18n.t("open")}
      </button>
      {open.value && i18n.t("dynamicDictionary.someKey")}
    </>
  );
}
```

In this example, the `DynamicDictionary` web component demonstrates dynamic loading of translations in an event. Upon toggling, it checks whether the dictionary is already loaded; if not, it fetches translations from a specified URL and uses `overrideMessages` to integrate them seamlessly into the current session. The translated key, `dynamicDictionary.someKey`, is then displayed based on the component's state. This approach allows on-the-fly language customization for improved user experience.

> [!NOTE]
>
> Messages are already filtered by the current `locale`. Therefore, you can only override messages for the specific locale during the session (request in server parts and globalThis in web components).

> [!NOTE]
>
> The `overrideMessages` function does not perform global overrides on the original values; instead, it exclusively modifies them at the request level in server parts or on the client side for a specific session. This ensures that changes made with this function are scoped appropriately, preventing unintended global alterations.

### Interpolation

Interpolation allows integrating dynamic values into your translations.

All values get escaped to mitigate XSS attacks.

Example to display: "`Hello Brisa`":

Keys:

```json filename="src/i18n/messages/en.json"
{
  "hello": "Hello {{name}}!"
}
```

Sample:

```js
t("hello", { name: "Brisa" }); // Hello Brisa!
```

### Prefix and suffix

You can change the delimiter that is used for interpolation touching the configuration of `src/i18n.js`:

```js filename="src/i18n.js"
export default {
  locales: ["en-US", "fr", "nl-NL"],
  defaultLocale: "en-US",
  interpolation: {
    prefix: "[[",
    suffix: "]]",
  },
};
```

And now you can adapt the interpolation messages to use `[[` and `]]`:

```json filename="src/i18n/messages/en.json"
{
  "hello": "Hello [[name]]!"
}
```

To consume the translations is the same as before.

Sample:

```js
t("hello", { name: "Brisa" }); // Hello Brisa!
```

#### Formatters

You can format params using the `interpolation.formatter` config function.

The formatter is the communication layer with [Intl EcmaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) features.

For example it helps to transform values with decimals, currencies, etc, depending on the locale.

Sample adding the `number` format:

```ts filename="src/i18n.ts" switcher
import { I18nConfig } from "brisa";

const formatters = {
  es: new Intl.NumberFormat("es-ES"),
  en: new Intl.NumberFormat("en-EN"),
};

const i18nConfig: I18nConfig = {
  // ...
  interpolation: {
    format: (value, format, lang) => {
      if (format === "number") return formatters[lang].format(value);
      return value;
    },
  },
};

export default i18nConfig;
```

```js filename="src/i18n.js" switcher
const formatters = {
  es: new Intl.NumberFormat("es-ES"),
  en: new Intl.NumberFormat("en-EN"),
};

export default {
  // ...
  interpolation: {
    format: (value, format, lang) => {
      if (format === "number") return formatters[lang].format(value);
      return value;
    },
  },
};
```

In English:

```json
{
  "example": "The number is {{count, number}}"
}
```

In Spanish:

```json
{
  "example": "El número es {{count, number}}"
}
```

Using:

```js
t("example", { count: 33.5 });
```

Returns:

- In English: `The number is 33.5`
- In Spanish: `El número es 33,5`

### Nested messages

It's possible to use nested messages in the JSONs:

```json filename="src/i18n/messages/en.json"
{
  "nested": {
    "example": "Hello {{name}}"
  }
}
```

To consume it by default is used the `.` key separator:

```js
t("nested.example", { name: "Brisa" });
```

#### Key separator

You can change the `keySeparator` of nested messages in the `src/i18n.js` configuration:

```js filename="src/i18n.js"
return {
  // ...
  keySeparator: "|",
};
```

Then:

```js
t("nested|example");
```

### Return all nested translations

You can use the `returnObjects: true`, in the `t` options to get all.

```js
t("nested", { name: "Brisa" }, { returnObjects: true });
// { "example": "Hello Brisa" }
```

Also you can use a dot "`.`" as all:

```js
t(".", { name: "Brisa" }, { returnObjects: true });
// { "nested": { "example": "Hello Brisa" } }
```

Taking account that these are the messages:

```json filename="src/i18n/messages/en.json"
{
  "nested": {
    "example": "Hello {{name}}"
  }
}
```

### Fallbacks

If no translation exists you can define fallbacks (`string|string[]`) to search for other translations:

Sample of a fallback:

```js
t(
  "message-key",
  { count: 1 },
  {
    fallback: "fallback-key",
  },
);
```

Sample with list of fallbacks:

```js
t(
  "message-key",
  { count: 42 },
  {
    fallback: ["fallback-key", "fallback-key-2"],
  },
);
```

### Plurals

Brisa support 6 plural forms (taken from [CLDR Plurals](http://cldr.unicode.org/index/cldr-spec/plural-rules) page) by adding to the key this suffix (or nesting it under the key with no `_` prefix):

- `_zero`
- `_one` (singular)
- `_two` (dual)
- `_few` (paucal)
- `_many` (also used for fractions if they have a separate class)
- `_other` (required—general plural form—also used if the language only has a single form)

_See more info about plurals [here](https://unicode-org.github.io/cldr-staging/charts/37/supplemental/language_plural_rules.html#sl)_.

Only the last one, **`_other`**, is required because it’s the only common plural form used in all locales.

All other plural forms depends on locale. For example English has only two: `_one` and `_other` (1 cat vs. 2 cats). Some languages have more, like Russian and Arabic.

In addition, Brisa also support **an exact match** by specifying the number (`_0`, `_999`) and this works for all locales. Here is an example:

```js
// **Note**: Only works if the name of the variable is {{count}}.
t("cart-message", { count });
```

And the messages:

```json filename="src/i18n/messages/en.json"
{
  "cart-message_0": "The cart is empty", // when count === 0
  "cart-message_one": "The cart has only {{count}} product", // singular
  "cart-message_other": "The cart has {{count}} products", // plural
  "cart-message_999": "The cart is full" // when count === 999
}
```

or

```js
{
  "cart-message": {
     "0": "The cart is empty", // when count === 0
     "one": "The cart has only {{count}} product", // singular
     "other": "The cart has {{count}} products", // plural
     "999": "The cart is full", // when count === 999
  }
}
```

### HTML inside the translation

Brisa supports consuming HTML inside translations, all interpolations are escaped to avoid XSS attacks and elements are defined from where they are consumed.

You can use `numbers` or `names`:

```json filename="src/i18n/messages/en.json"
{
  "hello": "Hello <0>{{name}}</0>!",
  "hello-2": "Hello <bold>{{name}}</bold>!"
}
```

Then to consume it you need to define the elements using an `Record<string, JSX.Element>` or an `JSX.Element[]`:

```js
t("hello", { name: "Brisa" }, { elements: [<strong />] });
```

or

```js
t("hello-2", { name: "Brisa" }, { elements: { bold: <strong /> } });
```

### Default value when translation does't exist

If the translation does not exist and all [fallback](#fallbacks) keys fail (if any), then as default behavior, the key is shown.

```js
t("hello", { name: "Brisa" }); // Hello Brisa
t("no-existing-key"); // no-existing-key
```

#### Change default value

You can overwrite the default value using the `default` option:

```js
t("no-existing-key", {}, { default: "No value" }); // No value
```

### Empty translations

With the `allowEmptyStrings` option of `/src/i18n/index.ts` you can change how translated empty strings should be handled.

```json filename="src/i18n/messages/en.json"
{
  "hello": ""
}
```

If omitted or passed as `true` _(By default is `true`)_, it returns an empty string.

If passed as `false`, returns the key name itself.

```ts filename="src/i18n/index.ts"
import { I18nConfig } from "brisa";

import en from './messages/en.json';
import es from './messages/es.json';

const i18nConfig: I18nConfig<typeof en> = {
  defaultLocale: "en",
  locales: ["en", "es"],
  messages: { en, es }
  allowEmptyStrings: false,
};

export default i18nConfig;
```

Now `t('hello')` returns `"hello"` instead of an empty string `""`.

## Translate page pathname

Many times we want the URL to be different in different languages. For example:

- `/en/about-us` → `src/pages/about-us.tsx`
- `/es/sobre-nosotros` → `src/pages/about-us.tsx`

```js filename="src/i18n.js"
export default {
  locales: ["en-US", "es"],
  defaultLocale: "en-US",
  pages: {
    "/about-us": {
      es: "/sobre-nosotros",
    },
    "/user/[username]": {
      es: "/usuario/[username]",
    },
  },
};
```

The key of each page item will be the name of the route. It works also with dynamic and catch-all routes.

It will automatically be taken into account in redirects, navigation and the `hrefLang` generation (see [here](#activate-automatic-hreflang) how to active `hrefLang`).

## Navigation

During navigation you do **not** have to add the locale in the `href` of the `a` tag, if you add it it will not do any conversion.

The fact of not adding the locale Brisa takes care of transforming the link:

```js
function MyComponent({}, { i18n: { t } }) {
  return <a href="/about-us">{t("about-us")}</a>;
}
```

Will be transformed to this HTML in `es`:

```html
<a href="/es/sobre-nosotros">Sobre nosotros</a>
```

## Transition between locales

As long as you do not put the locale in the `href` of `a` tag, then no conversion is done. It is useful to change the language:

```tsx filename="src/components/change-locale.tsx" switcher
import { type RequestContext } from "brisa";

export function ChangeLocale(props: {}, { i18n, route }: RequestContext) {
  const { locales, locale, pages, t } = i18n;

  return (
    <ul>
      {locales.map((lang) => {
        const pathname = pages[route.name]?.[lang] ?? route.pathname;

        if (lang === locale) return null;

        return (
          <li key={lang}>
            <a href={`/${lang}${pathname}`}>{t(`change-to-${lang}`)}</a>
          </li>
        );
      })}
    </ul>
  );
}
```

```js filename="src/components/change-locale.js" switcher
export function ChangeLocale(props: {}, { i18n, route }) {
  const { locales, locale, pages, t } = i18n;

  return (
    <ul>
      {locales.map((lang) => {
        const pathname = pages[route.name]?.[lang] ?? route.pathname;

        if (lang === locale) return null;

        return (
          <li key={lang}>
            <a href={`/${lang}${pathname}`}>{t(`change-to-${lang}`)}</a>
          </li>
        );
      })}
    </ul>
  );
}
```

## Leveraging the `BRISA_LOCALE` cookie

Brisa supports overriding the accept-language header with a `BRISA_LOCALE=the-locale` cookie. This cookie can be set using a language switcher and then when a user comes back to the site it will leverage the locale specified in the cookie when redirecting from `/` to the correct locale location.

For example, if a user prefers the locale `fr` in their accept-language header but a `BRISA_LOCALE=en` cookie is set the `en` locale when visiting `/` the user will be redirected to the `en` locale location until the cookie is removed or expired.

## Search Engine Optimization

Since Brisa knows what language the user is visiting it will automatically add the `lang` and `dir` attributes to the `<html>` tag.

The [`lang` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang) is added to define the language of the content assisting search engines and browsers, meanwhile the [`dir` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir) is added to indicate to search engines and browsers the directionality of the content text.

### Activate automatic `hrefLang`

Brisa by default doesn't add the `hreflang` meta tags, but you can activate it to automatic generate the `hrefLang`.

To activate the generation of `hrefLang` you need the `hrefLangOrigin` property to specify one or more origins.

For one origin:

```js filename="src/i18n.js"
export default {
  locales: ["en-US", "es"],
  defaultLocale: "en-US",
  hrefLangOrigin: "https://www.example.com",
};
```

For multi-origins:

```js filename="src/i18n.js"
export default {
  locales: ["en-US", "es"],
  defaultLocale: "en-US",
  hrefLangOrigin: {
    es: "https://www.example.com",
    en: "https://www.example.co.uk",
  },
};
```

In the case of using [domain routing](#domain-routing), maybe you wonder why you have to repeat domains and origins? 🤔

- `domains` defines the default language per domain for routing and language detection.
- `hrefLangOrigin` defines the origin/domain to use in the href attribute of hreflang for each language.

The main difference between them is that you can have multiple domains in `domains` with the same `defaultLocale`, but in `hrefLangOrigin` you want to prioritize a specific one per language. Besides, you may not have `domains` defined but want to use the `hrefLangOrigin` to only 1 origin.

`hrefLang` is automatic managed by Brisa, however `rel=canonical` links not.

For these [`domains`](<(#domain-routing)>) that have the same `defaultLocale` we recommend to manage in the [layout](/docs/building-your-application/routing/pages-and-layouts#layout) the [canonical](https://en.wikipedia.org/wiki/Canonical_link_element) links in order to prevent duplicate content issues in search engine optimization.

## `finalURL`

The `finalURL` is a field you have access to in the [RequestContext](/docs/building-your-application/data-fetching/request-context) and is the URL of your page, regardless of the fact that for the users it is another one.

For example, if the user enters to `/es/sobre-nosotros/` the `finalURL` can be `/about-us` because your page is in `src/pages/about-us/index.tsx`.

```tsx
export default function SomeComponent(
  {},
  { i18n, finalURL, route }: RequestContext,
) {
  console.log(`${finalURL} - ${i18n.locale} - ${route.pathname}`);
  // /about-us - es - /es/sobre-nosotros/
}
```

## Translate in your web components

Brisa's web components allow direct consumption of translation keys within the component. You can seamlessly integrate translation into your components without the need for extensive configurations.

Brisa intelligently identifies and imports only the necessary translation keys required by a web component. This eliminates unnecessary overhead, ensuring optimal performance by importing only the keys relevant to the component's functionality.

```tsx
export default function WebComponent({}, { i18n }: WebContext) {
  return <h2>{i18n.t("hello-world")}</h2>;
}
```

### Dynamic keys

Brisa excels in supporting dynamic translation keys at the web component level using the `i18nKeys` feature. This becomes particularly valuable when managing dynamic content, such as generating translation keys based on runtime variables.

Consider the example below:

```tsx
export default function Item({ itemId }, { i18n: { t } }: WebContext) {
  return (
    <>
      <h2>{t(`item.${itemId}.title`)}</h2>
      <p>{t(`item.${itemId}.description`)}</p>
      <a href={`/item/${itemId}`}>{t("more")}</a>
    </>
  );
}

Item.i18nKeys = [/item.*(title|description)/];
```

In this scenario, the static key `more` imports seamlessly, while the other dynamic keys require explicit specification in `Item.i18nKeys`. The `i18nKeys` field accepts both [`string`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) and [`RegExp`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) types for flexibility.

Example Usage:

```tsx
Item.i18nKeys = ["item"];
```

For more precision, utilize `RegExp`:

```tsx
Item.i18nKeys = [/item.*(title|description)/];
```

### Plurals

Brisa seamlessly manages the importation of all plural rules associated with a translation key. The following translations exemplify the pluralization handling:

```ts
{
  "cart-message_0": "The cart is empty",
  "cart-message_one": "The cart has only {{count}} product",
  "cart-message_other": "The cart has {{count}} products",
  "cart-message_999": "The cart is full",
}
```

or

```ts
{
  "cart-message": {
     "0": "The cart is empty",
     "one": "The cart has only {{count}} product",
     "other": "The cart has {{count}} products",
     "999": "The cart is full",
  }
}
```

All associated plural rules are imported to the client code after consuming the key:

```ts
t("cart-message", { count });
```

Brisa's comprehensive translation handling, dynamic key support, and intelligent importation make it a powerful tool for developers seeking efficient localization in web development projects.
