import path from "node:path";
import getRootDir from "../get-root-dir";
import getImportableFilepath from "../get-importable-filepath";

export default async function importFileIfExists(
  filename: "middleware" | "i18n" | "brisa.config",
  dir = path.join(getRootDir(), "build")
) {
  const path = getImportableFilepath(filename, dir);

  if (!path) return null;

  return await import(path);
}
