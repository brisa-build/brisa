import type { WebComponentIntegrations } from 'brisa';

// Docs: https://brisa.build/building-your-application/components-details/external-libraries#web-components-dependencies
export default {
  'counter-wc': {
    client: 'counter-wc',
    server: 'counter-wc/server',
    types: 'counter-wc/types',
  },
  // This doesn't have SSR neither props types
  // (only type-safe to consume the element)
  'date-picker': {
    client: 'calendar-native-web-component',
  },
} satisfies WebComponentIntegrations;
