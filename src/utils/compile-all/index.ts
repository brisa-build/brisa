import compileAssets from "@/utils/compile-assets";
import compileFiles from "@/utils/compile-files";

export default async function compileAll() {
  const { success, logs } = await compileFiles();

  await compileAssets();

  if (!success) {
    logs.forEach((log) => console.error(log));
  }

  return success;
}
