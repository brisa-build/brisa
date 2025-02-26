import path from 'node:path';
import fs from 'node:fs';
import { fileSystemRouter } from 'brisa/server';

/**
 * TODO: It's not working yet ... We are missing some configuration after that
 */
export default function getMonacoEditorExtraLibs() {
  const fileExtensions = ['.d.ts', '.json'];
  const root = path.resolve(path.join(process.cwd(), '..', '..'));
  const nodeModules = path.join(root, 'node_modules');
  const brisaDep = fileSystemRouter({
    dir: path.join(nodeModules, 'brisa'),
    fileExtensions,
  });
  const cssType = fileSystemRouter({
    dir: path.join(nodeModules, 'csstype'),
    fileExtensions,
  });
  let extraLibs = '';

  for (const [pathname] of brisaDep.routes) {
    if (pathname.includes('node_modules') || pathname.includes('src')) continue;
    const route = brisaDep.match(pathname);
    const filePath = route.filePath.replace(root, '');
    const fileRaw = fs.readFileSync(route.filePath, 'utf-8');
    extraLibs += `monaco.languages.typescript.typescriptDefaults.addExtraLib(${JSON.stringify(fileRaw)}, 'file://${filePath}');`;
  }

  for (const [pathname] of cssType.routes) {
    const route = cssType.match(pathname);
    const filePath = route.filePath.replace(root, '');
    const fileRaw = fs.readFileSync(route.filePath, 'utf-8');
    extraLibs += `monaco.languages.typescript.typescriptDefaults.addExtraLib(${JSON.stringify(fileRaw)}, 'file://${filePath}');`;
  }

  return extraLibs;
}
