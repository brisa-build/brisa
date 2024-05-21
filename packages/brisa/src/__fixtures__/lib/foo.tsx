import type { WebContext } from "@/types";

export default function Foo({}, { i18n }: WebContext) {
  return <div>Foo {i18n.t("hello-world")}</div>;
}
