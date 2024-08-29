import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import fs from 'node:fs';

/**
 * Synchronously resolves the path of an import, considering the "exports" field
 * in package.json if present, and handles monorepos with symlinks.
 */
export default function resolveSync(id: string, parent?: string) {
  const parentPath = parent
    ? path.resolve(
        parent.startsWith('file://') ? fileURLToPath(parent) : parent,
      )
    : path.resolve(process.cwd(), 'src');

  try {
    const req = createRequire(parentPath);

    return req.resolve(id);
  } catch (err) {
    // If initial resolve fails, attempt to resolve using package "exports" field
    const packageJsonPath = findPackageJson(id, parentPath);
    if (packageJsonPath) {
      const resolvedPath = resolveUsingExports(id, packageJsonPath);
      if (resolvedPath) {
        return resolvedPath;
      }
    }

    throw new Error(`Cannot resolve module '${id}' from '${parentPath}'`);
  }
}

/**
 * Finds the package.json path for the given module id, accounting for symlinks and scoped packages.
 */
function findPackageJson(id: string, startDir: string): string | null {
  let currentDir = startDir;
  const idParts = id.startsWith('@')
    ? id.split('/').slice(0, 2).join('/')
    : id.split('/')[0];

  while (currentDir !== path.parse(currentDir).root) {
    const moduleDir = path.join(currentDir, 'node_modules', idParts);

    // Resolve the real path if it's a symlink
    const realModuleDir = fs.existsSync(moduleDir)
      ? fs.realpathSync(moduleDir)
      : null;

    if (realModuleDir) {
      const packageJsonPath = path.join(realModuleDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        return packageJsonPath;
      }
    }

    currentDir = path.dirname(currentDir);
  }

  return null;
}

/**
 * Resolves the module using the "exports" field in package.json.
 */
function resolveUsingExports(
  id: string,
  packageJsonPath: string,
): string | null {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const exportsField = packageJson.exports;

  if (!exportsField) {
    return null;
  }

  const subpath = id.startsWith('@')
    ? id.split('/').slice(2).join('/')
    : id.split('/').slice(1).join('/');

  const resolvedPath = exportsField[subpath] || exportsField[`./${subpath}`];

  if (resolvedPath) {
    return path.join(
      path.dirname(packageJsonPath),
      typeof resolvedPath === 'object' ? resolvedPath.import : resolvedPath,
    );
  }

  return null;
}
