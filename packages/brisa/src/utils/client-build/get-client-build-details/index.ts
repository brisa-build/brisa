import type { BuildArtifact } from 'bun';
import { sep } from 'node:path';
import type { EntryPointData, Options } from '../types';
import { getConstants } from '@/constants';
import { preEntrypointAnalysis } from '../pre-entrypoint-analysis';
import { writeTempEntrypoint } from '../fs-temp-entrypoint-manager';

export async function getClientBuildDetails(
  pages: BuildArtifact[],
  options: Options,
) {
  return (
    await Promise.all(
      pages.map((p) => getClientEntrypointBuildDetails(p, options)),
    )
  ).filter(Boolean) as EntryPointData[];
}

export async function getClientEntrypointBuildDetails(
  page: BuildArtifact,
  {
    allWebComponents,
    webComponentsPerEntrypoint,
    layoutWebComponents,
    integrationsPath,
    layoutHasContextProvider,
  }: Options,
): Promise<EntryPointData | undefined> {
  const { BUILD_DIR } = getConstants();
  const route = page.path.replace(BUILD_DIR, '');
  const pagePath = page.path;
  const isPage = route.startsWith(sep + 'pages' + sep);

  if (!isPage) return;

  const wcs = webComponentsPerEntrypoint[pagePath] ?? {};
  const pageWebComponents = layoutWebComponents
    ? { ...layoutWebComponents, ...wcs }
    : wcs;

  const analysis = await preEntrypointAnalysis(
    pagePath,
    allWebComponents,
    pageWebComponents,
    layoutHasContextProvider,
  );

  if (!Object.keys(analysis.webComponents).length) return analysis;

  const { entrypoint, useWebContextPlugins } = await writeTempEntrypoint({
    webComponentsList: analysis.webComponents,
    useContextProvider: analysis.useContextProvider,
    integrationsPath,
    pagePath,
  });

  return { ...analysis, entrypoint, useWebContextPlugins };
}
