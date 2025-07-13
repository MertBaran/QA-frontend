import { createSlice } from '@reduxjs/toolkit';
import { FormState } from '../../models/FormState';

const initialState: FormState = {
  drafts: {
    // Form draft'ları için
    askQuestion: null,
    editProfile: null,
    contactForm: null,
  },
  lastVisited: {
    // Son ziyaret edilen sayfalar
    questions: null,
    profile: null,
    settings: null,
  },
  searchHistory: {
    // Arama geçmişi
    questions: [],
    users: [],
    tags: [],
  },
  filters: {
    // Filtre tercihleri
    questions: {
      category: 'all',
      sortBy: 'newest',
      tags: [],
    },
    users: {
      role: 'all',
      sortBy: 'name',
    },
  },
  values: {},
  errors: {},
  isSubmitting: false,
};

const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    // Form draft işlemleri
    saveDraft: (state, action) => {
      const { formName, data } = action.payload;
      state.drafts[formName] = {
        ...data,
        savedAt: new Date().toISOString(),
      };
    },
    clearDraft: (state, action) => {
      const { formName } = action.payload;
      state.drafts[formName] = null;
    },
    clearAllDrafts: state => {
      state.drafts = initialState.drafts;
    },

    // Son ziyaret işlemleri
    setLastVisited: (state, action) => {
      const { page, data } = action.payload;
      state.lastVisited[page] = {
        ...data,
        visitedAt: new Date().toISOString(),
      };
    },

    // Arama geçmişi işlemleri
    addSearchHistory: (state, action) => {
      const { type, query } = action.payload;
      if (state.searchHistory[type]) {
        // Aynı aramayı tekrar ekleme
        const existingIndex = state.searchHistory[type].findIndex(
          item => item.query === query
        );
        if (existingIndex !== -1) {
          state.searchHistory[type].splice(existingIndex, 1);
        }
        // En başa ekle (son arama)
        state.searchHistory[type].unshift({
          query,
          searchedAt: new Date().toISOString(),
        });
        // Maksimum 10 arama tut
        if (state.searchHistory[type].length > 10) {
          state.searchHistory[type] = state.searchHistory[type].slice(0, 10);
        }
      }
    },
    clearSearchHistory: (state, action) => {
      const { type } = action.payload;
      if (type) {
        state.searchHistory[type] = [];
      } else {
        state.searchHistory = initialState.searchHistory;
      }
    },

    // Filtre işlemleri
    setFilter: (state, action) => {
      const { type, filters } = action.payload;
      if (state.filters[type]) {
        state.filters[type] = { ...state.filters[type], ...filters };
      }
    },
    resetFilters: (state, action) => {
      const { type } = action.payload;
      if (type) {
        state.filters[type] = initialState.filters[type];
      } else {
        state.filters = initialState.filters;
      }
    },

    setFieldValue: (state, action) => {
      const { field, value } = action.payload;
      state.values[field] = value;
    },
    setFieldError: (state, action) => {
      const { field, error } = action.payload;
      state.errors[field] = error;
    },
    setSubmitting: (state, action) => {
      state.isSubmitting = action.payload;
    },
    resetForm: state => {
      state.values = {};
      state.errors = {};
      state.isSubmitting = false;
    },
  },
});

export const {
  saveDraft,
  clearDraft,
  clearAllDrafts,
  setLastVisited,
  addSearchHistory,
  clearSearchHistory,
  setFilter,
  resetFilters,
  setFieldValue,
  setFieldError,
  setSubmitting,
  resetForm,
} = formSlice.actions;

export default formSlice.reducer;
