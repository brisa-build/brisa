---
description: Learn how to build and deploy using a cloud provider adapter
---

# Output Adapter

The `outputAdapter` configuration property in `brisa.config.ts` allows you to define the type of output adapter you desire, with options such as `vercel`. This enables you to deploy your Brisa project to various cloud providers, ensuring optimal performance and compatibility.

## Understanding Output Adapters

### 1. Vercel Adapter (`@brisa/adapter-vercel`)

The `vercel` adapter allows you to deploy your Brisa project to [Vercel](https://vercel.com/), a cloud platform for static sites, serverless functions and edge entry points. To utilize this adapter in your Brisa project, ensure that your `brisa.config.ts` file includes the following:

```ts
import vercel from '@brisa/adapter-vercel';

export default {
  outputAdapter: vercel({ /* ... */ })
};
```

> [!IMPORTANT]
>
> In Vercel, the runtime is based on [Node.js](https://nodejs.org/) and/or [Edge](https://vercel.com/docs/concepts/functions/edge-functions) runtime.

#### Documentation

- [Vercel Adapter](/building-your-application/deploying/vercel)

----
TODO: Add Netlify and others.