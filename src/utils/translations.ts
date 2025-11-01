import { common } from './i18n/domains/common';
import { auth } from './i18n/domains/auth';
import { bookmark } from './i18n/domains/bookmark';
import { filters } from './i18n/domains/filters';
import { questions } from './i18n/domains/questions';
import { answers } from './i18n/domains/answers';
import { actions } from './i18n/domains/actions';
import { captcha } from './i18n/domains/captcha';
import { profile } from './i18n/domains/profile';
import { admin } from './i18n/domains/admin';
import { register } from './i18n/domains/register';

// Merge all domains into a single object
const allDomains = {
  ...common,
  ...auth,
  ...bookmark,
  ...filters,
  ...questions,
  ...answers,
  ...actions,
  ...captcha,
  ...profile,
  ...admin,
  ...register,
};

// Transform from { key: { tr, en, de } } to { tr: { key: value }, en: { key: value }, de: { key: value } }
const tr: Record<string, string> = {};
const en: Record<string, string> = {};
const de: Record<string, string> = {};

Object.entries(allDomains).forEach(([key, translations]) => {
  tr[key] = translations.tr;
  en[key] = translations.en;
  de[key] = translations.de;
});

export const translations = { tr, en, de } as const;

export const t = (key: string, language: string = 'tr'): string => {
  const langTranslations = translations[language as keyof typeof translations];
  if (langTranslations && key in langTranslations) {
    return langTranslations[key];
  }
  return key;
};

// Dev-time validation to warn missing/extra keys across languages
const validateTranslations = () => {
  try {
    const langs = Object.keys(translations) as Array<keyof typeof translations>;
    const base = translations.tr;
    for (const lang of langs) {
      const dict = translations[lang];
      const missing = Object.keys(base).filter((k) => !(k in dict));
      const extra = Object.keys(dict).filter((k) => !(k in base));
      if (missing.length) console.warn(`[i18n] Missing in ${String(lang)}:`, missing);
      if (extra.length) console.warn(`[i18n] Extra in ${String(lang)}:`, extra);
    }
  } catch {
    // noop
  }
};
if (process.env.NODE_ENV !== 'production') validateTranslations();
