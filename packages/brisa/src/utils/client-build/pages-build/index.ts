import type { BuildArtifact } from 'bun';
import { parse } from 'node:path';
import { log, logBuildError } from '../../log/log-build';
import { removeTempEntrypoints } from '../fs-temp-entrypoint-manager';
import { getClientBuildDetails } from '../get-client-build-details';
import type { EntryPointData, Options } from '../types';
import { runBuild } from '../run-build';
import { processI18n } from '../process-i18n';
import { getConstants } from '@/constants';

export default async function clientPageBuild(
  pages: BuildArtifact[],
  options: Options,
): Promise<EntryPointData[]> {
  const { LOG_PREFIX } = getConstants();

  log(LOG_PREFIX.WAIT, 'analyzing and preparing client build...');

  let clientBuildDetails = await getClientBuildDetails(pages, options);

  const entrypointsData = clientBuildDetails.filter((p) => p.entrypoint);
  const entrypoints = entrypointsData.map((p) => p.entrypoint!);

  if (entrypoints.length === 0) {
    return clientBuildDetails;
  }

  log(
    LOG_PREFIX.WAIT,
    `compiling ${entrypointsData.length} client entrypoints...`,
  );
  const { success, logs, outputs } = await runBuild(
    entrypoints,
    options.allWebComponents,
    entrypointsData[0].useWebContextPlugins,
  );

  // Remove all temp files
  await removeTempEntrypoints(entrypoints);

  if (!success) {
    logBuildError('Failed to compile web components', logs);
    return clientBuildDetails;
  }

  const outputsPerFilename = outputs.reduce(
    (acc, artifact) => {
      acc[parse(artifact.path).name] = artifact;
      return acc;
    },
    {} as Record<string, BuildArtifact>,
  );

  await Promise.all(
    clientBuildDetails.map(async (details) => {
      if (!details.entrypoint) return;

      const filename = parse(details.entrypoint).name;
      const code = await outputsPerFilename[filename].text();

      // Mutate the details object to include the compiled code + i18n details
      Object.assign(details, processI18n(code));
    }),
  );

  return clientBuildDetails;
}
