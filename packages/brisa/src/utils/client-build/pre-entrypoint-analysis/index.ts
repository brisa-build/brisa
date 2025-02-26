import { getConstants } from '@/constants';
import analyzeServerAst from '@/utils/analyze-server-ast';
import AST from '@/utils/ast';
import { injectUnsuspenseCode } from '@/utils/inject-unsuspense-code' with {
  type: 'macro',
};
import {
  injectRPCCode,
  injectRPCCodeForStaticApp,
  injectRPCLazyCode,
} from '@/utils/rpc' with { type: 'macro' };

type WCs = Record<string, string>;

const ASTUtil = AST('tsx');

export const unsuspenseScriptCode = injectUnsuspenseCode() as unknown as string;
export const rpcCode = injectRPCCode() as unknown as string;
export const RPCLazyCode = injectRPCLazyCode() as unknown as string;
export const rpcStatic = injectRPCCodeForStaticApp() as unknown as string;

/**
 * Performs a comprehensive analysis of a given file path and its associated web components.
 *
 * This function parses the provided file's Abstract Syntax Tree (AST) to extract metadata
 * about the usage of key features such as suspense, context providers, actions, and hyperlinks.
 * It also recursively analyzes nested web components to aggregate their dependencies and behavior.
 *
 * @param path - The file path to analyze.
 * @param allWebComponents - A record of all available web components, used for analysis.
 * @param webComponents - A record of web components specific to the given path.
 * @param layoutHasContextProvider - Indicates if the layout has a context provider.
 * @returns An object containing:
 *   - `useSuspense`: Indicates if suspense is used.
 *   - `useContextProvider`: Indicates if a context provider is used.
 *   - `useActions`: Indicates if actions are used.
 *   - `useHyperlink`: Indicates if hyperlinks are used.
 *   - `webComponents`: An aggregated list of web components and their dependencies.
 */
export async function preEntrypointAnalysis(
  path: string,
  allWebComponents: WCs,
  webComponents: WCs = {},
  layoutHasContextProvider?: boolean,
) {
  const mainAnalysisPromise = getAstFromPath(path).then((ast) =>
    analyzeServerAst(ast, allWebComponents, layoutHasContextProvider),
  );

  const nestedAnalysisPromises = Object.entries(webComponents).map(
    async ([, componentPath]) =>
      analyzeServerAst(await getAstFromPath(componentPath), allWebComponents),
  );

  // Wait for all analyses to complete
  const [mainAnalysis, nestedResults] = await Promise.all([
    mainAnalysisPromise,
    Promise.all(nestedAnalysisPromises),
  ]);

  let { useSuspense, useContextProvider, useActions, useHyperlink } =
    mainAnalysis;

  // Aggregate results
  const aggregatedWebComponents = { ...webComponents };
  for (const analysis of nestedResults) {
    useContextProvider ||= analysis.useContextProvider;
    useSuspense ||= analysis.useSuspense;
    useHyperlink ||= analysis.useHyperlink;
    Object.assign(aggregatedWebComponents, analysis.webComponents);
  }

  let size = 0;
  const unsuspense = useSuspense ? unsuspenseScriptCode : '';
  const rpc = useActions || useHyperlink ? getRPCCode() : '';
  const lazyRPC = useActions || useHyperlink ? RPCLazyCode : '';

  size += unsuspense.length;
  size += rpc.length;

  return {
    unsuspense,
    rpc,
    useContextProvider,
    lazyRPC,
    pagePath: path,
    webComponents: aggregatedWebComponents,

    // Fields that need an extra analysis during/after build:
    code: '',
    size,
    useI18n: false,
    i18nKeys: new Set<string>(),
  };
}

async function getAstFromPath(path: string) {
  return ASTUtil.parseCodeToAST(
    path[0] === '{' ? '' : await Bun.file(path).text(),
  );
}

function getRPCCode() {
  const { IS_PRODUCTION, IS_STATIC_EXPORT } = getConstants();
  return (IS_STATIC_EXPORT && IS_PRODUCTION
    ? rpcStatic
    : rpcCode) as unknown as string;
}
