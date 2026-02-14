import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./ar/index.json";
import bn from "./bn/index.json";
import de from "./de/index.json";
import en from "./en/index.json";
import es from "./es/index.json";
import fr from "./fr/index.json";
import hi from "./hi/index.json";
import id from "./id/index.json";
import ja from "./ja/index.json";
import ko from "./ko/index.json";
import no from "./no/index.json";
import pt from "./pt/index.json";
import ru from "./ru/index.json";
import ur from "./ur/index.json";
import vi from "./vi/index.json";
import zh from "./zh/index.json";

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  hi: { translation: hi },
  id: { translation: id },
  pt: { translation: pt },
  ru: { translation: ru },
  es: { translation: es },
  ja: { translation: ja },
  ar: { translation: ar },
  vi: { translation: vi },
  de: { translation: de },
  bn: { translation: bn },
  ur: { translation: ur },
  ko: { translation: ko },
  fr: { translation: fr },
  no: { translation: no },
};

const saved = localStorage.getItem("lobster-lounge-lang");
const browserLang = navigator.language?.split("-")[0] || "en";
const lng = saved || (browserLang in resources ? browserLang : "en");

i18n.use(initReactI18next).init({
  resources,
  lng,
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
