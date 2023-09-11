import fs from "node:fs";

export default function getEntrypoints(dir: string) {
  if (!fs.existsSync(dir)) return [];
  const router = new Bun.FileSystemRouter({ style: "nextjs", dir });
  return Object.values(router.routes);
}
