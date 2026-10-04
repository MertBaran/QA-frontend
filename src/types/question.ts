import { ApiResponse } from './api';
import type { FeatureTableRow } from './questionFeatureTemplate';

export interface QuestionThumbnail {
  key: string;
  url?: string;
}

// Parent content bilgisi
export interface ParentContentInfo {
  id: string;
  type: 'question' | 'answer';
  // Question ise
  summary?: string;
  slug?: string;
  // Answer ise
  questionId?: string;
  questionSummary?: string;
  questionSlug?: string;
  // Common fields
  user?: string;
  userInfo?: {
    _id: string;
    name: string;
    email: string;
    profile_image?: string;
  };
}

// Parent referansı
export interface ParentReference {
  id: string;
  type: 'question' | 'answer';
}

// Ancestor referansı (depth ile)
export interface AncestorReference {
  id: string;
  type: 'question' | 'answer';
  depth: number;
}

// Backend'den gelecek ham soru tipi
export interface QuestionData {
  _id: string;
  summary: string;
  detail: string;
  slug: string;
  createdAt: string;
  user: UserData | string;
  userInfo?: {
    _id: string;
    name: string;
    email: string;
    profile_image?: string;
    title?: string;
  };
  likes: string[];
  dislikes: string[];
  answers: string[];
  commentCount?: number;
  parent?: ParentReference;
  ancestors?: AncestorReference[];
  parentContentInfo?: ParentContentInfo;
  category?: string;
  tags?: string[];
  thumbnail?: QuestionThumbnail | null;
  visibility?: boolean;
  format?: string;
  interest?: string;
  focus?: number;
  references?: { type: string; content: string; description: string }[];
  metadata?: { key: string; value: string }[];
  attachments?: { key: string; description?: string }[];
  __v?: number;
  featureTemplateId?: string;
  featureTemplateVersionId?: string;
  featureFieldValues?: Record<string, unknown>;
}

// Backend'den gelecek ham kullanıcı tipi
export interface UserData {
  _id: string;
  name: string;
  email: string;
  profile_image?: string;
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
  summary: string;
  detail: string;
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
  likesCount: number;
  likedByUsers: string[];
  dislikesCount: number;
  dislikedByUsers: string[];
  answers: number;
  commentCount?: number;
  timeAgo: string;
  isTrending: boolean;
  category: string;
  createdAt: string;
  parentQuestionId?: string;
  parentAnswerId?: string;
  parentId?: string;
  parentType?: 'question' | 'answer';
  ancestors?: AncestorReference[];
  parentContentInfo?: ParentContentInfo;
  thumbnail?: QuestionThumbnail | null;
  visibility?: boolean;
  format?: string;
  interest?: string;
  focus?: number;
  references?: QuestionReference[];
  metadata?: QuestionMetadataItem[];
  attachments?: QuestionAttachment[];
  featureTemplateId?: string;
  featureTemplateVersionId?: string;
  featureFieldValues?: Record<string, unknown>;
}

// Referans ve metadata tipleri
export type QuestionReferenceType = 'link' | 'soru' | 'cevap' | 'yorum' | 'dosya';

export interface QuestionReference {
  type: QuestionReferenceType;
  content: string;
  description: string;
}

export interface QuestionMetadataItem {
  key: string;
  value: string;
}

export interface QuestionAttachment {
  key: string;
  description?: string;
  size?: number;
}

// Soru oluşturma için tip
export interface CreateQuestionData {
  summary: string;
  detail: string;
  category?: string;
  tags?: string[];
  parent?: ParentReference;
  thumbnailKey?: string;
  visibility?: boolean;
  format?: string;
  interest?: string;
  focus?: number;
  references?: QuestionReference[];
  metadata?: QuestionMetadataItem[];
  attachments?: QuestionAttachment[];
  featureTemplateId?: string;
  featureFieldValues?: Record<string, string | number | null | string[] | FeatureTableRow[]>;
}

// Soru güncelleme için tip
export interface UpdateQuestionData {
  summary?: string;
  detail?: string;
  category?: string;
  tags?: string[];
  thumbnailKey?: string;
  removeThumbnail?: boolean;
  references?: QuestionReference[];
  metadata?: QuestionMetadataItem[];
  attachments?: QuestionAttachment[];
  featureTemplateId?: string;
  featureFieldValues?: Record<string, string | number | null | string[] | FeatureTableRow[]>;
  focus?: number | null;
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
