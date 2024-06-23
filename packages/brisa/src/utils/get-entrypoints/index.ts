import isTestFile from "@/utils/is-test-file";
import fs from "node:fs";

const fileExtensions = [".tsx", ".ts", ".js", ".jsx", ".cjs", ".mjs", ".mdx"];

export default function getEntrypoints(dir: string) {
  if (!fs.existsSync(dir)) return [];
  const router = getEntrypointsRouter(dir);
  return Object.values(router.routes).filter(
    (route) => !isTestFile(route, true),
  );
}

export function getEntrypointsRouter(dir: string) {
  return new Bun.FileSystemRouter({ style: "nextjs", dir, fileExtensions });
}
