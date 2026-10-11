import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { defaultLanguage } from "./locales";
import { resources } from "./resources";

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  defaultNS: "common",
  fallbackLng: defaultLanguage,
  interpolation: { escapeValue: false },
  lng: defaultLanguage,
  resources,
  returnNull: false,
  react: { useSuspense: false },
});

export default i18n;
