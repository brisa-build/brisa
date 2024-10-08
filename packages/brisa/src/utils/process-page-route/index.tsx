import { getConstants } from '@/constants';
import dangerHTML from '@/utils/danger-html';
import { LiveReloadScript } from '@/cli/dev-live-reload';
import LoadLayout from '@/utils/load-layout';
import type { MatchedBrisaRoute, PageModule } from '@/types';
import getImportableFilepath, {
  pathToFileURLWhenNeeded,
} from '@/utils/get-importable-filepath';

export default async function processPageRoute(
  route: MatchedBrisaRoute,
  error?: Error,
) {
  const { BUILD_DIR } = getConstants();
  const module = (await import(
    pathToFileURLWhenNeeded(route.filePath)
  )) as PageModule;
  const layoutPath = getImportableFilepath('layout', BUILD_DIR);
  const layoutModule = layoutPath ? await import(layoutPath) : undefined;
  const PageComponent = module.default;

  const Page = () => (
    <>
      {dangerHTML('<!DOCTYPE html>')}
      <PageLayout layoutModule={layoutModule}>
        <PageComponent error={error} />
      </PageLayout>
    </>
  );

  return { Page, module, layoutModule } as const;
}

function PageLayout({
  children,
  layoutModule,
}: {
  children: JSX.Element;
  layoutModule?: { default: (props: { children: JSX.Element }) => JSX.Element };
}) {
  const { IS_PRODUCTION, PORT } = getConstants();

  const childrenWithLiveReload = IS_PRODUCTION ? (
    children
  ) : (
    <LiveReloadScript port={PORT}>{children}</LiveReloadScript>
  );

  return (
    <LoadLayout layoutModule={layoutModule}>
      {childrenWithLiveReload}
    </LoadLayout>
  );
}
