import { sep } from 'node:path';
import { getConstants } from '@/constants';
import type { BuildArtifact } from 'bun';
import AST from '../ast';
import analyzeServerAst from '../analyze-server-ast';
import { injectUnsuspenseCode } from '@/utils/inject-unsuspense-code' with {
  type: 'macro',
};
import {
  injectRPCCode,
  injectRPCCodeForStaticApp,
  injectRPCLazyCode,
} from '@/utils/rpc' with { type: 'macro' };

type WCs = Record<string, string>;
type WCsEntrypoints = Record<string, WCs>;

type Options = {
  webComponentsPerEntrypoint: WCsEntrypoints;
  layoutWebComponents: WCs;
  allWebComponents: WCs;
};

const ASTUtil = AST('tsx');
const unsuspenseScriptCode = injectUnsuspenseCode() as unknown as string;
const RPCLazyCode = injectRPCLazyCode() as unknown as string;

export default async function getClientBuildDetails(
  pages: BuildArtifact[],
  options: Options,
) {
  let clientBuildDetails = (
    await Promise.all(pages.map((p) => getClientPageDetails(p, options)))
  ).filter(Boolean);

  // TODO: Create temporal pages
  // TODO: Adapt plugin to analyze per entrypoint
  // TODO: Create build with all the temporal pages
  // TODO: Write the new outputs to the disk and cleanup the temporal pages
  // TODO: Overwrite clientBuildDetails with code, size
  // TODO: Test and refactor all this
  // TODO: Benchmarks old vs new

  return clientBuildDetails;
}

async function getClientPageDetails(
  page: BuildArtifact,
  {
    allWebComponents,
    webComponentsPerEntrypoint,
    layoutWebComponents,
  }: Options,
) {
  const { BUILD_DIR } = getConstants();
  const route = page.path.replace(BUILD_DIR, '');
  const pagePath = page.path;
  const isPage = route.startsWith(sep + 'pages' + sep);
  const clientPagePath = pagePath.replace('pages', 'pages-client');

  if (!isPage) return;

  const webComponents = webComponentsPerEntrypoint[pagePath];
  const pageWebComponents = layoutWebComponents
    ? { ...layoutWebComponents, ...webComponents }
    : webComponents;
  const ast = await getAstFromPath(pagePath);
  let size = 0;
  let { useSuspense, useContextProvider, useActions, useHyperlink } =
  // TODO: Remove layoutHasContextProvider as param and do it in a diferent way
    analyzeServerAst(ast, allWebComponents); 
  
  // Web components inside web components
  const nestedComponents = await Promise.all(
    Object.values(pageWebComponents).map(async (path) =>
      analyzeServerAst(await getAstFromPath(path), allWebComponents),
    ),
  );

  for (const item of nestedComponents) {
    useContextProvider ||= item.useContextProvider;
    useSuspense ||= item.useSuspense;
    useHyperlink ||= item.useHyperlink;
    Object.assign(pageWebComponents, item.webComponents);
  }

  const unsuspense = useSuspense ? unsuspenseScriptCode : '';
  const rpc = useActions || useHyperlink ? getRPCCode() : '';
  const lazyRPC = useActions || useHyperlink ? RPCLazyCode : '';

  size += unsuspense.length;
  size += rpc.length;

  const res = {
    unsuspense,
    rpc,
    useContextProvider,
    lazyRPC,
    size,
    useI18n: false,
    i18nKeys: new Set<string>(),
    code: '',
  };

  return Object.keys(pageWebComponents).length > 0
    ? { ...res, clientPagePath }
    : res;
}

async function getAstFromPath(path: string) {
  return ASTUtil.parseCodeToAST(
    path[0] === '{' ? '' : await Bun.file(path).text(),
  );
}

function getRPCCode() {
  const { IS_PRODUCTION, IS_STATIC_EXPORT } = getConstants();
  return (IS_STATIC_EXPORT && IS_PRODUCTION
    ? injectRPCCodeForStaticApp()
    : injectRPCCode()) as unknown as string;
}
