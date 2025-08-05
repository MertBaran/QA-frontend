import { createAsyncThunk } from '@reduxjs/toolkit';
import { questionService } from '../../services/questionService';
import { answerService } from '../../services/answerService';
import { handleError } from '../../utils/errorHandling/enhancedErrorHandler';
import logger from '../../utils/logger';
import { Question } from '../../types/question';
import { Answer } from '../../types/answer';
import { CreateQuestionData, UpdateQuestionData } from '../../types/question';
import { CreateAnswerData } from '../../types/answer';

// Get all questions
export const getAllQuestions = createAsyncThunk<Question[], void>(
  'questions/getAllQuestions',
  async (_, { rejectWithValue }) => {
    try {
      logger.user.action('fetch_questions');
      const response = await questionService.getQuestionsPaginated({
        page: 1,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      return response.data;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'getAllQuestions',
      });
      return rejectWithValue(errorInfo.message);
    }
  },
);

// Get single question
export const getQuestion = createAsyncThunk<Question, string>(
  'questions/getQuestion',
  async (id, { rejectWithValue }) => {
    try {
      logger.user.action('fetch_question', { id });
      const question = await questionService.getQuestionById(id);
      if (!question) {
        return rejectWithValue('Question not found');
      }
      return question;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'getQuestion',
        questionId: id,
      });
      return rejectWithValue(errorInfo.message);
    }
  },
);

// Create new question
export const createQuestion = createAsyncThunk<Question, CreateQuestionData>(
  'questions/createQuestion',
  async (questionData, { rejectWithValue }) => {
    try {
      logger.user.action('create_question', { title: questionData.title });
      const question = await questionService.createQuestion(questionData);
      if (!question) {
        return rejectWithValue('Failed to create question');
      }
      logger.user.action('question_created_successfully');
      return question;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'createQuestion',
        questionData: { title: questionData.title },
      });
      return rejectWithValue(errorInfo.message);
    }
  },
);

// Update question
export const updateQuestion = createAsyncThunk<
  Question,
  { id: string; questionData: UpdateQuestionData }
>('questions/updateQuestion', async ({ id, questionData }, { rejectWithValue }) => {
  try {
    logger.user.action('update_question', { id, title: questionData.title });
    const question = await questionService.updateQuestion(id, questionData);
    if (!question) {
      return rejectWithValue('Failed to update question');
    }
    logger.user.action('question_updated_successfully', { id });
    return question;
  } catch (error) {
    const errorInfo = await handleError(error, {
      action: 'updateQuestion',
      questionId: id,
      questionData: { title: questionData.title },
    });
    return rejectWithValue(errorInfo.message);
  }
});

// Delete question
export const deleteQuestion = createAsyncThunk<boolean, string>(
  'questions/deleteQuestion',
  async (id, { rejectWithValue }) => {
    try {
      logger.user.action('delete_question', { id });
      const success = await questionService.deleteQuestion(id);
      if (!success) {
        return rejectWithValue('Failed to delete question');
      }
      logger.user.action('question_deleted_successfully', { id });
      return success;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'deleteQuestion',
        questionId: id,
      });
      return rejectWithValue(errorInfo.message);
    }
  },
);

// Like question
export const likeQuestion = createAsyncThunk<boolean, string>(
  'questions/likeQuestion',
  async (id, { rejectWithValue }) => {
    try {
      logger.user.action('like_question', { id });
      const success = await questionService.likeQuestion(id);
      if (!success) {
        return rejectWithValue('Failed to like question');
      }
      logger.user.action('question_liked_successfully', { id });
      return success;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'likeQuestion',
        questionId: id,
      });
      return rejectWithValue(errorInfo.message);
    }
  },
);

// Unlike question
export const unlikeQuestion = createAsyncThunk<boolean, string>(
  'questions/unlikeQuestion',
  async (id, { rejectWithValue }) => {
    try {
      logger.user.action('unlike_question', { id });
      const success = await questionService.unlikeQuestion(id);
      if (!success) {
        return rejectWithValue('Failed to unlike question');
      }
      logger.user.action('question_unliked_successfully', { id });
      return success;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'unlikeQuestion',
        questionId: id,
      });
      return rejectWithValue(errorInfo.message);
    }
  },
);

// Add answer to question
export const addAnswer = createAsyncThunk<
  Answer,
  { questionId: string; answerData: CreateAnswerData }
>('questions/addAnswer', async ({ questionId, answerData }, { rejectWithValue }) => {
  try {
    logger.user.action('add_answer', { questionId });
    const answer = await answerService.createAnswer(questionId, answerData);
    if (!answer) {
      return rejectWithValue('Failed to create answer');
    }
    logger.user.action('answer_added_successfully', { questionId });
    return answer;
  } catch (error) {
    const errorInfo = await handleError(error, {
      action: 'addAnswer',
      questionId,
      answerData: { content: answerData.content },
    });
    return rejectWithValue(errorInfo.message);
  }
});
