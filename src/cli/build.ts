import fs from "node:fs";
import path from "node:path";
import compileAll from "@/utils/compile-all";
import constants from "@/constants";
import generateStaticExport from "@/utils/generate-static-export";

const { IS_PRODUCTION, LOG_PREFIX, BUILD_DIR, ROOT_DIR, IS_STATIC_EXPORT } =
  constants;
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

const success = await compileAll();

if (!success) process.exit(1);

if (IS_PRODUCTION && IS_STATIC_EXPORT) console.log(LOG_PREFIX.INFO);
console.log(LOG_PREFIX.INFO, LOG_PREFIX.TICK, `Compiled successfully!`);

// Copy prebuild folder inside build
// useful for FFI: https://brisa.build/docs/building-your-application/configuring/zig-rust-c-files
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

if (IS_PRODUCTION && IS_STATIC_EXPORT) {
  console.log(LOG_PREFIX.INFO);
  console.log(LOG_PREFIX.WAIT, "📄 Generating static pages...");
  console.log(LOG_PREFIX.INFO);
  const success = await generateStaticExport();

  if (!success) process.exit(1);

  console.log(
    LOG_PREFIX.INFO,
    LOG_PREFIX.TICK,
    `Generated static pages successfully!`,
  );
  console.log(LOG_PREFIX.INFO);
}

const end = Bun.nanoseconds();
const ms = ((end - start) / 1e6).toFixed(2);

if (IS_PRODUCTION) console.info(LOG_PREFIX.INFO, `✨  Done in ${ms}ms.`);
else console.info(LOG_PREFIX.INFO, `compiled successfully in ${ms}ms.`);
