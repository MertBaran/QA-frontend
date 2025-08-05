import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { QuestionState } from './questionState.js';
import {
  getAllQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  likeQuestion,
  unlikeQuestion,
} from './questionThunks';

import { Question } from '../../types/question';

const initialState: QuestionState = {
  questions: [],
  currentQuestion: null,
  loading: false,
  error: null,
  totalQuestions: 0,
  currentPage: 1,
  questionsPerPage: 10,
};

const questionSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    // Clear errors
    clearError: (state) => {
      state.error = null;
    },

    // Set loading
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Set current page
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },

    // Clear current question
    clearCurrentQuestion: (state) => {
      state.currentQuestion = null;
    },

    // Update question in list
    updateQuestionInList: (state, action) => {
      const { questionId, updates } = action.payload;
      const index = state.questions.findIndex((q) => q.id === questionId);
      if (index !== -1) {
        state.questions[index] = { ...state.questions[index], ...updates };
      }
    },

    // Remove question from list
    removeQuestionFromList: (state, action) => {
      const questionId = action.payload;
      state.questions = state.questions.filter((q) => q.id !== questionId);
      state.totalQuestions -= 1;
    },

    // Add question to list
    addQuestionToList: (state, action) => {
      state.questions.unshift(action.payload);
      state.totalQuestions += 1;
    },

    // Update like status
    updateLikeStatus: (state, action) => {
      const { questionId, isLiked } = action.payload;
      const question = state.questions.find((q) => q.id === questionId);
      if (question) {
        if (isLiked) {
          question.likes += 1;
        } else {
          question.likes = Math.max(0, question.likes - 1);
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Get all questions
    builder
      .addCase(getAllQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllQuestions.fulfilled, (state, action: PayloadAction<Question[]>) => {
        state.loading = false;
        state.questions = action.payload;
        state.totalQuestions = action.payload.length;
      })
      .addCase(getAllQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Get single question
      .addCase(getQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuestion.fulfilled, (state, action: PayloadAction<Question>) => {
        state.loading = false;
        state.currentQuestion = action.payload;
      })
      .addCase(getQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Create question
      .addCase(createQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuestion.fulfilled, (state, action: PayloadAction<Question>) => {
        state.loading = false;
        state.questions.unshift(action.payload);
        state.totalQuestions += 1;
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Update question
      .addCase(updateQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuestion.fulfilled, (state, action: PayloadAction<Question>) => {
        state.loading = false;
        const updatedQuestion = action.payload;

        // Update in questions list
        const index = state.questions.findIndex((q) => q.id === updatedQuestion.id);
        if (index !== -1) {
          state.questions[index] = updatedQuestion;
        }

        // Update current question if it's the same
        if (state.currentQuestion && state.currentQuestion.id === updatedQuestion.id) {
          state.currentQuestion = updatedQuestion;
        }
      })
      .addCase(updateQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Delete question
      .addCase(deleteQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.loading = false;
        // The question ID is in action.meta.arg
        const questionId = (action as any).meta.arg as string;
        state.questions = state.questions.filter((q) => q.id !== questionId);
        state.totalQuestions -= 1;

        // Clear current question if it's the deleted one
        if (state.currentQuestion && state.currentQuestion.id === questionId) {
          state.currentQuestion = null;
        }
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Like question
      .addCase(likeQuestion.fulfilled, (state, action) => {
        // Like action returns boolean, so we need to update the question manually
        const questionId = (action as any).meta.arg as string;
        const question = state.questions.find((q) => q.id === questionId);
        if (question) {
          question.likes += 1;
        }
        if (state.currentQuestion && state.currentQuestion.id === questionId) {
          state.currentQuestion.likes += 1;
        }
      })
      .addCase(unlikeQuestion.fulfilled, (state, action) => {
        // Unlike action returns boolean, so we need to update the question manually
        const questionId = (action as any).meta.arg as string;
        const question = state.questions.find((q) => q.id === questionId);
        if (question) {
          question.likes = Math.max(0, question.likes - 1);
        }
        if (state.currentQuestion && state.currentQuestion.id === questionId) {
          state.currentQuestion.likes = Math.max(0, state.currentQuestion.likes - 1);
        }
      });
  },
});

export const {
  clearError,
  setLoading,
  setCurrentPage,
  clearCurrentQuestion,
  updateQuestionInList,
  removeQuestionFromList,
  addQuestionToList,
  updateLikeStatus,
} = questionSlice.actions;

export default questionSlice.reducer;
