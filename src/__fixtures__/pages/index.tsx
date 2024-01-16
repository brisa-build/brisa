import type { RequestContext } from "@/types";

export default async function Home({}, { i18n }: RequestContext) {
  return <div>{i18n.t("hello-world")}</div>;
}

Home.suspense = () => {
  return <div>Loading...</div>;
};
