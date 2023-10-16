import compileAssets from "../compile-assets";
import compileFiles from "../compile-files";

export default async function compileAll() {
  const { success, logs } = await compileFiles();

  if (!success) {
    logs.forEach((log) => console.error(log));
    return false;
  }

  await compileAssets();

  return true;
}
