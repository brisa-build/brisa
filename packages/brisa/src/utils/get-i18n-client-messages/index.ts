import translateCore from '@/utils/translate-core';
import { getConstants } from '@/constants';

type Messages = Record<string, any>;
type I18nKeys = Set<string | RegExp>;

/**
 * Get the messages that will be sent to the client.
 */
export default function getI18nClientMessages(locale: string, i18nKeys: I18nKeys) {
  const config = getConstants().I18N_CONFIG ?? {};
  const messages = config.messages?.[locale] ?? {};
  const values = new Set<string>();
  const t = translateCore(locale, config);
  const possibleKeys = increaseKeysWithPluralsAndRegexMatches(i18nKeys, messages);

  for (const i18nKey of possibleKeys) {
    const key = new String(i18nKey);

    // Mark the key to identify it later.
    (key as any).__isI18nKey = true;

    const translation = t(i18nKey, null, { returnObjects: true });

    // When the value is the key, this means that the key is not translated.
    if ((translation as any).__isI18nKey) continue;

    // Save all translated string values
    if (typeof translation === 'string') {
      values.add(translation);
      continue;
    }

    // Save all string values inside object/array (returnObjects: true)
    JSON.stringify(translation, (key, value) => {
      if (typeof value === 'string') values.add(value);
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
      typeof value === 'object' &&
      value.constructor === Object &&
      Object.keys(value).length === 0
    ) {
      return undefined;
    }

    return typeof value !== 'string' || values.has(value) ? value : undefined;
  });
}

function increaseKeysWithPluralsAndRegexMatches(
  i18nKeys: Set<string | RegExp>,
  messages: Messages,
) {
  const list = getListOfAllMessages(messages);
  const result = new Set<string>();
  const plurals = '(_zero|_one|_two|_few|_many|_other|_[0-9]+)?$';

  for (const i18nKey of i18nKeys) {
    const regex = i18nKey instanceof RegExp ? i18nKey : new RegExp(i18nKey + plurals);
    for (const messageKey of list) {
      if (regex.test(messageKey)) result.add(messageKey);
    }
  }

  return result;
}

function getListOfAllMessages(messages: Messages, prefix = '') {
  const config = getConstants().I18N_CONFIG ?? {};
  const separator = config.keySeparator ?? '.';
  let keys: string[] = [];

  for (const key in messages) {
    const currentKey = prefix ? `${prefix}${separator}${key}` : key;

    if (messages[key]?.constructor === Object) {
      keys = keys.concat(getListOfAllMessages(messages[key], currentKey));
      continue;
    }

    const parts = currentKey.split('.');

    while (parts.length) {
      keys.push(parts.join('.'));
      parts.pop();
    }
  }

  return keys;
}
