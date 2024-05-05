import fs from "node:fs";
import path from "node:path";
import compileAll from "@/utils/compile-all";
import { getConstants } from "@/constants";
import byteSizeToString from "@/utils/byte-size-to-string";
import { logTable, generateStaticExport } from "./build-utils";

export default async function build() {
  const {
    IS_PRODUCTION,
    I18N_CONFIG,
    LOG_PREFIX,
    BUILD_DIR,
    ROOT_DIR,
    IS_STATIC_EXPORT,
  } = getConstants();
  const prebuildPath = path.join(ROOT_DIR, "prebuild");

  console.log(
    LOG_PREFIX.WAIT,
    IS_PRODUCTION
      ? "🚀 building your Brisa app..."
      : "starting the development server...",
  );

  const start = Bun.nanoseconds();

  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true });
  }

  const { success, pagesSize } = await compileAll();

  if (!success) return process.exit(1);

  if (IS_PRODUCTION && IS_STATIC_EXPORT) console.log(LOG_PREFIX.INFO);
  console.log(LOG_PREFIX.INFO, LOG_PREFIX.TICK, `Compiled successfully!`);

  // Copy prebuild folder inside build
  // useful for FFI: https://brisa.build/building-your-application/configuring/zig-rust-c-files
  if (fs.existsSync(prebuildPath)) {
    const finalPrebuildPath = path.join(BUILD_DIR, "prebuild");
    fs.cpSync(prebuildPath, finalPrebuildPath, { recursive: true });
    console.log(
      LOG_PREFIX.INFO,
      LOG_PREFIX.TICK,
      `Copied prebuild folder inside build`,
    );
    if (IS_PRODUCTION && !IS_STATIC_EXPORT) console.log(LOG_PREFIX.INFO);
  }

  if (IS_PRODUCTION && IS_STATIC_EXPORT && pagesSize) {
    console.log(LOG_PREFIX.INFO);
    console.log(LOG_PREFIX.WAIT, "📄 Generating static pages...");
    const [generated] = (await generateStaticExport()) ?? [];

    if (!generated) return process.exit(1);

    const logs = [];

    for (const [pageName, size] of Object.entries(pagesSize)) {
      const route = pageName.replace(BUILD_DIR, "");
      const isPage = route.startsWith("/pages");
      const prerenderedRoutes = generated.get(route) ?? [];

      if (!isPage) continue;

      logs.push({
        Route: `○ ${route.replace(".js", "")}`,
        "JS client (gz)": byteSizeToString(size ?? 0, 0, true),
      });

      if (prerenderedRoutes.length > 1) {
        for (const prerenderRoute of prerenderedRoutes) {
          logs.push({
            Route: `| ○ ${prerenderRoute.replace(".html", "")}`,
            "JS client (gz)": byteSizeToString(size ?? 0, 0, true),
          });
        }
      }
    }

    console.log(LOG_PREFIX.INFO);
    logTable(logs);

    console.log(LOG_PREFIX.INFO);
    console.log(LOG_PREFIX.INFO, "○  (Static)  prerendered as static content");
    if (I18N_CONFIG?.locales?.length) {
      console.log(LOG_PREFIX.INFO, "Ω  (i18n) prerendered for each locale");
    }
    console.log(LOG_PREFIX.INFO);

    console.log(
      LOG_PREFIX.INFO,
      LOG_PREFIX.TICK,
      `Generated static pages successfully!`,
    );
    console.log(LOG_PREFIX.INFO);
  }

  const end = Bun.nanoseconds();
  const ms = ((end - start) / 1e6).toFixed(2);

  if (IS_PRODUCTION) console.log(LOG_PREFIX.INFO, `✨  Done in ${ms}ms.`);
  else console.log(LOG_PREFIX.INFO, `compiled successfully in ${ms}ms.`);
}

if (import.meta.main) {
  await build();
  process.exit(0);
}
