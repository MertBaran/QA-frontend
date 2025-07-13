import { createAsyncThunk } from '@reduxjs/toolkit';
import { questionService } from '../../services/questionService';
import { handleError } from '../../utils/errorHandling/enhancedErrorHandler';
import logger from '../../utils/logger';
import { ApiResponse } from '../../types/api';
import { Question, AskQuestionData, Answer, AnswerData } from '../../models/Question';

// Get all questions
export const getAllQuestions = createAsyncThunk<ApiResponse<Question[]>, Record<string, any> | undefined>(
  'questions/getAllQuestions',
  async (params = {}, { rejectWithValue }) => {
    try {
      logger.user.action('fetch_questions', params);
      const response = await questionService.getAllQuestions(params);
      return response;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'getAllQuestions',
        params,
      });
      return rejectWithValue(errorInfo.message);
    }
  }
);

// Get single question
export const getQuestion = createAsyncThunk<ApiResponse<Question>, string>(
  'questions/getQuestion',
  async (id, { rejectWithValue }) => {
    try {
      logger.user.action('fetch_single_question', { id });
      const response = await questionService.getQuestion(id);
      return response;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'getQuestion',
        questionId: id,
      });
      return rejectWithValue(errorInfo.message);
    }
  }
);

// Ask new question
export const askQuestion = createAsyncThunk<ApiResponse<Question>, AskQuestionData>(
  'questions/askQuestion',
  async (questionData, { rejectWithValue }) => {
    try {
      logger.user.action('ask_question', { title: questionData.title });
      const response = await questionService.askQuestion(questionData);
      logger.user.action('question_asked_successfully', {
        id: response.data._id,
      });
      return response;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'askQuestion',
        questionData: { title: questionData.title },
      });
      return rejectWithValue(errorInfo.message);
    }
  }
);

// Edit question
export const editQuestion = createAsyncThunk<ApiResponse<Question>, { id: string; questionData: Partial<AskQuestionData> }>(
  'questions/editQuestion',
  async ({ id, questionData }, { rejectWithValue }) => {
    try {
      logger.user.action('edit_question', { id, title: questionData.title });
      const response = await questionService.editQuestion(id, questionData);
      logger.user.action('question_edited_successfully', { id });
      return response;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'editQuestion',
        questionId: id,
        questionData: { title: questionData.title },
      });
      return rejectWithValue(errorInfo.message);
    }
  }
);

// Delete question
export const deleteQuestion = createAsyncThunk<ApiResponse<null>, string>(
  'questions/deleteQuestion',
  async (id, { rejectWithValue }) => {
    try {
      logger.user.action('delete_question', { id });
      const response = await questionService.deleteQuestion(id);
      logger.user.action('question_deleted_successfully', { id });
      return response;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'deleteQuestion',
        questionId: id,
      });
      return rejectWithValue(errorInfo.message);
    }
  }
);

// Like question
export const likeQuestion = createAsyncThunk<ApiResponse<Question>, string>(
  'questions/likeQuestion',
  async (id, { rejectWithValue }) => {
    try {
      logger.user.action('like_question', { id });
      const response = await questionService.likeQuestion(id);
      logger.user.action('question_liked_successfully', { id });
      return response;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'likeQuestion',
        questionId: id,
      });
      return rejectWithValue(errorInfo.message);
    }
  }
);

// Undo like question
export const undoLikeQuestion = createAsyncThunk<ApiResponse<Question>, string>(
  'questions/undoLikeQuestion',
  async (id, { rejectWithValue }) => {
    try {
      logger.user.action('undo_like_question', { id });
      const response = await questionService.undoLikeQuestion(id);
      logger.user.action('question_unliked_successfully', { id });
      return response;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'undoLikeQuestion',
        questionId: id,
      });
      return rejectWithValue(errorInfo.message);
    }
  }
);

// Add answer to question
export const addAnswer = createAsyncThunk<ApiResponse<Answer>, { questionId: string; answerData: AnswerData }>(
  'questions/addAnswer',
  async ({ questionId, answerData }, { rejectWithValue }) => {
    try {
      logger.user.action('add_answer', { questionId });
      const response = await questionService.addAnswer(questionId, answerData);
      logger.user.action('answer_added_successfully', { questionId });
      return response;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'addAnswer',
        questionId,
        answerData: { content: answerData.content },
      });
      return rejectWithValue(errorInfo.message);
    }
  }
);
