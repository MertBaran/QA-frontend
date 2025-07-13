import api from './api';
import logger from '../utils/logger';
import {
  Question,
  Answer,
  AskQuestionData,
  AnswerData,
} from '../models/Question';
import { ApiResponse } from '../types/api';

export const questionService = {
  // Get all questions
  getAllQuestions: async (
    params: Record<string, any> = {}
  ): Promise<ApiResponse<Question[]>> => {
    logger.api.request('GET', '/questions', params);
    const response = await api.get<ApiResponse<Question[]>>('/questions', {
      params,
    });
    return response.data;
  },

  // Get single question
  getQuestion: async (id: string): Promise<ApiResponse<Question>> => {
    logger.api.request('GET', `/questions/${id}`);
    const response = await api.get<ApiResponse<Question>>(`/questions/${id}`);
    return response.data;
  },

  // Ask new question
  askQuestion: async (
    questionData: AskQuestionData
  ): Promise<ApiResponse<Question>> => {
    logger.api.request('POST', '/questions/ask', questionData);
    const response = await api.post<ApiResponse<Question>>(
      '/questions/ask',
      questionData
    );
    return response.data;
  },

  // Edit question
  editQuestion: async (
    id: string,
    questionData: Partial<AskQuestionData>
  ): Promise<ApiResponse<Question>> => {
    logger.api.request('PUT', `/questions/${id}/edit`, questionData);
    const response = await api.put<ApiResponse<Question>>(
      `/questions/${id}/edit`,
      questionData
    );
    return response.data;
  },

  // Delete question
  deleteQuestion: async (id: string): Promise<ApiResponse<null>> => {
    logger.api.request('DELETE', `/questions/${id}/delete`);
    const response = await api.delete<ApiResponse<null>>(
      `/questions/${id}/delete`
    );
    return response.data;
  },

  // Like question
  likeQuestion: async (id: string): Promise<ApiResponse<Question>> => {
    logger.api.request('GET', `/questions/${id}/like`);
    const response = await api.get<ApiResponse<Question>>(
      `/questions/${id}/like`
    );
    return response.data;
  },

  // Undo like question
  undoLikeQuestion: async (id: string): Promise<ApiResponse<Question>> => {
    logger.api.request('GET', `/questions/${id}/undo_like`);
    const response = await api.get<ApiResponse<Question>>(
      `/questions/${id}/undo_like`
    );
    return response.data;
  },

  // Add answer to question
  addAnswer: async (
    questionId: string,
    answerData: AnswerData
  ): Promise<ApiResponse<Answer>> => {
    logger.api.request('POST', `/questions/${questionId}/answers`, answerData);
    const response = await api.post<ApiResponse<Answer>>(
      `/questions/${questionId}/answers`,
      answerData
    );
    return response.data;
  },

  // Get answers for question
  getAnswers: async (questionId: string): Promise<ApiResponse<Answer[]>> => {
    logger.api.request('GET', `/questions/${questionId}/answers`);
    const response = await api.get<ApiResponse<Answer[]>>(
      `/questions/${questionId}/answers`
    );
    return response.data;
  },
};
