import translateCore from "@/utils/translate-core";
import { getConstants } from "@/constants";

/**
 * Get the messages that will be sent to the client.
 */
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

    // Mark the key to identify it later.
    (key as any).__isI18nKey = true;

    const translation = t(i18nKey, null, { returnObjects: true });

    // When the value is the key, this means that the key is not translated.
    if ((translation as any).__isI18nKey) continue;

    // Save all translated string values
    if (typeof translation === "string") {
      values.add(translation);
      continue;
    }

    // Save all string values inside object/array (returnObjects: true)
    JSON.stringify(translation, (key, value) => {
      if (typeof value === "string") values.add(value);
      return value;
    });
  }

  // Traverse the messages and remove all unused values.
  return JSON.parse(JSON.stringify(messages), (key, value) => {
    // Remove empty arrays
    if (Array.isArray(value) && !value.filter((v) => v).length) {
      return undefined;
    }

    // Remove empty objects
    if (
      typeof value === "object" &&
      value.constructor === Object &&
      Object.keys(value).length === 0
    ) {
      return undefined;
    }

    return typeof value !== "string" || values.has(value) ? value : undefined;
  });
}
