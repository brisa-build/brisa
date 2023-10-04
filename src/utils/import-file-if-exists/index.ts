import getRootDir from "../get-root-dir";
import getImportableFilepath from "../get-importable-filepath";

const rootDir = getRootDir();

export default async function importFileIfExists(
  filename: "middleware" | "i18n" | "brisa.config",
  dir = rootDir,
) {
  const path = getImportableFilepath(filename, dir);

  if (!path) return null;

  return await import(path);
}
