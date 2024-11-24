import { writeFile, rm } from 'node:fs/promises';
import { generateEntryPointCode } from '../generate-entrypoint-code';
import { getTempPageName } from '../get-temp-page-name';

type TransformOptions = {
  webComponentsList: Record<string, string>;
  useContextProvider: boolean;
  integrationsPath?: string | null;
  pagePath: string;
};

export async function writeTempEntrypoint({
  webComponentsList,
  useContextProvider,
  integrationsPath,
  pagePath,
}: TransformOptions) {
  const webEntrypoint = getTempPageName(pagePath);
  const { code, useWebContextPlugins } = await generateEntryPointCode({
    webComponentsList,
    useContextProvider,
    integrationsPath,
  });

  await writeFile(webEntrypoint, code);

  return { entrypoint: webEntrypoint, useWebContextPlugins };
}

export async function removeTempEntrypoint(entrypoint: string) {
  return rm(entrypoint);
}

export async function removeTempEntrypoints(entrypoints: string[]) {
  return Promise.all(entrypoints.map(removeTempEntrypoint));
}
