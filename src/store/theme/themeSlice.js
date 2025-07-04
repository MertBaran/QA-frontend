import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mode: "light", // light, dark
  language: "tr", // tr, en
  fontSize: "medium", // small, medium, large
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
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.mode = action.payload;
    },
    toggleTheme: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
    resetTheme: (state) => {
      state.mode = "light";
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setFontSize: (state, action) => {
      state.fontSize = action.payload;
    },
    toggleNotification: (state, action) => {
      const { type } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.notifications, type)) {
        state.notifications[type] = !state.notifications[type];
      }
    },
    setNotification: (state, action) => {
      const { type, value } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.notifications, type)) {
        state.notifications[type] = value;
      }
    },
    togglePreference: (state, action) => {
      const { key } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.preferences, key)) {
        state.preferences[key] = !state.preferences[key];
      }
    },
    setPreference: (state, action) => {
      const { key, value } = action.payload;
      if (Object.prototype.hasOwnProperty.call(state.preferences, key)) {
        state.preferences[key] = value;
      }
    },
    resetPreferences: (state) => {
      Object.assign(state, initialState);
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