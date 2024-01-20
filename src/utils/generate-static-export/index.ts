import path from "node:path";
import fs from "node:fs";
import { getConstants } from "@/constants";
import { getServeOptions } from "./utils";
import { toInline } from "@/helpers";
import { logWarning } from "../log/log-build";

const fakeServer = { upgrade: () => null } as any;
const fakeOrigin = "http://localhost";

export default async function generateStaticExport() {
  const { ROOT_DIR, BUILD_DIR, I18N_CONFIG, CONFIG, SCRIPT_404 } =
    getConstants();
  const outDir = path.join(ROOT_DIR, "out");
  const serveOptions = await getServeOptions();

  if (!serveOptions) return null;

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  else fs.rmSync(outDir, { recursive: true, force: true });

  const router = new Bun.FileSystemRouter({
    style: "nextjs",
    dir: path.join(BUILD_DIR, "pages"),
  });

  const routes = formatRoutes(Object.entries(router.routes));

  await Promise.all(
    routes.map(async ([routeName]) => {
      const request = new Request(new URL(routeName, fakeOrigin));
      const response = await serveOptions.fetch.call(
        fakeServer,
        request,
        fakeServer,
      );

      const html = await response.text();
      let htmlPath: string;

      if (CONFIG.trailingSlash) {
        htmlPath = path.join(outDir, routeName, "index.html");
      } else if (routeName === "/") {
        htmlPath = path.join(outDir, "index.html");
      } else {
        htmlPath = path.join(outDir, routeName.replace(/\/$/, "") + ".html");
      }

      if (html.includes(SCRIPT_404)) return;

      return Bun.write(htmlPath, html);
    }),
  );

  if (I18N_CONFIG?.locales?.length && I18N_CONFIG?.defaultLocale) {
    await createSoftRedirectToLocale({
      locales: I18N_CONFIG.locales,
      defaultLocale: I18N_CONFIG.defaultLocale,
      outDir,
    });
  }

  fs.cpSync(path.join(BUILD_DIR, "public"), outDir, { recursive: true });
  fs.cpSync(
    path.join(BUILD_DIR, "pages-client"),
    path.join(outDir, "_brisa", "pages"),
    { recursive: true },
  );

  return true;
}

function formatRoutes(routes: [string, string][]) {
  const { I18N_CONFIG, CONFIG } = getConstants();
  const trailingSlash = CONFIG.trailingSlash;
  const locales = I18N_CONFIG?.locales?.length ? I18N_CONFIG.locales : [""];
  let newRoutes: [string, string][] = [];

  for (const [pageName, pagePath] of routes) {
    for (const locale of locales) {
      const pathname = locale
        ? I18N_CONFIG.pages?.[pageName]?.[locale] ?? pageName
        : pageName;

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

      newRoutes.push([newRoute, pagePath]);
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
    "https://brisa.build/docs/deploying/static-exports#hard-redirects",
  ]);

  await Bun.write(htmlPath, html);
}
