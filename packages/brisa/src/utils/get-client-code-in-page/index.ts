import { logBuildError } from '@/utils/log/log-build';
import { preEntrypointAnalysis } from '../client-build/pre-entrypoint-analysis';
import {
  removeTempEntrypoint,
  writeTempEntrypoint,
} from '../client-build/fs-temp-entrypoint-manager';
import { runBuild } from '../client-build/run-build';

type TransformOptions = {
  webComponentsList: Record<string, string>;
  useContextProvider: boolean;
  integrationsPath?: string | null;
  pagePath: string;
};

type ClientCodeInPageProps = {
  pagePath: string;
  allWebComponents?: Record<string, string>;
  pageWebComponents?: Record<string, string>;
  integrationsPath?: string | null;
  layoutHasContextProvider?: boolean;
};

export default async function getClientCodeInPage({
  pagePath,
  allWebComponents = {},
  pageWebComponents = {},
  integrationsPath,
  layoutHasContextProvider,
}: ClientCodeInPageProps) {
  const analysis = await preEntrypointAnalysis(
    pagePath,
    allWebComponents,
    pageWebComponents,
    layoutHasContextProvider,
  );

  if (!Object.keys(analysis.webComponents).length) {
    return analysis;
  }

  const transformedCode = await transformToWebComponents({
    webComponentsList: analysis.webComponents,
    useContextProvider: analysis.useContextProvider,
    integrationsPath,
    pagePath,
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
  pagePath,
}: TransformOptions) {
  // TODO: Resolve useWebContextPlugins inside build for multi and single entrypoint
  const { entrypoint, useWebContextPlugins } = await writeTempEntrypoint({
    webComponentsList,
    useContextProvider,
    integrationsPath,
    pagePath,
  });

  const { success, logs, outputs, analysis } = await runBuild(
    [entrypoint],
    webComponentsList,
  );

  await removeTempEntrypoint(entrypoint);

  if (!success) {
    logBuildError('Failed to compile web components', logs);
    return null;
  }

  return {
    code: await outputs[0].text(),
    size: outputs[0].size,
    useI18n: analysis[entrypoint]?.useI18n,
    i18nKeys: analysis[entrypoint]?.i18nKeys,
  };
}
