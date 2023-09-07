import fs from 'node:fs';
import path from 'node:path';
import { page } from '../bunrise'
import { JSXElement } from '../types';

process.env.NODE_ENV = 'development';

const projectDir = import.meta.dir.replace(/(\/|\\)node_modules(\/|\\)bunrise(\/|\\)out(\/|\\)cli/, '');
const pagesDir = path.join(projectDir, 'pages');
const srcPagesDir = path.join(projectDir, 'src', 'pages');
let dir;

if (fs.existsSync(pagesDir)) dir = pagesDir;
else if (fs.existsSync(srcPagesDir)) dir = srcPagesDir;
else {
  console.error('Not exist "pages" or "src/pages" directory');
  process.exit(1);
}

const assetsDir = path.join(dir, '..', 'public');
const pagesRouter = new Bun.FileSystemRouter({ style: "nextjs", dir });

const server = Bun.serve({
  port: 3000,
  fetch: async (req) => {
    const url = new URL(req.url);
    const route = pagesRouter.match(url.pathname);
    const assetPath = path.join(assetsDir, url.pathname)

    if (route) {
      const module = await import(route.filePath)
      const PageComponent = module.default

      return page(<PageComponent /> as JSXElement, req);
    }

    if (fs.existsSync(assetPath)) return new Response(Bun.file(assetPath));

    // TODO: support 404 page
    return new Response('Not found', { status: 404 })
  },
});

console.log(`Listening on http://localhost:${server.port}...`);
