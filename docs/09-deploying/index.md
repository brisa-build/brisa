---
title: Deploying
description: Learn how to deploy your Brisa app to production
---

Congratulations, it's time to ship to production.

## Production Builds

Running `brisa build` generates an optimized version of your application for production. HTML, CSS, and JavaScript files are created based on your pages. JavaScript is **compiled** and browser bundles are **minified** using the [Bun Compiler](https://bun.sh/docs/bundler) to help achieve the best performance.

### Bun Server

Brisa can be deployed to any hosting provider that supports Bun. Ensure your `package.json` has the `"build"` and `"start"` scripts:

```json filename="package.json"
{
  "scripts": {
    "dev": "brisa dev",
    "build": "brisa build",
    "start": "brisa start"
  }
}
```

Then, run `bun run build` to build your application. Finally, run `bun run start` to start the Bun server. This server supports all Brisa features.

## Deploy

Choose your hosting to deploy:

- [Deploy Brisa app to **Fly.io**](/docs/deploying/fly-io)
- [Deploy Brisa app to **Vercel**](/docs/deploying/vercel)
- [Deploy Brisa app to **Netlify**](/docs/deploying/netlify)
- [Deploy Brisa app to **AWS**](/docs/deploying/aws)
