import fs from "node:fs";
import path from "node:path";
import { BunriseRequest, renderToString } from "../bunrise";
import { JSXElement } from "../types";

process.env.NODE_ENV = "development";

const projectDir = import.meta.dir.replace(
  /(\/|\\)node_modules(\/|\\)bunrise(\/|\\)out(\/|\\)cli/,
  "",
);
const pagesDir = path.join(projectDir, "pages");
const srcPagesDir = path.join(projectDir, "src", "pages");
let dir;

if (fs.existsSync(pagesDir)) dir = pagesDir;
else if (fs.existsSync(srcPagesDir)) dir = srcPagesDir;
else {
  console.error('Not exist "pages" or "src/pages" directory');
  process.exit(1);
}

const rootDir = path.join(dir, "..");
const assetsDir = path.join(rootDir, "public");
const pagesRouter = new Bun.FileSystemRouter({ style: "nextjs", dir });
const rootRouter = new Bun.FileSystemRouter({ style: "nextjs", dir: rootDir })

export default async function fetch(req: Request) {
  const url = new URL(req.url);
  const route = pagesRouter.match(req);
  const isApi = url.pathname.startsWith('/api/');
  const apiRoute = isApi ? rootRouter.match(req) : null;
  const assetPath = path.join(assetsDir, url.pathname);

  if (!isApi && route) {
    const module = await import(route.filePath);
    const PageComponent = module.default;
    const pageElement = (<PageComponent />) as JSXElement;
    const bunriseRequest = new BunriseRequest(req, route);
    const htmlString = await renderToString(pageElement, bunriseRequest);
    const responseOptions = {
      headers: { "content-type": "text/html;charset=UTF-8" },
    };

    return new Response(htmlString, responseOptions);
  }

  if (fs.existsSync(assetPath)) return new Response(Bun.file(assetPath));

  if (isApi && apiRoute) {
    const module = await import(apiRoute.filePath);
    const method = req.method.toLowerCase();

    if (module[method])
      return module[method](new BunriseRequest(req, apiRoute));
  }

  // TODO: support 404 page
  return new Response("Not found", { status: 404 });
}

const server = Bun.serve({ port: 3000, fetch });

console.log(`Listening on http://localhost:${server.port}...`);
