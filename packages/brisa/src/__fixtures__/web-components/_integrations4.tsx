import type { WebComponentIntegrations, WebContextPlugin } from 'brisa';
import path from 'node:path';

export const webContextPlugins: WebContextPlugin[] = [(ctx) => ctx];

export default {
  'some-lib': {
    client: `${import.meta.dirname}${path.sep}..${path.sep}lib${path.sep}some-lib.js`,
  },
} satisfies WebComponentIntegrations;
