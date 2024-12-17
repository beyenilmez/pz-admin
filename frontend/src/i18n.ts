import { GetConfigField } from "@/wailsjs/go/main/App";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";
import locales from "@/locales.json";

const initializeI18n = async () => {
  const language = ((await GetConfigField("Language")) as string) || "en-US";

  const supportedLngs = locales.locales.map((language) => language.code);

  i18n
    .use(HttpApi)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      load: "currentOnly",
      lng: language,
      supportedLngs: supportedLngs, // Add supported languages here
      fallbackLng: "en-US",
      debug: true,
      interpolation: {
        escapeValue: false, // React already safes from XSS
      },
      backend: {
        loadPath: "/locales/{{lng}}.json", // Path to translation files
      },
    });

  return i18n;
};

export default initializeI18n;
