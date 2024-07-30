import type { Adapter, Configuration } from 'brisa';

export default function vercelAdapter(): Adapter {
  return {
    name: 'vercel',
    adapt(config: Configuration) {
      console.log('TODO: Not implemented', config);
    },
  };
}
