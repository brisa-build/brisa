import path from "node:path";
import getRootDir from "@/utils/get-root-dir";
import getImportableFilepath from "@/utils/get-importable-filepath";

export default async function importFileIfExists(
  filename: "middleware" | "i18n" | "brisa.config" | "_integrations",
  dir = path.join(getRootDir(), "build"),
) {
  const path = getImportableFilepath(filename, dir);

  if (!path) return null;

  return await import(path);
}
