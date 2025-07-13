import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { QuestionState } from '../../models/QuestionState';
import {
  getAllQuestions,
  getQuestion,
  askQuestion,
  editQuestion,
  deleteQuestion,
  likeQuestion,
  undoLikeQuestion,
} from './questionThunks';
import { ApiResponse } from '../../types/api';
import { Question } from '../../models/Question';

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
    clearError: state => {
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
    clearCurrentQuestion: state => {
      state.currentQuestion = null;
    },

    // Update question in list
    updateQuestionInList: (state, action) => {
      const { questionId, updates } = action.payload;
      const index = state.questions.findIndex(q => q._id === questionId);
      if (index !== -1) {
        state.questions[index] = { ...state.questions[index], ...updates };
      }
    },

    // Remove question from list
    removeQuestionFromList: (state, action) => {
      const questionId = action.payload;
      state.questions = state.questions.filter(q => q._id !== questionId);
      state.totalQuestions -= 1;
    },

    // Add question to list
    addQuestionToList: (state, action) => {
      state.questions.unshift(action.payload);
      state.totalQuestions += 1;
    },

    // Update like status
    updateLikeStatus: (state, action) => {
      const { questionId, userId, isLiked } = action.payload;
      const question = state.questions.find(q => q._id === questionId);
      if (question) {
        if (isLiked) {
          if (!question.likes.includes(userId)) {
            question.likes.push(userId);
          }
        } else {
          question.likes = question.likes.filter(id => id !== userId);
        }
      }
    },
  },
  extraReducers: builder => {
    // Get all questions
    builder
      .addCase(getAllQuestions.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllQuestions.fulfilled, (state, action: PayloadAction<ApiResponse<Question[]>>) => {
        state.loading = false;
        state.questions = action.payload.data;
        state.totalQuestions = action.payload.data.length;
      })
      .addCase(getAllQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Get single question
      .addCase('questions/getQuestion/pending', state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuestion.fulfilled, (state, action: PayloadAction<ApiResponse<Question>>) => {
        state.loading = false;
        state.currentQuestion = action.payload.data;
      })
      .addCase(getQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Ask question
      .addCase('questions/askQuestion/pending', state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(askQuestion.fulfilled, (state, action: PayloadAction<ApiResponse<Question>>) => {
        state.loading = false;
        state.questions.unshift(action.payload.data);
        state.totalQuestions += 1;
      })
      .addCase(askQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Edit question
      .addCase('questions/editQuestion/pending', state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editQuestion.fulfilled, (state, action: PayloadAction<ApiResponse<Question>>) => {
        state.loading = false;
        const updatedQuestion = action.payload.data;

        // Update in questions list
        const index = state.questions.findIndex(
          q => q._id === updatedQuestion._id
        );
        if (index !== -1) {
          state.questions[index] = updatedQuestion;
        }

        // Update current question if it's the same
        if (
          state.currentQuestion &&
          state.currentQuestion._id === updatedQuestion._id
        ) {
          state.currentQuestion = updatedQuestion;
        }
      })
      .addCase(editQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Delete question
      .addCase('questions/deleteQuestion/pending', state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        state.loading = false;
        // The question ID is in action.meta.arg
        const questionId = (action as any).meta.arg as string;
        state.questions = state.questions.filter(q => q._id !== questionId);
        state.totalQuestions -= 1;

        // Clear current question if it's the deleted one
        if (state.currentQuestion && state.currentQuestion._id === questionId) {
          state.currentQuestion = null;
        }
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : (action.error?.message ?? null);
      })

      // Like question
      .addCase(likeQuestion.fulfilled, (state, action: PayloadAction<ApiResponse<Question>>) => {
        const updatedQuestion = action.payload.data;
        const index = state.questions.findIndex(q => q._id === updatedQuestion._id);
        if (index !== -1) {
          state.questions[index] = updatedQuestion;
        }
        if (state.currentQuestion && state.currentQuestion._id === updatedQuestion._id) {
          state.currentQuestion = updatedQuestion;
        }
      })
      .addCase(undoLikeQuestion.fulfilled, (state, action: PayloadAction<ApiResponse<Question>>) => {
        const updatedQuestion = action.payload.data;
        const index = state.questions.findIndex(q => q._id === updatedQuestion._id);
        if (index !== -1) {
          state.questions[index] = updatedQuestion;
        }
        if (state.currentQuestion && state.currentQuestion._id === updatedQuestion._id) {
          state.currentQuestion = updatedQuestion;
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
