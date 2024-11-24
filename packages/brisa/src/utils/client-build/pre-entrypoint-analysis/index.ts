import analyzeServerAst from '@/utils/analyze-server-ast';
import AST from '@/utils/ast';

type WCs = Record<string, string>;

const ASTUtil = AST('tsx');

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

  return {
    useSuspense,
    useContextProvider,
    useActions,
    useHyperlink,
    webComponents: aggregatedWebComponents,
  };
}

async function getAstFromPath(path: string) {
  return ASTUtil.parseCodeToAST(
    path[0] === '{' ? '' : await Bun.file(path).text(),
  );
}
