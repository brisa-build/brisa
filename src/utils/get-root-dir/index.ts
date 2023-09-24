import path from "node:path";

export default function getRootDir(
  env = process.env.NODE_ENV,
  dir = import.meta.dir,
) {
  const projectDir = dir.replace(
    /(\/|\\)node_modules(\/|\\)brisa(\/|\\).*/,
    "",
  );
  const folder = env === "production" ? "build" : "src";

  return path.join(projectDir, folder);
}
