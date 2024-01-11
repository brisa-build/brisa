---
title: Deploying to Fly.io
description: Learn how to deploy to fly.io
---

[Fly.io](https://fly.io/) is the fastest way to deploy straight from your source code. You’ll be up and running in just minutes.

## Requeriments

Follow this docs to install `flyctl`:

- https://fly.io/docs/hands-on/install-flyctl/#windows

Then, login with:

```sh
flyctl auth login 
```


## Deploy your application

Deploying your Brisa app is done with the following command:

```sh
fly deploy
```

That's all 🥳. 

After executing this command you will have access to the URL of your Brisa app.
