export default function getRootDir(dir = import.meta.dir) {
  return dir.replace(/(\/|\\)node_modules(\/|\\)bunrise(\/|\\).*/, "");
}
