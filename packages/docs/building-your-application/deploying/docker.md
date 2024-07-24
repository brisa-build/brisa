---
Description: Learn how to containerize a Brisa application with Docker
---

# Docker

## Containerize with Docker

> This guide assumes you already have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

[Docker](https://www.docker.com/) is a platform for packaging and running an application as a lightweight, portable container that encapsulates all the necessary dependencies.

To _containerize_ our application, we define a `Dockerfile`. This file contains a list of instructions to initialize the container, copy our local project files into it, install dependencies, and start the application.

```Dockerfile
# Adjust BUN_VERSION as desired
ARG BUN_VERSION=1.1.21
FROM oven/bun:${BUN_VERSION}-slim AS base

# Brisa app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Throw-away build stage to reduce the size of the final image
FROM base AS build

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

Now that you have your docker image, let's look at `.dockerignore` which has the same syntax as `.gitignore`; here, you need to specify the files/directories that must not go in any stage of the docker build. An example of a ignore file is:

**dockerignore**:

```dockerfile
.vscode
node_modules
.DS_Store
build
```

If you want to be more strict, you can also invert the `.dockerignore` and use it as an allowed file. An example of how this would work is:

**dockerignore**:

```dockerfile
# Ignore all files from your repo
*

# Allow specific files or folders
!bun.lockb
!package.json
!src
```

Making the `.dockerignore` an allowed file becomes very handy to prevent trash on your image, or sensitive information. For example secrets, coverage files or another dev on your team using a different IDE.

We'll now use `docker build` to convert this `Dockerfile` into a Docker image. The result will be a self-contained template containing all the dependencies and configurations required to run the application on any platform.

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

## Containerize Monorepo with Docker + Turborepo

Next, it will be an extension of the above. Let's start with an example of a monorepo `Dockerfile`:

```Dockerfile
ARG BUN_VERSION=1.1.20
FROM oven/bun:${BUN_VERSION}-slim AS base
WORKDIR /app

# Run a Docker container as root is not a good idea, so let's prepare for using a non privileged user.
ENV USERNAME=bun
ENV USER_GROUP=bun

# We can take advantage of updating the base image.
RUN apt-get -y update

FROM base AS prepare

COPY --link . .

# We will be assuming that your app inside the monorepo is called @example/brisa-app
RUN bun --filter='@example/brisa-app' install --frozen-lockfile --production
RUN bun run build --filter @example/brisa-app

# copy production dependencies and source code into the final image
FROM base

COPY --link . .

# Copy node_modules
COPY --from=prepare /app/node_modules node_modules

# Copy the built folder
COPY --from=prepare /app/apps/brisa-app/build apps/brisa-app/build

# Giving to the copied files proper execution permissions
RUN chown ${USERNAME}:${USER_GROUP} -R .

ENV NODE_ENV=production

# run the app
EXPOSE 3000/tcp

# Running a non-root container
USER ${USERNAME}:${USER_GROUP}
ENTRYPOINT [ "bun", "run", "start", "--filter", "@example/brisa-app" ]
```

Simply copying and pasting does not work as expected.

Working with monorepos requires more initial setup time compared to a single repository. It is necessary to configure tools like Turborepo to ensure proper functionality.

> [!NOTE]
>
> Check the [Turborepo documentation](https://turbo.build/repo/docs) for more information.

We'll need to install Turborepo in the root of the project. Alternatively, you can install it globally, although we do not recommend this approach. Installing tools globally can lead to version conflicts within your team, which can be time-consuming to resolve. (This often results in the familiar refrain, "It works on my machine!" 😎).

In our documentation, we use Turborepo as an example, but there are other options available for managing monorepos.

**package.json**:

```json
// ...
"dependencies": {
 "turbo": "2.0.7"
},
// ...
```

Also, we will have to add a turbo.json file for telling Turborepo what commands it needs to listen to.

**turbo.json**:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {},
    "start": {}
  }
}
```

Finally, amend the .dockerfile to make sure it adds the new necessary files.

**.dockerfile**:

```dockerfile
*

# ROOT
!turbo.json
!bun.lockb
!package.json

# APPS
## Example
!apps/example/package.json
!apps/example/turbo.json
!apps/example/tsconfig.json
!apps/example/bunfig.toml # Optional, only if you run tests on the Dockerfile
!apps/example/brisa.config.ts
!apps/example/src/*
```

We've summarized an example of running Brisa on Dockerfile if you are using a monorepo with Turborepo.

## Advanced topics

### My docker image is too big

At Brisa, we love to optimize. In the previous Dockerfiles, we copied all node_modules, but most of the dependencies are already on the bundle, and we don't need it anymore.

Let us give you a Dockerfile example with more optimizations on the Dockerfile.

**Dockerfile**:

```dockerfile
ARG BUN_VERSION=1.1.20
FROM oven/bun:${BUN_VERSION}-slim AS base
WORKDIR /app

# Run a Docker container as root is not a good idea, so let's prepare for using a non privileged user.
ENV USERNAME=bun
ENV USER_GROUP=bun

# We can take advantage of updating the base image.
RUN apt-get -y update

FROM base AS prepare

COPY --link . .

# We will be assuming that your app inside the monorepo is called @example/brisa-app
RUN bun --filter='@example/brisa-app' install --frozen-lockfile --production
RUN bun run build --filter @example/brisa-app

# copy production dependencies and source code into the final image
FROM base

COPY --link . .

# Copy node_modules - DO NOT COPY THE WHOLE FOLDER; IT COULD BE HUGE !!!!
# COPY --from=prepare /app/node_modules node_modules

# Instead, copy only what you really need. In brisa, you will need to copy anything imported on brisa.config.ts and turbo in a monorepo scenario.
# Turbo
COPY --from=prepare /app/node_modules/.bin/turbo node_modules/.bin/turbo
COPY --from=prepare /app/node_modules/turbo node_modules/turbo
# This binary will change depending on the OS you are running your app.
COPY --from=prepare /app/node_modules/turbo-linux-64 node_modules/turbo-linux-64

# Brisa
COPY --from=prepare /app/node_modules/.bin/brisa node_modules/.bin/brisa
COPY --from=prepare /app/node_modules/brisa node_modules/brisa

# Other libs imported on brisa.config.ts, if you are using other libs, there is no need to add any other lib.

# Copy the built folder
COPY --from=prepare /app/apps/brisa-app/build apps/brisa-app/build

# Giving to the copied files proper execution permissions
RUN chown ${USERNAME}:${USER_GROUP} -R .

ENV NODE_ENV=production

# run the app
EXPOSE 3000/tcp

# Running a non-root container
USER ${USERNAME}:${USER_GROUP}
ENTRYPOINT [ "bun", "run", "start", "--filter", "@example/brisa-app" ]
```

That's all for now. Feel free to reach out or ask more questions on [Brisa's Discord](https://discord.com/invite/MsE9RN3FU4).
