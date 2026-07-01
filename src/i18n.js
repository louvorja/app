import { createI18n } from "vue-i18n";

const loadLocaleMessages = async () => {
  const locales = ["pt", "es"];
  const messages = {};

  for (const locale of locales) {
    messages[locale] = await import(`./lang/${locale}.json`);
  }

  return messages;
};

export const createI18nInstance = async () => {
  const messages = await loadLocaleMessages();

  return createI18n({
    legacy: true, // Options API para compatibilidade com this.$i18n.locale
    locale: "pt",
    fallbackLocale: "pt",
    messages,
  });
};

// export default i18n;
export default createI18nInstance;
