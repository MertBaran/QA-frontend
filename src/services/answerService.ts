import api from './api';
import {
  AnswerData,
  Answer,
  AnswersResponse,
  AnswerResponse,
  CreateAnswerData,
  UpdateAnswerData,
} from '../types/answer';

// Backend'den gelen ham veriyi frontend formatına dönüştürme
const transformAnswerData = (answerData: AnswerData): Answer => {
  const createdAt = new Date(answerData.createdAt);
  const now = new Date();
  const timeDiff = now.getTime() - createdAt.getTime();

  // Zaman hesaplama
  let timeAgo = '';
  const minutes = Math.floor(timeDiff / (1000 * 60));
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    timeAgo = `${minutes} dakika önce`;
  } else if (hours < 24) {
    timeAgo = `${hours} saat önce`;
  } else {
    timeAgo = `${days} gün önce`;
  }

  return {
    id: answerData._id,
    content: answerData.content,
    author: {
      id: answerData.user._id,
      name: answerData.user.name,
      avatar: answerData.user.profile_image,
      title: answerData.user.title,
    },
    userInfo: answerData.userInfo || {
      _id: answerData.user._id,
      name: answerData.user.name,
      email: answerData.user.email,
      profile_image: answerData.user.profile_image,
    },
    likes: answerData.likes.length,
    createdAt: answerData.createdAt,
    timeAgo,
  };
};

class AnswerService {
  // Soruya ait cevapları getir
  async getAnswersByQuestion(questionId: string): Promise<Answer[]> {
    try {
      const response = await api.get<AnswersResponse>(`/questions/${questionId}/answers`);
      if (response.data.success && response.data.data) {
        return response.data.data.map(transformAnswerData);
      }
      return [];
    } catch (error) {
      console.error('Cevaplar getirilirken hata:', error);
      return [];
    }
  }

  // Tek cevap getir
  async getAnswerById(answerId: string): Promise<Answer | null> {
    try {
      const response = await api.get<AnswerResponse>(`/answers/${answerId}`);
      if (response.data.success && response.data.data) {
        return transformAnswerData(response.data.data);
      }
      return null;
    } catch (error) {
      console.error('Cevap getirilirken hata:', error);
      return null;
    }
  }

  // Cevap oluştur
  async createAnswer(questionId: string, answerData: CreateAnswerData): Promise<Answer | null> {
    try {
      const response = await api.post<AnswerResponse>(
        `/questions/${questionId}/answers`,
        answerData,
      );
      if (response.data.success && response.data.data) {
        return transformAnswerData(response.data.data);
      }
      return null;
    } catch (error) {
      console.error('Cevap oluşturulurken hata:', error);
      throw error;
    }
  }

  // Cevap güncelle
  async updateAnswer(answerId: string, answerData: UpdateAnswerData): Promise<Answer | null> {
    try {
      const response = await api.put<AnswerResponse>(`/answers/${answerId}`, answerData);
      if (response.data.success && response.data.data) {
        return transformAnswerData(response.data.data);
      }
      return null;
    } catch (error) {
      console.error('Cevap güncellenirken hata:', error);
      throw error;
    }
  }

  // Cevap sil
  async deleteAnswer(answerId: string, questionId: string): Promise<boolean> {
    try {
      const response = await api.delete(`/questions/${questionId}/answers/${answerId}`);
      return response.data.success || false;
    } catch (error) {
      console.error('Cevap silinirken hata:', error);
      throw error;
    }
  }

  // Cevap beğen
  async likeAnswer(answerId: string, questionId: string): Promise<boolean> {
    try {
      const response = await api.get(`/questions/${questionId}/answers/${answerId}/like`);
      return response.data.success || false;
    } catch (error) {
      console.error('Cevap beğenilirken hata:', error);
      throw error;
    }
  }

  // Cevap beğeniyi geri al
  async unlikeAnswer(answerId: string, questionId: string): Promise<boolean> {
    try {
      const response = await api.get(`/questions/${questionId}/answers/${answerId}/undo_like`);
      return response.data.success || false;
    } catch (error) {
      console.error('Cevap beğenisi geri alınırken hata:', error);
      throw error;
    }
  }
}

export const answerService = new AnswerService();
