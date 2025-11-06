import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeState } from '../../models/ThemeState';

const initialState: ThemeState = {
  name: 'molume', // molume, papirus, magnefite
  mode: 'light', // light, dark
  language: 'tr', // tr, en
  fontSize: 'medium', // small, medium, large
  notifications: {
    email: true,
    push: true,
    sound: false,
  },
  preferences: {
    autoSave: true,
    showTutorial: false,
    compactMode: false,
  },
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.name = action.payload;
    },
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    resetTheme: (state) => {
      state.mode = 'light';
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setFontSize: (state, action) => {
      state.fontSize = action.payload;
    },
    toggleNotification: (
      state,
      action: { payload: { type: keyof ThemeState['notifications'] } },
    ) => {
      const { type } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.notifications, type)) {
        state.notifications[type] = !state.notifications[type];
      }
    },
    setNotification: (
      state,
      action: { payload: { type: keyof ThemeState['notifications']; value: boolean } },
    ) => {
      const { type, value } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.notifications, type)) {
        state.notifications[type] = value;
      }
    },
    togglePreference: (state, action: { payload: { key: keyof ThemeState['preferences'] } }) => {
      const { key } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.preferences, key)) {
        state.preferences[key] = !state.preferences[key];
      }
    },
    setPreference: (
      state,
      action: { payload: { key: keyof ThemeState['preferences']; value: boolean } },
    ) => {
      const { key, value } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.preferences, key)) {
        state.preferences[key] = value;
      }
    },
    resetPreferences: (state) => {
      // Sadece preferences'ı resetle, name ve mode'u koru
      state.preferences = initialState.preferences;
      state.notifications = initialState.notifications;
      state.fontSize = initialState.fontSize;
      state.language = initialState.language;
    },
  },
});

export const {
  setTheme,
  toggleTheme,
  resetTheme,
  setLanguage,
  setFontSize,
  toggleNotification,
  setNotification,
  togglePreference,
  setPreference,
  resetPreferences,
} = themeSlice.actions;

export default themeSlice.reducer;
