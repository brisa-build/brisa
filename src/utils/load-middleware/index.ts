import path from "node:path";
import getRootDir from "../get-root-dir";
import isImportableFileInDir from "../is-importable-file-in-dir";

const projectDir = getRootDir();
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const srcDir = path.join(projectDir, "src");
const doesCustomMiddlewareExist = await isImportableFileInDir(
  "middleware",
  srcDir,
);

export default async function loadMiddleware() {
  const displayCustomMiddleware = IS_PRODUCTION
    ? doesCustomMiddlewareExist
    : await isImportableFileInDir("middleware", srcDir);

  if (!displayCustomMiddleware) return null;

  const middlewareModule = await import(path.join(srcDir, "middleware"));

  return middlewareModule.default;
}
