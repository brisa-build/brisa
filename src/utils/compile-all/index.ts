import compileAssets from "@/utils/compile-assets";
import compileFiles from "@/utils/compile-files";

export default async function compileAll() {
  await compileAssets();

  const { success, logs } = await compileFiles();

  if (!success) {
    logs.forEach((log) => console.error(log));
  }

  return success;
}
