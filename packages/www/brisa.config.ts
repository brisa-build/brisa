import type { Configuration } from 'brisa';
import vercel from 'brisa-adapter-vercel';

export default {
  output: 'node',
  outputAdapter: vercel(),
} satisfies Configuration;
