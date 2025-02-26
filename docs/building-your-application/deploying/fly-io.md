---
description: Learn how to deploy to fly.io
---

# Deploying to Fly.io

[Fly.io](https://fly.io/) is the fastest way to deploy straight from your source code. You’ll be up and running in just minutes.

## Requirements

Follow this docs to install `flyctl`:

- https://fly.io/docs/hands-on/install-flyctl/

Then, login with:

```sh
flyctl auth login
```

## Deploy your application

Deploying your Brisa app is done with the following command:

```sh
fly launch --now
```

That's all 🥳.

After executing this command you will have access to the URL of your Brisa app.

> [!NOTE]
>
> It is not necessary to configure any additional settings like an [`outputAdapter`](/building-your-application/configuring/output-adapter), as Fly.io is compatible with Brisa's default output.
