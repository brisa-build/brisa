import { getConstants } from '@/constants';

type DependenciesMap = Map<string, Set<string>>;

export default function getWebComponentsPerEntryPoints(
  webComponentsPerFile: Record<string, Record<string, string>>,
  dependenciesPerFile: DependenciesMap,
  entrypoints: string[],
) {
  const entryPointsSet = new Set(entrypoints);
  const webComponentsPerEntryPoint: Record<string, Record<string, string>> = {};
  const { SRC_DIR, BUILD_DIR } = getConstants();
  const getBuildPath = (path: string): string =>
    path.replace(SRC_DIR, BUILD_DIR).replace(/\.tsx?$/, '.js');

  for (const [file, webComponents] of Object.entries(webComponentsPerFile)) {
    const buildPath = getBuildPath(file);

    if (entryPointsSet.has(buildPath)) {
      webComponentsPerEntryPoint[buildPath] = webComponents;
      continue;
    }

    for (const [webComponentSelector, webComponentFilePath] of Object.entries(webComponents)) {
      const entryPoints = findEntryPoints(
        dependenciesPerFile,
        webComponentFilePath,
        entryPointsSet,
      );

      for (const entryPoint of entryPoints) {
        const buildEntryPoint = getBuildPath(entryPoint);
        if (!webComponentsPerEntryPoint[buildEntryPoint]) {
          webComponentsPerEntryPoint[buildEntryPoint] = {};
        }
        webComponentsPerEntryPoint[buildEntryPoint][webComponentSelector] = webComponentFilePath;
      }
    }
  }

  return webComponentsPerEntryPoint;
}

function findEntryPoints(dependencies: DependenciesMap, file: string, entryPoints: Set<string>) {
  const entryPointSet = new Set<string>();
  const visited = new Set<string>();
  const stack = [file.replace(/^import:/, '')];

  while (stack.length) {
    const currentFile = stack.pop();
    if (!currentFile || visited.has(currentFile)) continue;
    visited.add(currentFile);

    for (const [entryPoint, deps] of dependencies.entries()) {
      if (!deps.has(currentFile)) continue;
      if (entryPoints.has(entryPoint)) {
        entryPointSet.add(entryPoint);
      } else {
        stack.push(entryPoint);
      }
    }
  }

  return entryPointSet;
}
