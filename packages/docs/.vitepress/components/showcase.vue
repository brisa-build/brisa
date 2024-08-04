<script setup>
import { useData } from 'vitepress';
const { theme } = useData();
</script>

<template>
  <section class="flex flex-col justify-center items-center w-full max-w-6xl mx-auto py-4">
    <h2 style="
      font-size:3.75rem; 
      line-height: 1.25; 
      font-weight: 700; 
      background-clip: text; 
      background-image:linear-gradient(120deg, #2cebcf 30%, #2cc5e2);
      color: rgba(0, 0, 0, 0);
    ">
      Showcase
    </h2>
    <div class="showcase">
      <a style='--showcase-title:"zenettechnology.com"' class="showcase-item" href="https://zenettechnology.com/en"
        target="_blank" title="zenettechnology.com">
        <img style="border-radius: 4px;" width="280" height="155" src="/assets/zenettechnology.avif" />
      </a>
      <a style='--showcase-title:"aralroca.com"' class="showcase-item" href="https://aralroca.com" target="_blank"
        title="aralroca.com">
        <img style="border-radius: 4px;" width="280" height="155" src="/assets/aralroca-blog.avif" />
      </a>
    </div>
    <p class="text-xl md:text-2xl leading-relaxed text-gray-400 text-left md:text-center w-full max-w-2xl">
      The framework of choice when it matters
    </p>
  </section>
</template>