import getConstants from "../../constants";
import dangerHTML from "../danger-html";
import { LiveReloadScript } from "../../cli/dev-live-reload";
import LoadLayout from "../load-layout";
import { PageModule } from "../../types";

type PageOptions = {
  error?: Error;
  layoutModule?: { default: (props: { children: JSX.Element }) => JSX.Element };
};

export default async function getElementFromModule(
  module: PageModule,
  { error, layoutModule }: PageOptions,
) {
  const PageComponent = module.default;

  return (
    <>
      {dangerHTML("<!DOCTYPE html>")}
      <PageLayout layoutModule={layoutModule}>
        <PageComponent error={error} />
      </PageLayout>
    </>
  );
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
