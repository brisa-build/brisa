---
description: The Brisa CLI to add integrations.
---

# Adding integrations (`brisa add`)

`brisa add` allows you to add integrations to your project. To get a list of the available options with `brisa add`, run the following command inside your project directory:

```sh
brisa add --help
```

The output should look like this:

```sh
Usage: brisa add <integration>
Integrations:
 mdx          Add mdx integration
 tailwindcss  Add tailwindcss integration
 pandacss     Add pandacss integration
Options:
 --help       Show help
```

## MDX integration

The MDX integration allows you to use MDX files in your project. To add the MDX integration to your project, run the following command inside your project directory:

```sh
brisa add mdx
```

> [!NOTE]
>
> Take a look at the [MDX integration documentation](/building-your-application/integrations/mdx) to learn more about the MDX integration.

## Tailwind CSS integration

The Tailwind CSS integration allows you to use Tailwind CSS in your project. To add the Tailwind CSS integration to your project, run the following command inside your project directory:

```sh
brisa add tailwindcss
```

> [!NOTE]
>
> Take a look at the [Tailwind CSS integration documentation](/building-your-application/integrations/tailwind-css) to learn more about the Tailwind CSS integration.

## Panda CSS integration

The Panda CSS integration allows you to use Panda CSS in your project. To add the Panda CSS integration to your project, run the following command inside your project directory:

```sh
brisa add pandacss 
```

> [!NOTE]
>
> Take a look at the [Panda CSS integration documentation](/building-your-application/integrations/panda-css) to learn more about the Panda CSS integration.
