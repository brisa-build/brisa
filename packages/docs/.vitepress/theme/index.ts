import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';
import HeaderBanner from '../components/header-banner.vue';
import Layout from './Layout.vue';

import './vars.css';

export default {
  extends: DefaultTheme,
  Layout: {
    ...Layout,
    components: {
      ...Layout.components,
      HeaderBanner,
    },
  },
  enhanceApp({ app }) {
    enhanceAppWithTabs(app);
  },
} satisfies Theme;
