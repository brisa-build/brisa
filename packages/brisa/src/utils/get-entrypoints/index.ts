import fs from "node:fs";

const DENIED_SUFFIXES_REGEX = /\.test\.(tsx|ts|js|jsx|cjs|mjs)$/;

export default function getEntrypoints(dir: string) {
  if (!fs.existsSync(dir)) return [];
  const router = new Bun.FileSystemRouter({ style: "nextjs", dir });
  return Object.values(router.routes).filter(
    (route) => !route.match(DENIED_SUFFIXES_REGEX),
  );
}
