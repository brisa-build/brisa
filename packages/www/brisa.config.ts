import type { Configuration } from 'brisa';
import vercel from 'brisa-adapter-vercel';

export default {
  output: 'static',
  outputAdapter: vercel(),
} satisfies Configuration;
