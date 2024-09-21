import type { WebComponentIntegrations } from 'brisa';

export default {
  'search-engine-wc': {
    client: 'search-engine-wc',
    server: 'search-engine-wc/server',
    types: 'search-engine-wc/types',
  },
} satisfies WebComponentIntegrations;
