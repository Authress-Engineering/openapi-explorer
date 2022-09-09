import i18next from 'i18next';
import en from './en';
import fr from './fr';

export async function initI18n() {
  const initLang = window.navigator.language.substring(0, 2);
  await i18next.init({
    lng: initLang,
    fallbackLng: 'en',
    debug: true,
    ns: ['translation'],
    defaultNS: 'translation',
    resources: {
      en, fr
    }
  });
}

export function getI18nText(key) {
  return i18next.t(key);
}
