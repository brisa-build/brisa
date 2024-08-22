import type { WebComponentIntegrations, WebContextPlugin } from 'brisa';
import path from 'node:path';

export const webContextPlugins: WebContextPlugin[] = [(ctx) => ctx];
const pathname = `${import.meta.dirname}${path.sep}..${path.sep}lib${path.sep}some-lib.js`;

export default {
  'some-lib': {
    client: pathname,
  },
  'different-name': {
    client: pathname,
  },
  'different-name-string-path': pathname,
} satisfies WebComponentIntegrations;
