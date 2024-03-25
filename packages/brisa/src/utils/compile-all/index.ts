import compileAssets from "../compile-assets";
import compileFiles from "../compile-files";

export default async function compileAll() {
  await compileAssets();

  const { success, logs, pagesSize } = await compileFiles();

  if (!success) {
    logs.forEach((log) => console.error(log));
  }

  return { success, logs, pagesSize };
}
