import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AnswerState } from './answerState';
import {
  getAnswersByQuestion,
  getAnswerById,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  likeAnswer,
  unlikeAnswer,
} from './answerThunks';

import { Answer } from '../../types/answer';

const initialState: AnswerState = {
  answers: [],
  currentAnswer: null,
  loading: false,
  error: null,
  totalAnswers: 0,
  currentPage: 1,
  answersPerPage: 10,
};

const answerSlice = createSlice({
  name: 'answers',
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

    // Clear current answer
    clearCurrentAnswer: (state) => {
      state.currentAnswer = null;
    },

    // Clear answers
    clearAnswers: (state) => {
      state.answers = [];
      state.totalAnswers = 0;
    },

    // Update answer in list
    updateAnswerInList: (state, action) => {
      const { answerId, updates } = action.payload;
      const index = state.answers.findIndex((a) => a.id === answerId);
      if (index !== -1) {
        state.answers[index] = { ...state.answers[index], ...updates };
      }
    },

    // Remove answer from list
    removeAnswerFromList: (state, action) => {
      const answerId = action.payload;
      state.answers = state.answers.filter((a) => a.id !== answerId);
      state.totalAnswers -= 1;
    },
  },
  extraReducers: (builder) => {
    // Get answers by question
    builder
      .addCase(getAnswersByQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAnswersByQuestion.fulfilled, (state, action: PayloadAction<{
        data: Answer[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
          hasNext: boolean;
          hasPrev: boolean;
        };
      }>) => {
        state.loading = false;
        state.answers = action.payload.data;
        state.totalAnswers = action.payload.pagination.total;
        state.currentPage = action.payload.pagination.page;
        state.answersPerPage = action.payload.pagination.limit;
      })
      .addCase(getAnswersByQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Get single answer
      .addCase(getAnswerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAnswerById.fulfilled, (state, action: PayloadAction<Answer>) => {
        state.loading = false;
        state.currentAnswer = action.payload;
      })
      .addCase(getAnswerById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Create answer
      .addCase(createAnswer.fulfilled, (state, action: PayloadAction<Answer>) => {
        state.loading = false;
        state.answers.unshift(action.payload);
        state.totalAnswers += 1;
      })
      .addCase(createAnswer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAnswer.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Update answer
      .addCase(updateAnswer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAnswer.fulfilled, (state, action: PayloadAction<Answer>) => {
        state.loading = false;
        const updatedAnswer = action.payload;

        // Update in answers list
        const index = state.answers.findIndex((a) => a.id === updatedAnswer.id);
        if (index !== -1) {
          state.answers[index] = updatedAnswer;
        }

        // Update current answer if it's the same
        if (state.currentAnswer && state.currentAnswer.id === updatedAnswer.id) {
          state.currentAnswer = updatedAnswer;
        }
      })
      .addCase(updateAnswer.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Delete answer
      .addCase(deleteAnswer.fulfilled, (state, action) => {
        state.loading = false;
        // The answer ID is in action.meta.arg
        const answerId = (action as any).meta.arg.answerId as string;
        state.answers = state.answers.filter((a) => a.id !== answerId);
        state.totalAnswers -= 1;

        // Clear current answer if it's the deleted one
        if (state.currentAnswer && state.currentAnswer.id === answerId) {
          state.currentAnswer = null;
        }
      })
      .addCase(deleteAnswer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAnswer.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Like/Unlike answer - state updates handled in component
      .addCase(likeAnswer.fulfilled, (state, action) => {
        // State updates now handled in QuestionDetail component
      })
      .addCase(unlikeAnswer.fulfilled, (state, action) => {
        // State updates now handled in QuestionDetail component
      });
  },
});

export const {
  clearError,
  setLoading,
  setCurrentPage,
  clearCurrentAnswer,
  clearAnswers,
  updateAnswerInList,
  removeAnswerFromList,
} = answerSlice.actions;

export default answerSlice.reducer;

