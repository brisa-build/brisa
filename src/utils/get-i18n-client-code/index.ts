import constants from "@/constants";

const i18nKeysLogic = `
  get t() {
    return translateCore(this.locale, { ...i18nConfig, messages: this.messages })
  },
  get messages() { return {[this.locale]: window.i18nMessages } }
`;

export default function getI18nClientCode(usei18nKeysLogic: boolean) {
  const i18nConfig = JSON.stringify({
    ...constants.I18N_CONFIG,
    messages: undefined,
    pages: undefined,
  });

  return `
      ${usei18nKeysLogic ? "import {translateCore} from 'brisa';" : ""}

      const i18nConfig = ${i18nConfig};

      window.i18n = {
        ...i18nConfig,
        get locale(){ return document.documentElement.lang },
        ${usei18nKeysLogic ? i18nKeysLogic : ""}
      }
  `;
}
