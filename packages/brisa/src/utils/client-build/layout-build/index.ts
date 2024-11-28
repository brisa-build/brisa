import { log, logBuildError } from '@/utils/log/log-build';
import { preEntrypointAnalysis } from '../pre-entrypoint-analysis';
import {
  removeTempEntrypoint,
  writeTempEntrypoint,
} from '../fs-temp-entrypoint-manager';
import { runBuild } from '../run-build';
import { processI18n } from '../process-i18n';
import { getConstants } from '@/constants';

type TransformOptions = {
  webComponentsList: Record<string, string>;
  useContextProvider: boolean;
  integrationsPath?: string | null;
  layoutPath: string;
};

type ClientCodeInPageProps = {
  layoutPath: string;
  allWebComponents?: Record<string, string>;
  pageWebComponents?: Record<string, string>;
  integrationsPath?: string | null;
  layoutHasContextProvider?: boolean;
};

export default async function layoutBuild({
  layoutPath,
  allWebComponents = {},
  pageWebComponents = {},
  integrationsPath,
  layoutHasContextProvider,
}: ClientCodeInPageProps) {
  const { LOG_PREFIX } = getConstants();
  const analysis = await preEntrypointAnalysis(
    layoutPath,
    allWebComponents,
    pageWebComponents,
    layoutHasContextProvider,
  );

  if (!Object.keys(analysis.webComponents).length) {
    return analysis;
  }

  log(LOG_PREFIX.WAIT, `compiling layout...`);

  const transformedCode = await transformToWebComponents({
    webComponentsList: analysis.webComponents,
    useContextProvider: analysis.useContextProvider,
    integrationsPath,
    layoutPath,
  });

  if (!transformedCode) return null;

  return {
    code: analysis.code + transformedCode?.code,
    unsuspense: analysis.unsuspense,
    rpc: analysis.rpc,
    useContextProvider: analysis.useContextProvider,
    lazyRPC: analysis.lazyRPC,
    size: analysis.size + (transformedCode?.size ?? 0),
    useI18n: transformedCode.useI18n,
    i18nKeys: transformedCode.i18nKeys,
  };
}

export async function transformToWebComponents({
  webComponentsList,
  useContextProvider,
  integrationsPath,
  layoutPath,
}: TransformOptions) {
  const { entrypoint, useWebContextPlugins } = await writeTempEntrypoint({
    webComponentsList,
    useContextProvider,
    integrationsPath,
    pagePath: layoutPath,
  });

  const { success, logs, outputs } = await runBuild(
    [entrypoint],
    webComponentsList,
    useWebContextPlugins,
  );

  await removeTempEntrypoint(entrypoint);

  if (!success) {
    logBuildError('Failed to compile web components', logs);
    return null;
  }

  return processI18n(await outputs[0].text());
}
