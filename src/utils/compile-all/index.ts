import fs from "node:fs";
import compileAssets from "../compile-assets";
import compileFiles from "../compile-files";
import getConstants from "../../constants";

export default async function compileAll() {
  const { BUILD_DIR } = getConstants();
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true });
  }

  const { success, logs } = await compileFiles();

  if (!success) {
    logs.forEach((log) => console.error(log));
    return false;
  }

  await compileAssets();

  return true;
}
