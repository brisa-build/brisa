import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';
import Layout from './Layout.vue';

import './vars.css';

export default {
  extends: DefaultTheme,
  Layout: {
    ...Layout,
    components: {
      ...Layout.components,
    },
  },
  enhanceApp({ app }) {
    enhanceAppWithTabs(app);
  },
} satisfies Theme;
