import type { BuildArtifact } from 'bun';
import { logBuildError } from '../log/log-build';
import { removeTempEntrypoints } from './fs-temp-entrypoint-manager';
import { getClientBuildDetails } from './get-client-build-details';
import type { EntryPointData, Options } from './types';
import { runBuild } from './run-build';
import { processI18n } from './process-i18n';

// TODO: Benchmarks old vs new
// TODO: Move to module (build-multi-entrypoints) + add tests
// TODO: Move getClientCodeInPage to module like build-single-entrypoint + add tests
// TODO: Move compileClientCodePage from compile-files to inside this client-build folder + tests
// TODO: move add-i18n-bridge to post-build
export default async function buildMultiClientEntrypoints(
  pages: BuildArtifact[],
  options: Options,
) {
  let clientBuildDetails = await getClientBuildDetails(pages, options);

  const entrypointsData = clientBuildDetails.reduce((acc, curr, index) => {
    if (curr.entrypoint) acc.push({ ...curr, index });
    return acc;
  }, [] as EntryPointData[]);

  const entrypoints = entrypointsData.map((p) => p.entrypoint!);

  if (entrypoints.length === 0) {
    return clientBuildDetails;
  }

  const { success, logs, outputs } = await runBuild(
    entrypoints,
    options.allWebComponents,
    entrypointsData[0].useContextProvider,
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
      const pathname = entrypoints[i];

      clientBuildDetails[index] = {
        ...clientBuildDetails[index],
        size: output.size,
        ...processI18n(await output.text(), pathname),
      };
    }),
  );

  return clientBuildDetails;
}
