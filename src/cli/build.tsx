import path from "node:path";
import getRootDir from "../utils/get-root-dir";
import logTable from "../utils/log-table";

const projectDir = getRootDir();
const srcDir = path.join(projectDir, "src");
const pagesDir = path.join(srcDir, "pages");
const apiDir = path.join(srcDir, "api");
const outdir = path.join(projectDir, "build");

const pagesRouter = new Bun.FileSystemRouter({
  style: "nextjs",
  dir: pagesDir,
});
const apiRouter = new Bun.FileSystemRouter({ style: "nextjs", dir: apiDir });
const pagesEntrypoints = Object.values(pagesRouter.routes);
const apiEntrypoints = Object.values(apiRouter.routes);
const entrypoints = [...pagesEntrypoints, ...apiEntrypoints];
const { success, logs, outputs } = await Bun.build({
  entrypoints,
  outdir,
  minify: true,
  define: { NODE_ENV: "production" },
});

if (!success) {
  logs.forEach((log) => console.error(log));
  process.exit(1);
}

logTable(
  outputs.map((output) => ({
    Route: `λ ${output.path.replace(outdir, "")}`,
    Size: `${output.size} B`,
  })),
);

console.log("\nλ  (Server)  server-side renders at runtime\n");
console.info(`✨  Done in ${(Bun.nanoseconds() / 1000000).toFixed(2)}ms.`);
