import type { I18nConfig } from 'brisa';
import en from './messages/en';
import es from './messages/es';

const i18nConfig: I18nConfig<typeof en | typeof es> = {
  defaultLocale: 'en',
  locales: ['en', 'es'],
  messages: { en, es },
  pages: {
    '/about': {
      en: '/about/',
      es: '/sobre-nosotros/',
    },
  },
};

export default i18nConfig;
