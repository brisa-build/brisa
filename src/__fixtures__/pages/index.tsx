import type { RequestContext } from "@/types";

export default async function Home({}, { i18n }: RequestContext) {
  return (
    <div onClick={() => console.log("Hello world")}>
      {i18n.t("hello-world")}
    </div>
  );
}

Home.suspense = () => {
  return (
    <div onClick={() => console.log("Hello from suspense")}>Loading...</div>
  );
};
