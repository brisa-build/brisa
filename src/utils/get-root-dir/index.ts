import path from "node:path";

export default function getRootDir(env = process.env.NODE_ENV, dir = import.meta.dir) {
  const projectDir = dir.replace(/(\/|\\)node_modules(\/|\\)bunrise(\/|\\).*/, "");
  const folder = env === 'production' ? 'build' : 'src';

  return path.join(projectDir, folder);
}
