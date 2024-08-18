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

