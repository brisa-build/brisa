import type { MatchedRoute } from "bun";

import { getConstants } from "../../constants";
import dangerHTML from "../danger-html";
import { LiveReloadScript } from "../../cli/dev-live-reload";
import LoadLayout from "../load-layout";
import type { PageModule } from "../../types";
import getImportableFilepath from "../get-importable-filepath";

export default async function processPageRoute(
  route: MatchedRoute,
  error?: Error,
) {
  const { BUILD_DIR } = getConstants();
  const module = (await import(route.filePath)) as PageModule;
  const layoutPath = getImportableFilepath("layout", BUILD_DIR);
  const layoutModule = layoutPath ? await import(layoutPath) : undefined;
  const PageComponent = module.default;

  const pageElement = (
    <>
      {dangerHTML("<!DOCTYPE html>")}
      <PageLayout layoutModule={layoutModule}>
        <PageComponent error={error} />
      </PageLayout>
    </>
  );

  return { pageElement, module, layoutModule } as const;
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
