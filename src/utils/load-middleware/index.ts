import getRootDir from "../get-root-dir";
import getImportableFilepath from "../get-importable-filepath";

const rootDir = getRootDir();

export default async function loadMiddleware() {
  const middlewarePath = getImportableFilepath(rootDir, 'middleware')

  if (!middlewarePath) return null;

  const middlewareModule = await import(middlewarePath);

  return middlewareModule.default;
}
