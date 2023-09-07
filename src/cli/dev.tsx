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
const apiDir = path.join(dir, '..', 'api');
const pagesRouter = new Bun.FileSystemRouter({ style: "nextjs", dir });
const apiRouter = fs.existsSync(apiDir) ? new Bun.FileSystemRouter({ style: "nextjs", dir: apiDir }) : null;

export default async function fetch(req: Request) {
  const url = new URL(req.url);
  const route = pagesRouter.match(url.pathname);
  const apiPath = url.pathname.replace(/^\/api/, '');
  const apiRoute = apiRouter?.match?.(apiPath);
  const assetPath = path.join(assetsDir, url.pathname);

  if (route) {
    const module = await import(route.filePath)
    const PageComponent = module.default

    return page(<PageComponent /> as JSXElement, req);
  }

  if (fs.existsSync(assetPath)) return new Response(Bun.file(assetPath));

  if (apiRoute && url.pathname.startsWith('/api')) {
    const module = await import(apiRoute.filePath)
    const method = req.method.toLowerCase();

    if (module[method]) return module[method](req);
  }

  // TODO: support 404 page
  return new Response('Not found', { status: 404 })
}

const server = Bun.serve({ port: 3000, fetch });

console.log(`Listening on http://localhost:${server.port}...`);
