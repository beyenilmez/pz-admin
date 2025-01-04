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
      supportedLngs: supportedLngs,
      fallbackLng: "en-US",
      debug: false,
      interpolation: {
        escapeValue: false, // React already handles XSS
      },
      backend: {
        // Updated to support modular translation files
        loadPath: "/locales/{{lng}}/{{ns}}.json", // Path to namespace-based files
      },
      ns: ["common", "items"], // Namespaces to load
      defaultNS: "common", // Default namespace
    });

  return i18n;
};

export default initializeI18n;
