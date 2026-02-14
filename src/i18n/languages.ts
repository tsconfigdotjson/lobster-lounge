export const SUPPORTED_LANGUAGES = [
  "en",
  "zh",
  "hi",
  "id",
  "pt",
  "ru",
  "es",
  "ja",
  "ar",
  "vi",
  "de",
  "bn",
  "ur",
  "ko",
  "fr",
  "no",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const languageNames: Record<SupportedLanguage, string> = {
  en: "English",
  zh: "中文",
  hi: "हिन्दी",
  id: "Indonesia",
  pt: "Português",
  ru: "Русский",
  es: "Español",
  ja: "日本語",
  ar: "العربية",
  vi: "Tiếng Việt",
  de: "Deutsch",
  bn: "বাংলা",
  ur: "اردو",
  ko: "한국어",
  fr: "Français",
  no: "Norsk",
};

export type CountryCode =
  | "US"
  | "CN"
  | "IN"
  | "ID"
  | "BR"
  | "RU"
  | "MX"
  | "JP"
  | "EG"
  | "VN"
  | "DE"
  | "BD"
  | "PK"
  | "KR"
  | "FR"
  | "NO";

export const languageToCountry: Record<SupportedLanguage, CountryCode> = {
  en: "US",
  zh: "CN",
  hi: "IN",
  id: "ID",
  pt: "BR",
  ru: "RU",
  es: "MX",
  ja: "JP",
  ar: "EG",
  vi: "VN",
  de: "DE",
  bn: "BD",
  ur: "PK",
  ko: "KR",
  fr: "FR",
  no: "NO",
};
