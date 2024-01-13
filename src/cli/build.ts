import fs from "node:fs";
import path from "node:path";
import compileAll from "@/utils/compile-all";
import getConstants from "@/constants";

const { IS_PRODUCTION, LOG_PREFIX, BUILD_DIR, ROOT_DIR } = getConstants();

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

// Move all lib* root files to build dir
// useful for FFI: https://brisa.build/docs/building-your-application/configuring/zig-rust-c-files
const rootFiles = fs.readdirSync(ROOT_DIR, { withFileTypes: true });

for (const file of rootFiles) {
  if (!file.name.startsWith("lib") || !file.isFile()) continue;
  fs.renameSync(
    path.join(ROOT_DIR, file.name),
    path.join(BUILD_DIR, file.name),
  );
}

if (IS_PRODUCTION) console.info(LOG_PREFIX.INFO, `✨  Done in ${ms}ms.`);
else console.info(LOG_PREFIX.INFO, `compiled successfully in ${ms}ms.`);
