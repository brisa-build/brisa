import path from "node:path";

export default function getImportableFilepath(filename: string, dir: string) {
  try {
    return import.meta.resolveSync(path.join(dir, filename));
  } catch (e) {
    return null;
  }
}
