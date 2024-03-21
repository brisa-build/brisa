import type { WebContext } from "@/types";

export default function LayoutWebComponent({}, { i18n }: WebContext) {
  return <h1>{i18n.t("client-key")}</h1>;
}
