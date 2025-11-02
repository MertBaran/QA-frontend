import { createAsyncThunk } from '@reduxjs/toolkit';
import { questionService } from '../../services/questionService';
import { answerService } from '../../services/answerService';
import { bookmarkService } from '../../services/bookmarkService';
import { handleError } from '../../utils/errorHandling/enhancedErrorHandler';
import logger from '../../utils/logger';
import { Question } from '../../types/question';
import { Answer } from '../../types/answer';
import { CreateQuestionData } from '../../types/question';
import { AxiosError } from 'axios';

export interface FetchQuestionsParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  category?: string;
  tags?: string;
  savedOnly?: string;
}

export interface FetchQuestionsResult {
  questions: Question[];
  totalQuestions: number;
  totalPages: number;
}

// Fetch paginated questions for home page
export const fetchHomeQuestions = createAsyncThunk<FetchQuestionsResult, FetchQuestionsParams>(
  'home/fetchHomeQuestions',
  async (params, { rejectWithValue }) => {
    try {
      logger.user.action('fetch_home_questions', params);

      const result = await questionService.getQuestionsPaginated({
        page: params.page,
        limit: params.limit,
        sortBy:
          params.sortBy === 'En Yeni'
            ? 'createdAt'
            : params.sortBy === 'En Popüler'
              ? 'likes'
              : params.sortBy === 'En Çok Görüntülenen'
                ? 'views'
                : params.sortBy === 'En Çok Cevaplanan'
                  ? 'answers'
                  : 'createdAt',
        sortOrder: params.sortOrder,
        search: params.search,
        category: params.category,
        tags: params.tags,
      });

      let data = result.data;

      // Saved only filter: filter by bookmarked questions
      if (params.savedOnly === 'true') {
        try {
          const bookmarks = await bookmarkService.getUserBookmarks();
          const savedQuestionIds = new Set(
            bookmarks.filter((b) => b.target_type === 'question').map((b) => b.target_id),
          );
          data = data.filter((q) => savedQuestionIds.has(q.id));
        } catch {
          // silent failure
        }
      }

      logger.user.action('home_page_loaded');
      logger.performance.measure('home_page_load', 1500, { component: 'Home' });

      return {
        questions: data,
        totalQuestions: result.pagination.totalItems,
        totalPages: result.pagination.totalPages,
      };
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'fetchHomeQuestions',
        params,
      });
      return rejectWithValue(errorInfo.message);
    }
  },
);

// Load parent questions and answers
export const loadParents = createAsyncThunk<
  {
    parentQuestions: Record<string, Question>;
    parentAnswers: Record<string, Answer>;
    parentAnswerQuestions: Record<string, Question>;
  },
  Question[]
>('home/loadParents', async (questions, { rejectWithValue }) => {
  try {
    if (!questions || questions.length === 0) {
      return {
        parentQuestions: {},
        parentAnswers: {},
        parentAnswerQuestions: {},
      };
    }

    const parentIds = new Set(
      questions
        .filter((q) => q.parentQuestionId || q.parentAnswerId)
        .map((q) => (q.parentQuestionId || q.parentAnswerId)!),
    );

    if (parentIds.size === 0) {
      return {
        parentQuestions: {},
        parentAnswers: {},
        parentAnswerQuestions: {},
      };
    }

    const parents: Record<string, Question> = {};
    const answerParents: Record<string, Answer> = {};
    const answerQuestionParents: Record<string, Question> = {};

    for (const parentId of parentIds) {
      const questionParent = await questionService.getQuestionById(parentId);
      if (questionParent) {
        parents[parentId] = questionParent;
      } else {
        const answerParent = await answerService.getAnswerById(parentId);
        if (answerParent) {
          answerParents[parentId] = answerParent;

          if (answerParent.questionId) {
            const answerQ = await questionService.getQuestionById(answerParent.questionId);
            if (answerQ) {
              answerQuestionParents[parentId] = answerQ;
            }
          }
        }
      }
    }

    return {
      parentQuestions: parents,
      parentAnswers: answerParents,
      parentAnswerQuestions: answerQuestionParents,
    };
  } catch (error) {
    const errorInfo = await handleError(error, {
      action: 'loadParents',
    });
    return rejectWithValue(errorInfo.message);
  }
});

// Create question on home page with validation error handling
export const createHomeQuestion = createAsyncThunk<
  Question,
  CreateQuestionData,
  { rejectValue: { message: string; validationErrors?: Record<string, string> } }
>('home/createHomeQuestion', async (questionData, { rejectWithValue }) => {
  try {
    logger.user.action('create_question', { title: questionData.title });
    const question = await questionService.createQuestion(questionData);
    if (!question) {
      return rejectWithValue({ message: 'Failed to create question' });
    }
    logger.user.action('question_created_successfully');
    return question;
  } catch (error) {
    // Check if it's a validation error from backend
    const axiosError = error as AxiosError;
    if (axiosError.response?.data) {
      const data = axiosError.response.data as any;
      if (data.errors && Array.isArray(data.errors)) {
        // Handle validation errors
        const validationErrors: Record<string, string> = {};
        data.errors.forEach((err: any) => {
          if (err.path && err.path[0]) {
            const field = err.path[0];
            let message = err.message;

            // Translate validation messages to Turkish
            if (message.includes('Too small')) {
              if (field === 'title') {
                message = 'Başlık en az 10 karakter olmalıdır';
              } else if (field === 'content') {
                message = 'İçerik en az 20 karakter olmalıdır';
              }
            } else if (message.includes('Required')) {
              if (field === 'title') {
                message = 'Başlık gereklidir';
              } else if (field === 'content') {
                message = 'İçerik gereklidir';
              }
            }

            validationErrors[field] = message;
          }
        });

        if (Object.keys(validationErrors).length > 0) {
          return rejectWithValue({
            message: 'Validation error',
            validationErrors,
          });
        }
      } else if (data.error) {
        // General error message
        return rejectWithValue({
          message: data.error,
          validationErrors: { title: data.error },
        });
      }
    }

    // Use standard error handling for other errors
    const errorInfo = await handleError(error, {
      action: 'createHomeQuestion',
      questionData: { title: questionData.title },
    });
    return rejectWithValue({ message: errorInfo.message });
  }
});
