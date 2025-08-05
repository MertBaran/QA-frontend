import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setLanguage } from '../store/language/languageSlice';

export const useLanguageDetection = () => {
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector((state) => state.language);

  useEffect(() => {
    // Eğer localStorage'da dil tercihi yoksa, tarayıcı dilini kullan
    const savedLanguage = localStorage.getItem('preferredLanguage');

    if (!savedLanguage) {
      const browserLang = navigator.language || navigator.languages?.[0] || 'tr';
      const shortLang = browserLang.split('-')[0]; // 'en-US' -> 'en'

      // Desteklenen diller
      const supportedLanguages = ['tr', 'en', 'de'];

      if (supportedLanguages.includes(shortLang)) {
        dispatch(setLanguage(shortLang));
        console.log(`Tarayıcı dili algılandı: ${shortLang}`);
      } else {
        console.log(`Desteklenmeyen tarayıcı dili: ${shortLang}, varsayılan dil kullanılıyor: tr`);
      }
    }
  }, [dispatch]);

  return { currentLanguage };
};
