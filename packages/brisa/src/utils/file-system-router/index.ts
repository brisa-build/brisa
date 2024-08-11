import path from 'node:path';
import fs from 'node:fs';

const finalSlashIndex = new RegExp(`${path.sep}index$`);

// Inspired on Bun.FileSystemRouter, but runtime-agnostic.
export class FileSystemRouter {
  dir: string;
  fileExtensions: string[];
  routes: Record<string, string> = {};

  constructor({
    dir,
    fileExtensions,
  }: {
    dir: string;
    fileExtensions: string[];
  }) {
    this.dir = dir;
    this.fileExtensions = fileExtensions;
    this.routes = this.getRoutes();
  }

  private getRoutes() {
    const routes: Record<string, string> = {};
    const files = fs.readdirSync(this.dir, {
      withFileTypes: true,
      recursive: true,
    });

    for (const file of files) {
      if (file.isDirectory()) continue;
      const ext = path.extname(file.name);
      if (!this.fileExtensions.includes(ext)) continue;

      const filePath = path.resolve(file.parentPath, file.name);
      let route = filePath
        .replace(ext, '')
        .replace(this.dir, '')
        .replace(finalSlashIndex, '');

      if (route === '') route = '/';

      routes[route] = filePath;
    }

    return routes;
  }
}
