---
description: Learn how to build and deploy
---

# Vercel

To deploy to Vercel, use [adapter-vercel](https://github.com/brisa-build/brisa/blob/main/packages/adapter-vercel).

> [!IMPORTANT]
>
> To deploy to Vercel, the following [`output`](/building-your-application/configuring/output)s are supported for now: `node` and `static`.

## Usage

Install with:

```sh
bun install -D brisa-adapter-vercel
```

Then, add the adapter to your `brisa.config.ts`:

```ts
/// file: brisa.config.ts
import vercel from 'brisa-adapter-vercel';

export default {
  output: 'node', // or 'static'
  outputAdapter: vercel({
    // see below for options that can be set here
  })
};
```

> [!NOTE]
>
> If you select `node` as the `output`, the runtime on Vercel will always be the latest LTS of Node.js. Brisa is only compatible with Node.js version 20.x and later.

## Deployment configuration

The `vercel` adapter accepts an object with the following properties:

- `regions`: an array of [edge network regions](https://vercel.com/docs/concepts/edge-network/regions) defaulting to `["iad1"]`. Note that multiple regions for serverless functions are only supported on Enterprise plans.
- `memory`: the amount of memory available to the function. Defaults to `1024` Mb, and can be decreased to `128` Mb or [increased](https://vercel.com/docs/concepts/limits/overview#serverless-function-memory) in 64Mb increments up to `3008` Mb on Pro or Enterprise accounts.
- `maxDuration`: [maximum execution duration](https://vercel.com/docs/functions/runtimes#max-duration) of the function. Defaults to `10` seconds for Hobby accounts, `15` for Pro and `900` for Enterprise.

> [!NOTE]
>
> If your pages need to access data in a specific region, it's recommended that they be deployed in the same region (or close to it) for optimal performance.

## Environment variables

Vercel makes a set of [deployment-specific environment variables](https://vercel.com/docs/concepts/projects/environment-variables#system-environment-variables) available. Like other environment variables, these are accessible from `process.env`.

## Skew protection

[Skew protection](https://vercel.com/docs/deployments/skew-protection) is a Vercel feature that routes client requests to their original deployment. When a user visits your app, a cookie is set with the deployment ID, and any subsequent requests will be routed to that deployment for as long as skew protection is active. When they reload the page, they will get the newest deployment. 
