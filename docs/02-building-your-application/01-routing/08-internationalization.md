---
title: Internationalization (i18n)
description: Brisa has built-in support for internationalized routing, language detection and consume translations. Learn more here.
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

```js filename="src/i18n.js"
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
- `t` function to consume translations

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

> **Good to know**: It only occupies 400B of client code if you consume translations in the web-components, if you only use it in server-components, pages, layout, api, middleware, it is 0B of client code.

In order to consume translations, you need first to define the `messages` property in `src/i18n.js` file:

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

After this, you can consume translations in every part of your app through the [request context](/docs/building-your-application/data-fetching/request-context): `middleware`, `api` routes, `page` routes, all page components, `responseHeaders`, `layout`, `Head` of each page...

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

```js filename="src/i18n.js"
const formatters = {
  es: new Intl.NumberFormat("es-ES"),
  en: new Intl.NumberFormat("en-EN"),
};

return {
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
export default {
  defaultLocale: "en",
  locales: ["en", "es"],
  allowEmptyStrings: false,
};
```

Now `t('hello')` returns `"hello"` instead of an empty string `""`.

## Translate the page route

TODO

## Transition between locales

TODO

## Leveraging the `BRISA_LOCALE` cookie

Brisa supports overriding the accept-language header with a `BRISA_LOCALE=the-locale` cookie. This cookie can be set using a language switcher and then when a user comes back to the site it will leverage the locale specified in the cookie when redirecting from `/` to the correct locale location.

For example, if a user prefers the locale `fr` in their accept-language header but a `BRISA_LOCALE=en` cookie is set the `en` locale when visiting `/` the user will be redirected to the `en` locale location until the cookie is removed or expired.

## Search Engine Optimization

Since Brisa knows what language the user is visiting it will automatically add the `lang` attribute to the `<html>` tag.

### Activate automatic `hrefLang`

Brisa by default doesn't add the `hreflang` meta tags, but you can activate it to automatic generate the `hrefLang`.

TODO
