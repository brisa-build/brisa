import path from "node:path";
import getImportableFilepath from "../get-importable-filepath";

export default async function importFileIfExists(
  filename: "middleware" | "i18n" | "brisa.config" | "_integrations",
  dir = path.join(process.cwd(), "build"),
) {
  const path = getImportableFilepath(filename, dir);

  if (!path) return null;

  return await import(path);
}
