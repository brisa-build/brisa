---
description: Understand how to integrate MDX in your Brisa project
---

# Integrating MDX

[MDX](https://mdxjs.com/) is a popular format that allows you to write JSX in Markdown files. This integration enables you to use Brisa JSX components, directly in your Markdown files. When you integrate MDX into your Brisa project, you can create dynamic content with ease.

## Setup

To integrate MDX into your Brisa project, follow these steps:

```bash
bunx brisa add mdx
```

This command installs the necessary dependencies and configures your project to support MDX.

## Usage

After you have integrated MDX into your Brisa project, you can start using it in your Markdown files. For example, you can create a `src/pages/example.mdx` file with the following content:

```mdx
import { Button } from "@/components/Button";

# Example

This is an example of using MDX in Brisa.

<Button>Click me</Button>
<button-web-component>Click me</button-web-component>
```

In this example, the `Button` component is imported from the `@/components/Button` module, and the `button-web-component` is a web component that is integrated into the project.
