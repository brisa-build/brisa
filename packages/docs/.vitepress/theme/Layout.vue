---
layout: doc
---
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
margin-top: 20px;
}
#brisa-content > .VPSidebar{
margin-top: 20px;
}
#brisa-content > .VPLocalNav > .container{
margin-top: 20px;
}
</style>