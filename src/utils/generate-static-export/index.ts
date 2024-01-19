import path from "node:path";
import fs from "node:fs";
import { getConstants } from "@/constants";

export default function generateStaticExport() {
  const { ROOT_DIR, BUILD_DIR } = getConstants();
  const outDir = path.join(ROOT_DIR, "out");

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  return true;
}
