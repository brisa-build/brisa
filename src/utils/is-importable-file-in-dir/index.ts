import fs from "node:fs/promises";
import path from "node:path";

const supportedFormats = ["tsx", "ts", "js"];

export default async function isImportableFileInDir(
  filename: string,
  dir: string,
) {
  const supportedPaths = [
    path.join(dir, filename, "index"),
    path.join(dir, filename),
  ];

  const promises = supportedPaths.flatMap((path) =>
    supportedFormats.map((format) => fs.exists(`${path}.${format}`)),
  );

  const results = await Promise.all(promises);

  return results.some((exist) => exist);
}
