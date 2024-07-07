---
description: Learn how to containerize a Brisa application with Docker
---

# Docker

## Containerize a Brisa application with Docker

> This guide assumes you already have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

[Docker](https://www.docker.com/) is a platform for packaging and running an application as a lightweight, portable container that encapsulates all the necessary dependencies.

To _containerize_ our application, we define a `Dockerfile`. This file contains a list of instructions to initialize the container, copy our local project files into it, install dependencies, and starts the application.

```Dockerfile
# Adjust BUN_VERSION as desired
ARG BUN_VERSION=1.1.18
FROM oven/bun:${BUN_VERSION}-slim as base

# Brisa app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Throw-away build stage to reduce size of final image
FROM base as build

# Install node modules
COPY --link bun.lockb package.json ./
RUN bun install --ci

# Copy Brisa application code
COPY --link . .

# Build Brisa application
RUN bun run build

# Final stage for app image
FROM base

# Copy built Brisa application
COPY --from=build /app /app

# Start the Brisa server on port 3000
EXPOSE 3000
CMD [ "bun", "run", "start" ]
```

Now that you have your docker image, let's look at `.dockerignore` which has the same syntax as `.gitignore`, here you need to specify the files/directories that must not go in any stage of the docker build. An example for a ignore file is:

```.dockerignore
.vscode
node_modules
.DS_Store
build
```

We'll now use `docker build` to convert this `Dockerfile` into a Docker image, is a self-contained template containing all the dependencies and configuration required to run the application.

```sh
docker build -t my-app .
```

> [!NOTE]
>
> The `-t` flag lets us specify a name for the image.

We've built a new _Docker image_. Now let's use that image to spin up an actual, running container.

```sh
docker run -p 3000:3000 my-app
```

We'll use `docker run` to start a new container using the `my-app` image. We'll map the container's port 3000 to our local machine's port 3000 (`-p 3000:3000`).

The run command prints a string representing the container ID.

The container is now running in the background. Visit [localhost:3000](localhost:300). You should see your homepage.

> [!TIP]
>
> **Optional**: the flag `-d` flag to run in detached mode to run the container in the background.

To stop the container, we'll use `docker stop <container-id>`. If you can't find the container ID, you can use `docker ps` to list all running containers.

> [!NOTE]
>
> That's it! Refer to the [Docker documentation](https://docs.docker.com/) for more advanced usage.
