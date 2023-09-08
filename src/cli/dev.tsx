import fs from "node:fs";
import path from "node:path";
import { BunriseRequest, renderToString } from "../bunrise";
import { JSXElement } from "../types";
import { enableLiveReload } from "./dev-live-reload";
import getRootDir from "../utils/get-root-dir";

process.env.NODE_ENV = "development";

const projectDir = getRootDir();
const srcDir = path.join(projectDir, "src");
const pagesDir = path.join(srcDir, "pages");

if (!fs.existsSync(pagesDir)) {
  console.error('Not exist "src/pages" directory. It\'s required to run "bunrise dev"');
  process.exit(1);
}

const assetsDir = path.join(srcDir, "public");
const pagesRouter = new Bun.FileSystemRouter({ style: "nextjs", dir: pagesDir });
const rootRouter = new Bun.FileSystemRouter({ style: "nextjs", dir: srcDir })

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

const serverOptions = enableLiveReload({ port: 3000, fetch });
const server = Bun.serve(serverOptions);

console.log(`Listening on http://localhost:${server.port}...`);
