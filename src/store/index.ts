import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './auth/authSlice';
import themeReducer from './theme/themeSlice';
import formReducer from './form/formSlice';
import loginReducer from './auth/login/loginSlice';
import registerReducer from './auth/register/registerSlice';
import questionReducer from './questions/questionSlice';
import languageReducer from './language/languageSlice';
import bookmarkReducer from './bookmarks/bookmarkSlice';
import confirmReducer from './confirm/confirmSlice';

// Persist configuration for auth slice
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'isAuthenticated', 'hasAdminPermission', 'roles'], // Admin permission'ları da persist et
  blacklist: ['loading', 'error', 'adminPermissionLoading'], // Bu alanları persist etme
};

// Persist configuration for theme slice
const themePersistConfig = {
  key: 'theme',
  storage,
  whitelist: ['mode', 'language', 'fontSize', 'notifications', 'preferences'], // Tüm theme state'ini persist et
};

// Persist configuration for form slice
const formPersistConfig = {
  key: 'form',
  storage,
  whitelist: ['drafts', 'lastVisited', 'searchHistory', 'filters'], // Tüm form state'ini persist et
};

// Persist configuration for future slices
// const rootPersistConfig = {
//   key: "root",
//   storage,
//   whitelist: ["auth", "theme", "form"], // auth, theme ve form slice'larını persist et
// };

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedThemeReducer = persistReducer(themePersistConfig, themeReducer);
const persistedFormReducer = persistReducer(formPersistConfig, formReducer);

const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    login: loginReducer,
    register: registerReducer,
    theme: persistedThemeReducer,
    form: persistedFormReducer,
    questions: questionReducer,
    language: languageReducer,
    bookmarks: bookmarkReducer,
    confirm: confirmReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
export { store };

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
