---
layout: doc
---
<template>
  <div>
    <Content id="brisa-content" />
  </div>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme';

const { Layout } = DefaultTheme;
const Content = Layout;
</script>
