import fs from "node:fs";
import path from "node:path";
import { BunriseRequest, renderToString } from "../bunrise";
import { JSXElement } from "../types";
import getRootDir from "../utils/get-root-dir";
import { enableLiveReload } from "./dev-live-reload";

const isProduction = process.env.NODE_ENV === "production";
const projectDir = getRootDir();
const srcDir = path.join(projectDir, "src");
const buildDir = path.join(projectDir, "build");
const rootDir = isProduction ? buildDir : srcDir;
const assetsDir = path.join(rootDir, "public");
const pagesDir = path.join(rootDir, "pages");

if (isProduction && !fs.existsSync(buildDir)) {
  console.error('Not exist "build" yet. Please run "bunrise build" first');
  process.exit(1);
}

if (!fs.existsSync(pagesDir)) {
  const path = isProduction ? "build/pages" : "src/pages";
  const cli = isProduction ? "bunrise start" : "bunrise dev";

  console.error(`Not exist ${path}" directory. It\'s required to run "${cli}"`);
  process.exit(1);
}

const pagesRouter = new Bun.FileSystemRouter({
  style: "nextjs",
  dir: pagesDir,
});

const rootRouter = new Bun.FileSystemRouter({ style: "nextjs", dir: rootDir });

const responseInitWithGzip = {
  headers: {
    "content-encoding": "gzip",
    vary: "Accept-Encoding",
  },
};

export default async function fetch(req: Request) {
  const url = new URL(req.url);
  const route = pagesRouter.match(req);
  const isApi = url.pathname.startsWith("/api/");
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

  if (fs.existsSync(assetPath)) {
    const isGzip =
      isProduction && req.headers.get("accept-encoding")?.includes?.("gzip");

    const file = Bun.file(isGzip ? `${assetPath}.gz` : assetPath);
    const responseOptions = isGzip ? responseInitWithGzip : {};

    return new Response(file, responseOptions);
  }

  if (isApi && apiRoute) {
    const module = await import(apiRoute.filePath);
    const method = req.method.toLowerCase();

    if (module[method])
      return module[method](new BunriseRequest(req, apiRoute));
  }

  // TODO: support 404 page
  return new Response("Not found", { status: 404 });
}

const serverOptions = isProduction
  ? { port: 3000, fetch, development: false }
  : enableLiveReload({ port: 3000, fetch });

const server = Bun.serve(serverOptions);

console.log(
  `Listening on http://localhost:${server.port} (${process.env.NODE_ENV})...`,
);
