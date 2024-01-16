import translateCore from "@/utils/translate-core";
import { getConstants } from "@/constants";

export default function getI18nClientMessages(
  locale: string,
  i18nKeys: Set<string>,
) {
  const config = getConstants().I18N_CONFIG ?? {};
  const messages = config.messages?.[locale] ?? {};
  const values = new Set<string>();
  const t = translateCore(locale, config);

  for (let i18nKey of i18nKeys) {
    const key = new String(i18nKey);

    (key as any).__isI18nKey = true;

    const value = t(i18nKey, null, { returnObjects: true });

    if (!(value as any).__isI18nKey) {
      if (typeof value === "string") values.add(value);
      else {
        JSON.stringify(value, (key, value) => {
          if (typeof value === "string") values.add(value);
          return value;
        });
      }
    }
  }

  return JSON.parse(JSON.stringify(messages), (key, value) => {
    if (Array.isArray(value) && value.filter((v) => v).length === 0) {
      return undefined;
    }

    if (
      typeof value === "object" &&
      value.constructor === Object &&
      Object.keys(value).length === 0
    ) {
      return undefined;
    }

    if (typeof value !== "string" || values.has(value)) return value;

    return undefined;
  });
}
