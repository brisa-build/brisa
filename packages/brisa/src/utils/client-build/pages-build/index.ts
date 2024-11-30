import type { BuildArtifact } from 'bun';
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

  const entrypointsData = clientBuildDetails.reduce((acc, curr, index) => {
    if (curr.entrypoint) acc.push({ ...curr, index });
    return acc;
  }, [] as EntryPointData[]);

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

  await Promise.all(
    outputs.map(async (output, i) => {
      const index = entrypointsData[i].index!;

      clientBuildDetails[index] = {
        ...clientBuildDetails[index],
        ...processI18n(await output.text()),
      };
    }),
  );

  return clientBuildDetails;
}
