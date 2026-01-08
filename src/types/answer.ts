import { ApiResponse } from './api';
import { UserData, ParentContentInfo, AncestorReference } from './question';

// Backend'den gelecek ham cevap tipi
export interface AnswerData {
  _id: string;
  content: string;
  user: UserData | string;
  userInfo?: {
    _id: string;
    name: string;
    email: string;
    profile_image?: string;
    title?: string;
  };
  question: string;
  questionInfo?: {
    _id: string;
    title?: string;
    slug?: string;
  };
  likes: string[];
  dislikes: string[];
  createdAt: string;
  parent?: {
    id: string;
    type: 'question' | 'answer';
  };
  ancestors?: AncestorReference[];
  parentContentInfo?: ParentContentInfo;
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
  likesCount: number;
  likedByUsers: string[];
  dislikesCount: number;
  dislikedByUsers: string[];
  createdAt: string;
  timeAgo: string;
  questionId?: string;
  questionTitle?: string;
  parentId?: string;
  parentType?: 'question' | 'answer';
  ancestors?: AncestorReference[];
  parentContentInfo?: ParentContentInfo;
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
