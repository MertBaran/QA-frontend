import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HomeState, QuestionFilters, NewQuestion, ValidationErrors } from './homeState';
import { fetchHomeQuestions, createHomeQuestion } from './homeThunks';
import { Question } from '../../types/question';

const initialState: HomeState = {
  questions: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    category: '',
    tags: '',
    sortBy: 'En Yeni',
    savedOnly: 'false',
  },
  activeFilters: [],
  filterModalOpen: false,
  createQuestionModalOpen: false,
  newQuestion: {
    title: '',
    content: '',
    category: '',
    tags: '',
  },
  validationErrors: {},
  isSubmitting: false,
  currentPage: 1,
  itemsPerPage: 10,
  totalQuestions: 0,
  totalPages: 0,
};

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    // Filter actions
    setFilters: (state, action: PayloadAction<QuestionFilters>) => {
      state.filters = action.payload;
    },
    updateFilter: (state, action: PayloadAction<{ field: string; value: string }>) => {
      state.filters = { ...state.filters, [action.payload.field]: action.payload.value };
    },
    setActiveFilters: (state, action: PayloadAction<string[]>) => {
      state.activeFilters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        category: '',
        tags: '',
        sortBy: 'En Yeni',
        savedOnly: 'false',
      };
      state.activeFilters = [];
      state.currentPage = 1;
    },

    // Modal actions
    setFilterModalOpen: (state, action: PayloadAction<boolean>) => {
      state.filterModalOpen = action.payload;
    },
    setCreateQuestionModalOpen: (state, action: PayloadAction<boolean>) => {
      state.createQuestionModalOpen = action.payload;
    },

    // Create question form actions
    setNewQuestion: (state, action: PayloadAction<NewQuestion>) => {
      state.newQuestion = action.payload;
    },
    updateNewQuestionField: (state, action: PayloadAction<{ field: string; value: string }>) => {
      state.newQuestion = { ...state.newQuestion, [action.payload.field]: action.payload.value };
    },
    setValidationErrors: (state, action: PayloadAction<ValidationErrors>) => {
      state.validationErrors = action.payload;
    },
    clearCreateQuestionForm: (state) => {
      state.newQuestion = {
        title: '',
        content: '',
        category: '',
        tags: '',
      };
      state.validationErrors = {};
      state.isSubmitting = false;
    },

    // Pagination actions
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setItemsPerPage: (state, action: PayloadAction<number>) => {
      state.itemsPerPage = action.payload;
      state.currentPage = 1; // Reset to first page when changing items per page
    },

    // Question actions
    updateQuestionInList: (
      state,
      action: PayloadAction<{ questionId: string; updates: Partial<Question> }>,
    ) => {
      const { questionId, updates } = action.payload;
      const index = state.questions.findIndex((q) => q.id === questionId);
      if (index !== -1) {
        state.questions[index] = { ...state.questions[index], ...updates };
      }
    },
    removeQuestionFromList: (state, action: PayloadAction<string>) => {
      const questionId = action.payload;
      state.questions = state.questions.filter((q) => q.id !== questionId);
      state.totalQuestions -= 1;
    },
    addQuestionToList: (state, action: PayloadAction<Question>) => {
      state.questions.unshift(action.payload);
      state.totalQuestions += 1;
    },
  },
  extraReducers: (builder) => {
    // Fetch home questions
    builder
      .addCase(fetchHomeQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHomeQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.questions;
        state.totalQuestions = action.payload.totalQuestions;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchHomeQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Create home question
      .addCase(createHomeQuestion.pending, (state) => {
        state.isSubmitting = true;
        state.validationErrors = {};
      })
      .addCase(createHomeQuestion.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.questions.unshift(action.payload);
        state.totalQuestions += 1;
        // Clear form
        state.newQuestion = {
          title: '',
          content: '',
          category: '',
          tags: '',
        };
        state.validationErrors = {};
      })
      .addCase(createHomeQuestion.rejected, (state, action) => {
        state.isSubmitting = false;
        // Set validation errors if they exist
        if (action.payload?.validationErrors) {
          state.validationErrors = action.payload.validationErrors;
        }
      });
  },
});

export const {
  clearError,
  setFilters,
  updateFilter,
  setActiveFilters,
  clearFilters,
  setFilterModalOpen,
  setCreateQuestionModalOpen,
  setNewQuestion,
  updateNewQuestionField,
  setValidationErrors,
  clearCreateQuestionForm,
  setCurrentPage,
  setItemsPerPage,
  updateQuestionInList,
  removeQuestionFromList,
  addQuestionToList,
} = homeSlice.actions;

export default homeSlice.reducer;
