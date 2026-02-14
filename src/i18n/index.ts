import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en/index.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: localStorage.getItem("lobster-lounge-lang") || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

i18n.on("languageChanged", (lng: string) => {
  localStorage.setItem("lobster-lounge-lang", lng);
});

export default i18n;
