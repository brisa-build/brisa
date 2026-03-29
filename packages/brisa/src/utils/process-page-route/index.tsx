import { getConstants } from '@/constants';
import dangerHTML from '@/utils/danger-html';
import { LiveReloadScript } from '@/cli/dev-live-reload';
import LoadLayout from '@/utils/load-layout';
import type { MatchedBrisaRoute } from '@/types';

const Empty = () => null;

export default async function processPageRoute(
  route: MatchedBrisaRoute,
  error?: Error,
) {
  const { MODULES } = getConstants();
  const { pages, layoutModule } = MODULES ?? {};
  // TODO: Remove async-await after finish #628
  const module = await pages[route.name];
  const PageComponent = module?.default ?? Empty;
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
