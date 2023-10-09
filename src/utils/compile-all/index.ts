import fs from "node:fs";
import path from "node:path";
import compileAssets from "../compile-assets";
import compileFiles from "../compile-files";
import getRootDir from "../get-root-dir";

export default async function compileAll(
  outdir = path.join(getRootDir(), "build"),
) {
  if (fs.existsSync(outdir)) {
    fs.rmSync(outdir, { recursive: true });
  }

  const { success, logs } = await compileFiles(outdir);

  if (!success) {
    logs.forEach((log) => console.error(log));
    return false;
  }

  await compileAssets(outdir);

  return true;
}
