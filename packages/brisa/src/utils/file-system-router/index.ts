// Inspired on Bun.FileSystemRouter, but runtime-agnostic.
export class FileSystemRouter {
  dir: string;
  fileExtensions: string[];

  constructor({
    dir,
    fileExtensions,
  }: {
    dir: string;
    fileExtensions: string[];
  }) {
    this.dir = dir;
    this.fileExtensions = fileExtensions;
  }
}
