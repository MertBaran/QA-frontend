import { createAsyncThunk } from '@reduxjs/toolkit';
import { answerService } from '../../services/answerService';
import { handleError } from '../../utils/errorHandling/enhancedErrorHandler';
import logger from '../../utils/logger';
import { Answer } from '../../types/answer';
import { CreateAnswerData, UpdateAnswerData } from '../../types/answer';

// Get answers by question
export const getAnswersByQuestion = createAsyncThunk<Answer[], string>(
  'answers/getAnswersByQuestion',
  async (questionId, { rejectWithValue }) => {
    try {
      logger.user.action('fetch_answers', { questionId });
      const answers = await answerService.getAnswersByQuestion(questionId);
      return answers;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'getAnswersByQuestion',
        questionId,
      });
      return rejectWithValue(errorInfo.message);
    }
  },
);

// Get single answer
export const getAnswerById = createAsyncThunk<Answer, string>(
  'answers/getAnswerById',
  async (answerId, { rejectWithValue }) => {
    try {
      logger.user.action('fetch_answer', { answerId });
      const answer = await answerService.getAnswerById(answerId);
      if (!answer) {
        return rejectWithValue('Answer not found');
      }
      return answer;
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'getAnswerById',
        answerId,
      });
      return rejectWithValue(errorInfo.message);
    }
  },
);

// Create new answer
export const createAnswer = createAsyncThunk<
  Answer,
  { questionId: string; answerData: CreateAnswerData }
>('answers/createAnswer', async ({ questionId, answerData }, { rejectWithValue }) => {
  try {
    logger.user.action('create_answer', { questionId });
    const answer = await answerService.createAnswer(questionId, answerData);
    if (!answer) {
      return rejectWithValue('Failed to create answer');
    }
    logger.user.action('answer_created_successfully');
    return answer;
  } catch (error) {
    const errorInfo = await handleError(error, {
      action: 'createAnswer',
      questionId,
    });
    return rejectWithValue(errorInfo.message);
  }
});

// Update answer
export const updateAnswer = createAsyncThunk<
  Answer,
  { answerId: string; answerData: UpdateAnswerData }
>('answers/updateAnswer', async ({ answerId, answerData }, { rejectWithValue }) => {
  try {
    logger.user.action('update_answer', { answerId });
    const answer = await answerService.updateAnswer(answerId, answerData);
    if (!answer) {
      return rejectWithValue('Failed to update answer');
    }
    logger.user.action('answer_updated_successfully', { answerId });
    return answer;
  } catch (error) {
    const errorInfo = await handleError(error, {
      action: 'updateAnswer',
      answerId,
    });
    return rejectWithValue(errorInfo.message);
  }
});

// Delete answer
export const deleteAnswer = createAsyncThunk<
  boolean,
  { answerId: string; questionId: string }
>('answers/deleteAnswer', async ({ answerId, questionId }, { rejectWithValue }) => {
  try {
    logger.user.action('delete_answer', { answerId, questionId });
    const success = await answerService.deleteAnswer(answerId, questionId);
    if (!success) {
      return rejectWithValue('Failed to delete answer');
    }
    logger.user.action('answer_deleted_successfully', { answerId });
    return success;
  } catch (error) {
    const errorInfo = await handleError(error, {
      action: 'deleteAnswer',
      answerId,
      questionId,
    });
    return rejectWithValue(errorInfo.message);
  }
});

// Like answer
export const likeAnswer = createAsyncThunk<
  boolean,
  { answerId: string; questionId: string }
>('answers/likeAnswer', async ({ answerId, questionId }, { rejectWithValue }) => {
  try {
    logger.user.action('like_answer', { answerId, questionId });
    const success = await answerService.likeAnswer(answerId, questionId);
    if (!success) {
      return rejectWithValue('Failed to like answer');
    }
    logger.user.action('answer_liked_successfully', { answerId });
    return success;
  } catch (error) {
    const errorInfo = await handleError(error, {
      action: 'likeAnswer',
      answerId,
      questionId,
    });
    return rejectWithValue(errorInfo.message);
  }
});

// Unlike answer
export const unlikeAnswer = createAsyncThunk<
  boolean,
  { answerId: string; questionId: string }
>('answers/unlikeAnswer', async ({ answerId, questionId }, { rejectWithValue }) => {
  try {
    logger.user.action('unlike_answer', { answerId, questionId });
    const success = await answerService.unlikeAnswer(answerId, questionId);
    if (!success) {
      return rejectWithValue('Failed to unlike answer');
    }
    logger.user.action('answer_unliked_successfully', { answerId });
    return success;
  } catch (error) {
    const errorInfo = await handleError(error, {
      action: 'unlikeAnswer',
      answerId,
      questionId,
    });
    return rejectWithValue(errorInfo.message);
  }
});

