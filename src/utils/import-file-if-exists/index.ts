import getRootDir from "../get-root-dir";
import getImportableFilepath from "../get-importable-filepath";

const rootDir = getRootDir();

export default async function importFileIfExists(
  filename: "middleware" | "i18n",
) {
  const path = getImportableFilepath(filename, rootDir);

  if (!path) return null;

  const middlewareModule = await import(path);

  return middlewareModule.default;
}
