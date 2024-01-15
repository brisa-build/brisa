import fs from "node:fs";
import path from "node:path";
import compileAll from "@/utils/compile-all";
import constants from "@/constants";

const { IS_PRODUCTION, LOG_PREFIX, BUILD_DIR, ROOT_DIR } = constants;
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
const end = Bun.nanoseconds();
const ms = ((end - start) / 1e6).toFixed(2);

if (!success) process.exit(1);

// Copy prebuild folder inside build
// useful for FFI: https://brisa.build/docs/building-your-application/configuring/zig-rust-c-files
if (fs.existsSync(prebuildPath)) {
  const finalPrebuildPath = path.join(BUILD_DIR, "prebuild");
  fs.cpSync(prebuildPath, finalPrebuildPath, { recursive: true });
}

if (IS_PRODUCTION) console.info(LOG_PREFIX.INFO, `✨  Done in ${ms}ms.`);
else console.info(LOG_PREFIX.INFO, `compiled successfully in ${ms}ms.`);
