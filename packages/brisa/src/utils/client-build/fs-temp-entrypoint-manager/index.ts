import { writeFile, rm, mkdir, exists } from 'node:fs/promises';
import { dirname } from 'node:path'
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

  const dir = dirname(webEntrypoint);

  if(!(await exists(dir))) {
    await mkdir(dir, { recursive: true })
  }

  await writeFile(webEntrypoint, code);

  return { entrypoint: webEntrypoint, useWebContextPlugins };
}

export async function removeTempEntrypoint(entrypoint: string) {
  return rm(entrypoint);
}

export async function removeTempEntrypoints(entrypoints: string[]) {
  return Promise.all(entrypoints.map(removeTempEntrypoint));
}
