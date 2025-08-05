import api from './api';
import {
  QuestionData,
  Question,
  QuestionsResponse,
  QuestionResponse,
  CreateQuestionData,
  UpdateQuestionData,
  QuestionFilters,
} from '../types/question';

export interface PaginatedQuestionsResponse {
  data: Question[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Backend'den gelen ham veriyi frontend formatına dönüştürme
const transformQuestionData = (questionData: QuestionData): Question => {
  const createdAt = new Date(questionData.createdAt);
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

  // Kategori belirleme (basit bir algoritma)
  const content = questionData.content.toLowerCase();
  let category = 'Genel';

  if (
    content.includes('react') ||
    content.includes('vue') ||
    content.includes('angular') ||
    content.includes('javascript')
  ) {
    category = 'Frontend';
  } else if (
    content.includes('node') ||
    content.includes('express') ||
    content.includes('api') ||
    content.includes('server')
  ) {
    category = 'Backend';
  } else if (
    content.includes('mobile') ||
    content.includes('react native') ||
    content.includes('flutter')
  ) {
    category = 'Mobile';
  } else if (
    content.includes('docker') ||
    content.includes('kubernetes') ||
    content.includes('deploy')
  ) {
    category = 'DevOps';
  } else if (
    content.includes('database') ||
    content.includes('mongodb') ||
    content.includes('sql')
  ) {
    category = 'Database';
  } else if (
    content.includes('ai') ||
    content.includes('machine learning') ||
    content.includes('neural')
  ) {
    category = 'AI/ML';
  }

  // Tag'leri çıkar (basit bir algoritma)
  const tags: string[] = [];
  const commonTags = [
    'react',
    'javascript',
    'typescript',
    'node',
    'express',
    'mongodb',
    'docker',
    'api',
  ];
  commonTags.forEach((tag) => {
    if (content.includes(tag)) {
      tags.push(tag.charAt(0).toUpperCase() + tag.slice(1));
    }
  });

  // Trending hesaplama (basit)
  const isTrending = questionData.likes.length > 5 || questionData.answers.length > 3;

  return {
    id: questionData._id,
    title: questionData.title,
    content: questionData.content,
    slug: questionData.slug,
    author: {
      id: questionData.user._id,
      name: questionData.user.name,
      avatar: questionData.user.profile_image,
      title: questionData.user.title,
    },
    userInfo: questionData.userInfo || {
      _id: questionData.user._id,
      name: questionData.user.name,
      email: questionData.user.email,
      profile_image: questionData.user.profile_image,
    },
    tags,
    likes: questionData.likes.length,
    answers: questionData.answers.length,
    views: Math.floor(Math.random() * 1000) + 50, // Backend'de view sistemi yok, geçici
    timeAgo,
    isTrending,
    category,
    createdAt: questionData.createdAt,
  };
};

class QuestionService {
  // Tüm soruları getir (legacy)
  async getAllQuestions(): Promise<Question[]> {
    try {
      const response = await api.get<QuestionsResponse>('/questions');
      if (response.data.success && response.data.data) {
        return response.data.data.map(transformQuestionData);
      }
      return [];
    } catch (error) {
      console.error('Sorular getirilirken hata:', error);
      return [];
    }
  }

  // Paginated soruları getir
  async getQuestionsPaginated(params: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    category?: string;
    tags?: string;
  }): Promise<PaginatedQuestionsResponse> {
    try {
      const response = await api.get<{
        success: boolean;
        data: {
          data: QuestionData[];
          pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
          };
        };
      }>('/questions/paginated', { params });

      if (response.data.success && response.data.data) {
        return {
          data: response.data.data.data.map(transformQuestionData),
          pagination: response.data.data.pagination,
        };
      }

      return {
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    } catch (error) {
      console.error('Paginated sorular getirilirken hata:', error);
      return {
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }
  }

  // Tek soru getir
  async getQuestionById(id: string): Promise<Question | null> {
    try {
      const response = await api.get<QuestionResponse>(`/questions/${id}`);
      if (response.data.success && response.data.data) {
        return transformQuestionData(response.data.data);
      }
      return null;
    } catch (error) {
      console.error('Soru getirilirken hata:', error);
      return null;
    }
  }

  // Soru oluştur
  async createQuestion(questionData: CreateQuestionData): Promise<Question | null> {
    try {
      const response = await api.post<QuestionResponse>('/questions/ask', questionData);
      if (response.data.success && response.data.data) {
        return transformQuestionData(response.data.data);
      }
      return null;
    } catch (error) {
      console.error('Soru oluşturulurken hata:', error);
      throw error;
    }
  }

  // Soru güncelle
  async updateQuestion(id: string, questionData: UpdateQuestionData): Promise<Question | null> {
    try {
      const response = await api.put<QuestionResponse>(`/questions/${id}/edit`, questionData);
      if (response.data.success && response.data.data) {
        return transformQuestionData(response.data.data);
      }
      return null;
    } catch (error) {
      console.error('Soru güncellenirken hata:', error);
      throw error;
    }
  }

  // Soru sil
  async deleteQuestion(id: string): Promise<boolean> {
    try {
      const response = await api.delete(`/questions/${id}/delete`);
      return response.data.success || false;
    } catch (error) {
      console.error('Soru silinirken hata:', error);
      throw error;
    }
  }

  // Soru beğen
  async likeQuestion(id: string): Promise<boolean> {
    try {
      const response = await api.get(`/questions/${id}/like`);
      return response.data.success || false;
    } catch (error) {
      console.error('Soru beğenilirken hata:', error);
      throw error;
    }
  }

  // Soru beğeniyi geri al
  async unlikeQuestion(id: string): Promise<boolean> {
    try {
      const response = await api.get(`/questions/${id}/undo_like`);
      return response.data.success || false;
    } catch (error) {
      console.error('Soru beğenisi geri alınırken hata:', error);
      throw error;
    }
  }

  // Soruları filtrele (frontend'de)
  filterQuestions(questions: Question[], filters: QuestionFilters): Question[] {
    let filtered = [...questions];

    // Arama filtresi
    if (filters.search) {
      filtered = filtered.filter(
        (question) =>
          question.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          question.content.toLowerCase().includes(filters.search.toLowerCase()) ||
          question.tags.some((tag) => tag.toLowerCase().includes(filters.search.toLowerCase())),
      );
    }

    // Kategori filtresi
    if (filters.category) {
      filtered = filtered.filter((question) => question.category === filters.category);
    }

    // Tag filtresi
    if (filters.tags) {
      filtered = filtered.filter((question) =>
        question.tags.some((tag) => tag.toLowerCase().includes(filters.tags.toLowerCase())),
      );
    }

    // Sıralama
    switch (filters.sortBy) {
      case 'En Yeni':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'En Popüler':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'En Çok Görüntülenen':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'En Çok Cevaplanan':
        filtered.sort((a, b) => b.answers - a.answers);
        break;
      default:
        break;
    }

    return filtered;
  }
}

export const questionService = new QuestionService();
