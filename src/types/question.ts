import { ApiResponse } from './api';

// Backend'den gelecek ham soru tipi
export interface QuestionData {
  _id: string;
  title: string;
  content: string;
  slug: string;
  createdAt: string;
  user: UserData;
  userInfo?: {
    _id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
  likes: string[];
  answers: string[];
  __v?: number;
}

// Backend'den gelecek ham kullanıcı tipi
export interface UserData {
  _id: string;
  name: string;
  email: string;
  profile_image: string;
  title?: string;
  about?: string;
  place?: string;
  website?: string;
  blocked: boolean;
  createdAt: string;
  language?: string;
}

// Frontend'de kullanılacak dönüştürülmüş soru tipi
export interface Question {
  id: string;
  title: string;
  content: string;
  slug: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    title?: string;
  };
  userInfo?: {
    _id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
  tags: string[];
  likes: number;
  answers: number;
  views: number;
  timeAgo: string;
  isTrending: boolean;
  category: string;
  createdAt: string;
}

// Soru oluşturma için tip
export interface CreateQuestionData {
  title: string;
  content: string;
}

// Soru güncelleme için tip
export interface UpdateQuestionData {
  title?: string;
  content?: string;
}

// API Response tipleri
export interface QuestionsResponse extends ApiResponse<QuestionData[]> {}
export interface QuestionResponse extends ApiResponse<QuestionData> {}

// Filtreleme tipleri
export interface QuestionFilters {
  search: string;
  category: string;
  tags: string;
  sortBy: string;
}

// Sıralama seçenekleri
export const sortOptions = ['En Yeni', 'En Popüler', 'En Çok Görüntülenen', 'En Çok Cevaplanan'];

// Kategoriler
export const categories = ['Frontend', 'Backend', 'Mobile', 'DevOps', 'Database', 'AI/ML'];
