import type { Configuration } from 'brisa';
import vercel from 'brisa-adapter-vercel';

export default {
  output: 'static',
  outputAdapter: vercel(),
  filterRuntimeDevErrors: (e) => {
    return !e.message?.startsWith?.('ResizeObserver') ?? true;
  },
} satisfies Configuration;
