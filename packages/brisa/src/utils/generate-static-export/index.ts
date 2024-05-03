import path from "node:path";
import fs from "node:fs";
import { getConstants } from "@/constants";
import { getServeOptions } from "./utils";
import { toInline } from "@/helpers";
import { logWarning } from "@/utils/log/log-build";
import type { FileSystemRouter, MatchedRoute } from "bun";

const fakeServer = { upgrade: () => null } as any;
const fakeOrigin = "http://localhost";

export default async function generateStaticExport() {
  const {
    ROOT_DIR,
    BUILD_DIR,
    I18N_CONFIG,
    IS_PRODUCTION,
    CONFIG,
    SCRIPT_404,
    IS_STATIC_EXPORT,
    LOG_PREFIX,
  } = getConstants();
  let fistLog = true;
  const serveOptions = await getServeOptions();
  const outDir = IS_STATIC_EXPORT
    ? path.join(ROOT_DIR, "out")
    : path.join(BUILD_DIR, "prerendered-pages");

  if (!serveOptions) return null;

  // Clean "out" folder if it exists
  if (IS_PRODUCTION && IS_STATIC_EXPORT && fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }

  const router = new Bun.FileSystemRouter({
    style: "nextjs",
    dir: path.join(BUILD_DIR, "pages"),
  });

  const routes = await formatRoutes(Object.keys(router.routes), router);
  const prerenderedRoutes = new Map<string, string[]>();

  await Promise.all(
    routes.map(async ([routeName, route]) => {
      // Prerender when "export default prerender = true"
      if (route && !IS_STATIC_EXPORT) {
        const module = await import(route.filePath);

        // Skip if there is no prerender function
        if (!module.prerender) return;
      }

      if (fistLog) {
        if (IS_STATIC_EXPORT) {
          console.log(LOG_PREFIX.INFO);
        } else {
          console.log(LOG_PREFIX.INFO);
          console.log(LOG_PREFIX.WAIT, "📄 Prerendering pages...");
          console.log(LOG_PREFIX.INFO);
        }
        fistLog = false;
      }

      // Prerender all pages in case of output=static
      const start = Bun.nanoseconds();
      const request = new Request(new URL(routeName, fakeOrigin));
      const response = await serveOptions.fetch.call(
        fakeServer,
        request,
        fakeServer,
      );

      const html = await response.text();
      const relativePath = (route?.filePath ?? "").replace(BUILD_DIR, "");
      let htmlPath: string;

      if (CONFIG.trailingSlash) {
        htmlPath = path.join(routeName, "index.html");
      } else if (routeName === path.sep) {
        htmlPath = path.join(path.sep, "index.html");
      } else {
        htmlPath = path.join(routeName.replace(/\/$/, "") + ".html");
      }

      if (html.includes(SCRIPT_404)) return;

      if (!prerenderedRoutes.has(relativePath)) {
        prerenderedRoutes.set(relativePath, []);
      }

      prerenderedRoutes.set(relativePath, [
        ...prerenderedRoutes.get(relativePath)!,
        htmlPath,
      ]);

      const timeMs = ((Bun.nanoseconds() - start) / 1e6).toFixed(2);

      console.log(
        LOG_PREFIX.INFO,
        LOG_PREFIX.TICK,
        `${htmlPath} prerendered in ${timeMs}ms`,
      );

      // Bun.write creates the folder if it doesn't exist
      return Bun.write(path.join(outDir, htmlPath), html);
    }),
  );

  if (
    IS_STATIC_EXPORT &&
    I18N_CONFIG?.locales?.length &&
    I18N_CONFIG?.defaultLocale &&
    prerenderedRoutes.size
  ) {
    if (!prerenderedRoutes.has(path.sep)) {
      prerenderedRoutes.set(path.sep, []);
    }

    prerenderedRoutes.set(path.sep, [
      ...prerenderedRoutes.get(path.sep)!,
      path.join(path.sep, "index.html"),
    ]);

    await createSoftRedirectToLocale({
      locales: I18N_CONFIG.locales,
      defaultLocale: I18N_CONFIG.defaultLocale,
      outDir,
    });
  }

  const publicPath = path.join(BUILD_DIR, "public");
  const clientPagesPath = path.join(BUILD_DIR, "pages-client");

  if (!IS_STATIC_EXPORT) return prerenderedRoutes;

  if (fs.existsSync(publicPath)) {
    fs.cpSync(publicPath, outDir, { recursive: true });
  }

  if (fs.existsSync(clientPagesPath)) {
    fs.cpSync(clientPagesPath, path.join(outDir, "_brisa", "pages"), {
      recursive: true,
    });
  }

  return prerenderedRoutes;
}

async function formatRoutes(routes: string[], router: FileSystemRouter) {
  const { I18N_CONFIG, CONFIG, IS_STATIC_EXPORT } = getConstants();
  const trailingSlash = CONFIG.trailingSlash;
  const locales = I18N_CONFIG?.locales?.length ? I18N_CONFIG.locales : [""];
  let newRoutes: [string, MatchedRoute | null][] = [];

  const addPathname = (
    pathname: string,
    locale: string,
    route: MatchedRoute | null,
  ) => {
    let newRoute = `${locale ? `/${locale}` : ""}${pathname}`;
    let endsWithTrailingSlash = newRoute.endsWith("/");

    // Add trailing slash
    if (!endsWithTrailingSlash && trailingSlash) {
      newRoute += "/";
    }
    // Remove trailing slash
    else if (endsWithTrailingSlash && !trailingSlash && newRoute.length > 1) {
      newRoute = newRoute.slice(0, -1);
    }

    newRoutes.push([newRoute, route]);
  };

  for (const pageName of routes) {
    for (const locale of locales) {
      let route = router.match(pageName);

      const pathname = locale
        ? I18N_CONFIG.pages?.[pageName]?.[locale] ?? pageName
        : pageName;

      if (route && route.kind !== "exact") {
        const module = await import(route.filePath);
        const prerenderFn = typeof module.prerender === "function";

        // Warning on missing prerender function in dynamic routes
        // during output=static
        if (IS_STATIC_EXPORT && !prerenderFn) {
          logMissingPrerender(pageName);
          continue;
        }
        // Skip if there is no prerender function
        if (!prerenderFn) continue;

        // Prerender dynamic routes
        const paramsOfAllStaticPages: { [key: string]: string }[] =
          await module.prerender();

        for (const params of paramsOfAllStaticPages) {
          let correctPathname = pathname;

          for (const [key, value] of Object.entries(params)) {
            const stringValue = Array.isArray(value)
              ? value.join(path.sep)
              : value;
            correctPathname = correctPathname
              .replace(`[[...${key}]]`, stringValue)
              .replace(`[...${key}]`, stringValue)
              .replace(`[${key}]`, stringValue);
          }
          addPathname(correctPathname, locale, route);
        }
        continue;
      }

      addPathname(pathname, locale, route);
    }
  }

  return newRoutes;
}

async function createSoftRedirectToLocale({
  locales,
  defaultLocale,
  outDir,
}: {
  locales: string[];
  defaultLocale: string;
  outDir: string;
}) {
  const htmlPath = path.join(outDir, "index.html");
  const html = toInline(`
    <!DOCTYPE html>
    <html lang="${defaultLocale}">
      <head>
        <meta http-equiv="refresh" content="0; url=/${defaultLocale}">
        <link rel="canonical" href="/${defaultLocale}">
        <script>
          const browserLanguage = (navigator.language || navigator.userLanguage).toLowerCase();
          const shortBrowserLanguage = browserLanguage.split("-")[0];
          const supportedLocales = ${JSON.stringify(
            locales.map((locale) => locale.toLowerCase()),
          )};

          if (supportedLocales.includes(shortBrowserLanguage)) {
            window.location.href = "/" + shortBrowserLanguage;
          } else if (supportedLocales.includes(browserLanguage)) {
            window.location.href = "/" + browserLanguage;
          } else {
            window.location.href = "/${defaultLocale}";
          }
        </script>
      </head>
      <body />
    </html>
  `);

  // display a message using i18n to explain that the redirect should be done in the hosting server:
  // To do it: Say what happened, provide reassurance, say why it happened, help them to fix it and give them a way out.
  logWarning([
    "Unable to generate a hard redirect to the user browser language.",
    "",
    'This is because you are using "i18n" in the static export.',
    "",
    "By default, a soft redirect will be generated and the user will be",
    "redirected using client-side JavaScript.",
    "",
    "To solve this, you can generate a hard redirect in your hosting server.",
    "",
    "To do it, you can follow the instructions in the docs:",
    "https://brisa.build/building-your-application/deploying/static-exports#hard-redirects",
  ]);

  await Bun.write(htmlPath, html);
}

function logMissingPrerender(routeName: string) {
  logWarning([
    `The dynamic route "${routeName}" does not have a "prerender" function.`,
    "",
    'To fix this, you need to add a "prerender" function to the route file.',
    "",
    "For more information, check the docs:",
    "https://brisa.build/building-your-application/configuring/static-pages",
  ]);
}
