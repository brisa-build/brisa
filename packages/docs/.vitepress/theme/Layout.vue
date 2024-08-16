<!-- .vitepress/theme/Layout.vue -->
<template>
  <div>
    <HeaderBanner />
    <Content id="brisa-content" />
  </div>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme'
import HeaderBanner from '../components/header-banner.vue'

const { Layout } = DefaultTheme
const Content = Layout
</script>

<style>
#brisa-content > header{
  margin: 13px 0;
}
</style>