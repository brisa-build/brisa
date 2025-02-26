import type { Configuration } from 'brisa';
import tailwindcss from 'brisa-tailwindcss';

export default {
  output: 'static',
  integrations: [tailwindcss()],
} satisfies Configuration;
