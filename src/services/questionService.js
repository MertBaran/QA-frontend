import api from "./api";
import logger from "../utils/logger";

export const questionService = {
  // Get all questions
  getAllQuestions: async (params = {}) => {
    logger.api.request('GET', '/questions', params);
    const response = await api.get("/questions", { params });
    return response.data;
  },

  // Get single question
  getQuestion: async (id) => {
    logger.api.request('GET', `/questions/${id}`);
    const response = await api.get(`/questions/${id}`);
    return response.data;
  },

  // Ask new question
  askQuestion: async (questionData) => {
    logger.api.request('POST', '/questions/ask', questionData);
    const response = await api.post("/questions/ask", questionData);
    return response.data;
  },

  // Edit question
  editQuestion: async (id, questionData) => {
    logger.api.request('PUT', `/questions/${id}/edit`, questionData);
    const response = await api.put(`/questions/${id}/edit`, questionData);
    return response.data;
  },

  // Delete question
  deleteQuestion: async (id) => {
    logger.api.request('DELETE', `/questions/${id}/delete`);
    const response = await api.delete(`/questions/${id}/delete`);
    return response.data;
  },

  // Like question
  likeQuestion: async (id) => {
    logger.api.request('GET', `/questions/${id}/like`);
    const response = await api.get(`/questions/${id}/like`);
    return response.data;
  },

  // Undo like question
  undoLikeQuestion: async (id) => {
    logger.api.request('GET', `/questions/${id}/undo_like`);
    const response = await api.get(`/questions/${id}/undo_like`);
    return response.data;
  },

  // Add answer to question
  addAnswer: async (questionId, answerData) => {
    logger.api.request('POST', `/questions/${questionId}/answers`, answerData);
    const response = await api.post(`/questions/${questionId}/answers`, answerData);
    return response.data;
  },

  // Get answers for question
  getAnswers: async (questionId) => {
    logger.api.request('GET', `/questions/${questionId}/answers`);
    const response = await api.get(`/questions/${questionId}/answers`);
    return response.data;
  },
}; 