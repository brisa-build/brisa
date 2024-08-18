---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

footer: true

hero:
  name: "Brisa"
  text: "Inspired by the others, the best of each one."
  tagline: Brisa is designed to start, build, test, deploy and run fast.
  image:
    src: /assets/brisa.svg
    alt: Brisa
  actions:
    - theme: brand
      text: Quick start
      link: /getting-started/quick-start.md
    - theme: alt
      text: View on Github
      link: https://github.com/brisa-build/brisa

features:
  - title: 🚀 Fast & everything you need
    details: JSX, TS, server/web components, server actions, optimistic updates, SSR, streaming, suspense, signals, websockets, middleware, layouts...
  - title: 🌍 i18n support
    details: text translation and routing carrying only the translations you consume.
  - title: 📦 Tiny
    details: 0B by default, 2kB when you use server actions (RPC size), and 3kb when you need web components.
  - title: 📲 Change the output
    details: You can change your web from server to static, to desktop, android or ios app with just one configuration command.
---

<script setup>
import Standards from '.vitepress/components/standards.vue'
import Showcase from '.vitepress/components/showcase.vue'
import HeaderBanner from '.vitepress/components/header-banner.vue'
import CodeSections from '.vitepress/code-sections/index.md'
</script>

<HeaderBanner />
<CodeSections />
<Standards />
<Showcase />

