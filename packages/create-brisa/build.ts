import { $ } from 'bun';

await $`rm -rf examples && mkdir examples && cp -r ../../examples/* examples`;
