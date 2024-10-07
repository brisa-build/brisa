---
title: Panda CSS
description: Learn how to style your pages using Panda CSS
---

# Panda CSS

One option in Brisa is to integrate your app with [Panda CSS](https://panda-css.com/), a CSS framework that lets you create atomic compiled styles like tailwind. You might find it easier to write and maintain your styles using this.

Then you can use in your `.tsx`:

```tsx
import { css } from './styled-system/css'
 
export function App() {
  return <div className={css({ bg: 'red.400' })} />
}
```

To integrate Panda CSS into your Brisa project, take a look at the integration with Panda CSS in the [integrations section](/building-your-application/integrations/panda-css).
