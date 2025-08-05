import { ApiResponse } from './api';
import { UserData } from './question';

// Backend'den gelecek ham cevap tipi
export interface AnswerData {
  _id: string;
  content: string;
  user: UserData;
  userInfo?: {
    _id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
  question: string;
  likes: string[];
  createdAt: string;
  __v?: number;
}

// Frontend'de kullanılacak dönüştürülmüş cevap tipi
export interface Answer {
  id: string;
  content: string;
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
  likes: number;
  createdAt: string;
  timeAgo: string;
}

// Cevap oluşturma için tip
export interface CreateAnswerData {
  content: string;
}

// Cevap güncelleme için tip
export interface UpdateAnswerData {
  content: string;
}

// API Response tipleri
export interface AnswersResponse extends ApiResponse<AnswerData[]> {}
export interface AnswerResponse extends ApiResponse<AnswerData> {}
