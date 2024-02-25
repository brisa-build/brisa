---
title: Installation
description: Create a new Brisa application with `create-brisa-app`.
related:
  title: Next Steps
  description: Learn about the files and folders in your Brisa project.
  links:
    - getting-started/project-structure
---

### System Requirements

- Bun [1.0.29](https://bun.sh/) or later
- macOS, Windows (including WSL), and Linux are supported.

### Automatic Installation

We recommend starting a new Brisa app using `bun create brisa`, which sets up everything automatically for you.

```sh
bun create brisa
```

After the prompts, it will create a folder with your project name and install the required dependencies.

### Manual Installation

To manually create a new Brisa app, install the required packages:

```sh
bun install brisa@latest
```

Open your package.json file and add the following scripts:

```json
{
  "scripts": {
    "dev": "brisa dev",
    "build": "brisa build",
    "start": "brisa start"
  }
}
```

These scripts refer to the different stages of developing an application:

- `dev`: runs next dev to start Brisa in development mode.
- `build`: runs next build to build the application for production usage.
- `start`: runs next start to start a Brisa production server.

You need to add the jsx-runtime of Brisa in your `tsconfig.json` file:

```json
{
  "compilerOptions": {
    // ...rest
    "jsx": "react-jsx",
    "jsxImportSource": "brisa"
  }
}
```

## Creating directories

Brisa uses file-system routing (like Next.js pages) under the `src` folder. You can create a `src/pages/` directory.

Then, add an `index.tsx` file inside your `src/pages` folder. This will be your home page (`/`):

```tsx
export default function Page() {
  return <h1>Hello, Brisa!</h1>;
}
```

Then, add an `src/layout.tsx` file or `src/layout/index.tsx` to define the global layout. To add more layouts depending on the pages, take a look at the [layouts documentation](/docs/app/layouts.md).

### The `public` folder (optional)

Create a `public` folder to store static assets such as images, fonts, etc. Files inside public directory can then be referenced by your code starting from the base URL (`/`).

## Run the Development Server

Run npm run dev to start the development server.

- Visit http://localhost:3000 to view your application.
- Edit `src/layout/index.tsx` (or `src/pages/index.tsx`) file and save it to see the updated result in your browser.
