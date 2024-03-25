import { readdir } from "node:fs/promises";

export default async function getFilesFromDir(dir: string): Promise<string[]> {
  const dirents = await readdir(dir, { withFileTypes: true });
  const filePromises: Promise<string[]>[] = dirents.map(async (dirent) => {
    const res = [dir, dirent.name].join("/");

    if (dirent.isDirectory()) return await getFilesFromDir(res);
    else return [res];
  });

  const fileArrays: string[][] = await Promise.all(filePromises);
  const files: string[] = fileArrays.flat();

  return files;
}
