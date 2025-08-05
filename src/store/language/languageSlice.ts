import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LanguageState {
  currentLanguage: string;
}

// Tarayıcı dilini al
const getBrowserLanguage = (): string => {
  const browserLang = navigator.language || navigator.languages?.[0] || 'tr';
  const shortLang = browserLang.split('-')[0]; // 'en-US' -> 'en'

  // Desteklenen diller
  const supportedLanguages = ['tr', 'en', 'de'];

  if (supportedLanguages.includes(shortLang)) {
    return shortLang;
  }

  return 'tr'; // Varsayılan dil
};

const initialState: LanguageState = {
  currentLanguage: localStorage.getItem('preferredLanguage') || getBrowserLanguage(),
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.currentLanguage = action.payload;
      localStorage.setItem('preferredLanguage', action.payload);
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
