---
description: Learn how to deploy your Brisa app to production
prev:
  text: 'iOS App'
  link: '/building-your-application/building/ios-app'
next:
  text: 'Fly.io'
  link: '/building-your-application/deploying/fly-io'
---

# Deploying

Congratulations, it's time to ship to production.

In this section, you will learn how to deploy your Brisa application to production. Choose your hosting provider and follow the instructions to deploy your application.

## Static Site App / Web Service App with Docker 

**_Bun runtime compatible_**

- [Deploy Brisa app to **Fly.io**](/building-your-application/deploying/fly-io)
- [Deploy Brisa app to **AWS**](/building-your-application/deploying/aws)
- [Deploy Brisa app to **Render.com**](/building-your-application/deploying/render-com)

## Static Site App / Web Service App with Adapters 

**_Non-Bun runtime compatible_**

- [Deploy Brisa app to **Vercel**](/building-your-application/deploying/vercel)
- [Deploy Brisa app to **Netlify**](/building-your-application/deploying/netlify)

## Custom Adapters

[Adapters](/building-your-application/configuring/output-adapter) are useful to don't write [IaC](https://en.wikipedia.org/wiki/Infrastructure_as_code) code, just plug and play. In Brisa, we offer adapters for some Cloud Providers, but you can write your own and share it with the community.

- [Writing a Custom Adapter](/building-your-application/deploying/writing-a-custom-adapter)

## Learn more

- [Docker](/building-your-application/deploying/docker) - Learn how to containerize a Brisa application with Docker.
