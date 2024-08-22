import type { WebComponentIntegrations } from 'brisa';

export default {
  'some-lib': {
    client: `${import.meta.dir}/../lib/emoji-picker.js`,
  },
} satisfies WebComponentIntegrations;
