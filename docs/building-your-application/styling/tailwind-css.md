---
title: Tailwind CSS
description: Learn how to style your pages using Tailwind CSS
---

# Tailwind CSS

One option in Brisa is to integrate your app with [Tailwind CSS](https://tailwindcss.com/), a CSS framework that lets you use utility classes instead of writing CSS. These utility classes are mostly one-to-one with a certain CSS property setting: for example, adding the `text-lg` to an element is equivalent to setting `font-size: 1.125rem` in CSS. You might find it easier to write and maintain your styles using these predefined utility classes!

Then you can use in your `.tsx`:

```tsx
export default function Home() {
  return (
    <div className="text-lg">Hello, world!</div>
  );
}
```

To integrate Tailwind CSS into your Brisa project, take a look at the integration with Tailwind CSS in the [integrations section](/building-your-application/integrations/tailwind-css).
