---
description: Learn how to set a Content Security Policy (CSP) for your Brisa application.
---

# Content Security Policy

[Content Security Policy (CSP)](https://developer.mozilla.org/docs/Web/HTTP/CSP) is important to guard your Brisa application against various security threats such as cross-site scripting (XSS), clickjacking, and other code injection attacks.

Developers can specify which origins are permissible for content sources, scripts, stylesheets, images, fonts, objects, media (audio, video), iframes, and more.

## Nonces

A [nonce](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce) is a unique, random string of characters created for a one-time use. It is used in conjunction with CSP to selectively allow certain inline scripts or styles to execute, bypassing strict CSP directives.

### Why use a nonce?

Even though CSPs are designed to block malicious scripts, there are legitimate scenarios where inline scripts are necessary. In such cases, nonces offer a way to allow these scripts to execute if they have the correct nonce.

### Adding a nonce with Middleware

[Middleware](/building-your-application/routing/middleware) enables you to add headers and generate nonces before the page renders.

Every time a page is viewed, a fresh nonce should be generated. This means that you **must use dynamic rendering to add nonces**.

For example:

```ts filename="src/middleware.ts"
import type { RequestContext } from "brisa";

export default function middleware(request: RequestContext) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  request.headers.set("x-nonce", nonce);
  request.headers.set(
    "Content-Security-Policy",
    `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `
      .replace(/\s{2,}/g, " ")
      .trim(),
  );
}

export function responseHeaders(request: RequestContext) {
  return {
    "Content-Security-Policy": request.headers.get("Content-Security-Policy"),
  };
}
```

By default, Middleware runs on all requests. You can filter Middleware using the `url` or the [`route`](/api-reference/components/request-context#route) of the [`Request Context`](/api-reference/components/request-context).

We recommend ignoring these:

- api (API routes)
- all request that `route` is `null` (files inside `public` folder)

```ts filename="middleware.ts"
import type { RequestContext } from "brisa";

export default function middleware(req: RequestContext) {
  // Early return
  if (!req.route || req.route.name.startsWith("/api/")) return;
  // ...
}
```

### Reading the nonce

You can now read the nonce from a [Server Component](/building-your-application/components-details/server-components) using the [`Request Context`](/api-reference/components/request-context):

```tsx filename="src/page.tsx"
import type { RequestContext } from "brisa";

export default function Page({}, request: RequestContext) {
  const nonce = request.headers.get("x-nonce");

  return (
    <script src="https://www.googletagmanager.com/gtag/js" nonce={nonce} />
  );
}
```
