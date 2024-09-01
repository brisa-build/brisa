---
# https://vitepress.dev/reference/default-theme-home-page
title: Brisa - The Web Platform Framework
layout: home
footer: true
---

<script setup>
import Standards from '.vitepress/components/standards.vue'
import Showcase from '.vitepress/components/showcase.vue'
import HeaderBanner from '.vitepress/components/header-banner.vue'
import CodeSections from '.vitepress/code-sections/index.md'
import TopSection from '.vitepress/code-sections/top-section.md'
</script>


<section class="home-top-section">
<div style="margin-top:50px">
<h1 style="
      font-size:3.75rem; 
      line-height: 1.25;
      font-weight: 700; 
      background-clip: text;
       background-image: linear-gradient(to right, rgb(69 177 228), rgb(96 108 226));
      color: rgba(0, 0, 0, 0);
    ">
      Brisa
    </h1>

   <p style="
      font-size:30px; 
      line-height: 36px;
      font-weight: 700;
      background-clip: text;
      margin: 0;
      background-image:linear-gradient(120deg, #2cebcf 30%, #2cc5e2);
      color: rgba(0, 0, 0, 0);
    ">
       The Web Platform <span style=" background-clip: text;
       background-image: linear-gradient(to right, rgb(69 177 228), rgb(96 108 226));
      color: rgba(0, 0, 0, 0);">Framework</span>
    </p>
<br />
<TopSection />
</div>
<div class="img-container">
<div class="image-bg"></div>
<img src="/assets/brisa.svg" alt="Brisa" class="VPImage image-src" />
</div>
</section>

<HeaderBanner />
<CodeSections />
<Standards />
<Showcase />

