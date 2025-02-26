import type { Sitemap } from 'brisa';
import path from 'node:path';
import { fileSystemRouter } from 'brisa/server';

const origin = 'https://brisa.build';
const docs = fileSystemRouter({
  dir: path.join(import.meta.dirname, '..', '..', '..', 'docs'),
  fileExtensions: ['.md'],
});

const { routes } = fileSystemRouter({
  dir: path.join(import.meta.dirname, 'pages'),
});

const staticRoutes = routes.filter(
  ([pathname]) => pathname !== '/[...doc]' && pathname !== '/_404',
);

export default [
  ...staticRoutes.map(([pathname]) => ({
    loc: origin + pathname,
  })),
  ...docs.routes.map(([pathname]) => ({
    loc: origin + pathname,
  })),
] satisfies Sitemap;
