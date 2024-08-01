---
title: Deploying on Render.com
---

# Deploying on Render.com

This documentation outlines the process of deploying a Brisa application on [Render.com](https://render.com). Render is a cloud service provider that offers uploaddable **static sites** and a web service with **docker containers**.

Depending on your [`output`](/building-your-application/configuring/output) strategy, you can deploy your Brisa application on Render.com using different approaches:

- **Static Sites** ([`output="static"`](/building-your-application/configuring/output#2-static-output-static)): You can deploy your Brisa application as a static website on Render.com.
- **Web Services** ([`output="server"`](/building-your-application/configuring/output#1-server-output-server)): You can containerize your Brisa application using [Docker](/building-your-application/deploying/docker) and deploy it on Render.com.

## Deploying as a Static Website

To deploy a Brisa application as a static website on Render.com, you can use the [Static Sites](https://docs.render.com/static-sites) feature to host your static assets.

For static site, you need to modify the [`brisa.config.ts`](/building-your-application/configuring/brisa-config-js) file as follows:

```ts
import type { Configuration } from "brisa";

export default {
  output: "static",
} satisfies Configuration;
```

Here are the steps to deploy your Brisa application as a static website on Render.com:

1. **Create a new Static Site**: Create a new static site inside [Render.com Dashboard](https://dashboard.render.com/)
2. **Connect your GitHub repository**: Connect your GitHub repository to the Static Site.
3. **Modify Build Command and the Publish directory**: Set the build command to `bun run build` and the publish directory to `out` or the directory where your static assets are located.
4. **Set `BUN_VERSION` environment variable**: Set the `BUN_VERSION` environment variable to the Bun version that you are using in your Brisa application. You can check the Bun version by running `bun --version` in your terminal.

After these steps, Render will automatically build your static site and deploy it to the static site. You can access your Brisa application by visiting the URL provided by Render.

## Deploying as a Web Service

To deploy a Brisa application as a web service on Render.com, you can use [Docker](/building-your-application/deploying/docker) to containerize your application and deploy it on Render.com. We recommend reading the [Docker documentation](/building-your-application/deploying/docker) to understand how to containerize your Brisa application.

Once you have your `Dockerfile`, you need to:

1. **Create a new Web Service**: Create a new web service inside [Render.com Dashboard](https://dashboard.render.com/)
2. **Connect your GitHub repository**: Connect your GitHub repository to the Web Service, It will probably detect that you have a `DockerFile` and you will get Docker already selected, otherwise select Docker.

After these steps, Render will automatically build your Docker container and deploy it to the web service. You can access your Brisa application by visiting the URL provided by Render.
