import type { RequestContext } from "@/types";

export const CRYPTO_KEY = __CRYPTO_KEY__;
export const CRYPTO_IV = __CRYPTO_IV__;

export default async function Home({}, { i18n }: RequestContext) {
  return (
    <div onClick={() => console.log(__CRYPTO_KEY__, __CRYPTO_IV__)} data-action>
      {i18n.t("hello-world")}
    </div>
  );
}

Home.suspense = () => {
  return (
    <div onClick={() => console.log("Hello from suspense")}>Loading...</div>
  );
};
