import api from './api';
import { Question, QuestionData } from '../types/question';
import { Answer, AnswerData } from '../types/answer';
import { transformQuestionData } from './questionService';
import { transformAnswerData } from './answerService';

export interface SearchUserHit {
  id: string;
  name: string;
  profile_image: string;
  title?: string;
  about?: string;
  createdAt?: string;
  questionsCount: number;
  answersCount: number;
}

export interface SearchPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SearchResult {
  questions: Question[];
  answers: Answer[];
  users: SearchUserHit[];
  questionsPagination?: SearchPagination;
  answersPagination?: SearchPagination;
  usersPagination?: SearchPagination;
  warnings?: {
    semanticSearchUnavailable?: boolean;
  };
}

const emptyPagination = (limit: number = 10): SearchPagination => ({
  page: 1,
  limit,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
});

class SearchService {
  // Sorularda arama
  async searchQuestions(
    searchTerm: string,
    page: number = 1,
    limit: number = 10,
    searchMode: 'phrase' | 'all_words' | 'any_word' = 'all_words',
    matchType: 'fuzzy' | 'exact' = 'fuzzy',
    typoTolerance: 'low' | 'medium' | 'high' = 'low',
    smartSearch: boolean = false,
    smartOptions?: { linguistic?: boolean; semantic?: boolean },
    excludeQuestionIds?: string[],
    language?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
    followingOnly: boolean = false,
    category?: string,
    tags?: string,
  ): Promise<{
    questions: Question[];
    pagination: SearchPagination;
    warnings?: { semanticSearchUnavailable?: boolean };
  }> {
    try {
      const params: any = {
        q: searchTerm,
        page,
        limit,
        sortBy: 'date',
        sortOrder,
      };

      if (searchMode !== 'all_words') {
        params.searchMode = searchMode;
      }
      if (matchType !== 'fuzzy') {
        params.matchType = matchType;
      }
      if (matchType === 'fuzzy' && typoTolerance !== 'low') {
        params.typoTolerance = typoTolerance;
      }
      if (smartSearch) {
        params.smartSearch = 'true';
        if (smartOptions) {
          if (smartOptions.linguistic) {
            params.smartLinguistic = 'true';
          }
          if (smartOptions.semantic) {
            params.smartSemantic = 'true';
          }
        }
      }
      if (excludeQuestionIds && excludeQuestionIds.length > 0) {
        params.excludeQuestionIds = excludeQuestionIds;
      }
      if (language) {
        params.language = language;
      }
      if (followingOnly) {
        params.followingOnly = 'true';
      }
      if (category?.trim()) {
        params.category = category.trim();
      }
      if (tags?.trim()) {
        params.tags = tags.trim();
      }
      const response = await api.get<{
        success: boolean;
        data: {
          data: QuestionData[];
          pagination: SearchPagination;
          warnings?: {
            semanticSearchUnavailable?: boolean;
          };
        };
      }>('/questions/search', { params });

      if (response.data.success && response.data.data) {
        return {
          questions: response.data.data.data.map(transformQuestionData),
          pagination: response.data.data.pagination,
          warnings: response.data.data.warnings,
        };
      }
      return {
        questions: [],
        pagination: emptyPagination(limit),
        warnings: undefined,
      };
    } catch (error) {
      console.error('Sorularda arama yapılırken hata:', error);
      throw error;
    }
  }

  // Cevaplarda arama
  async searchAnswers(
    searchTerm: string,
    page: number = 1,
    limit: number = 10,
    searchMode: 'phrase' | 'all_words' | 'any_word' = 'all_words',
    matchType: 'fuzzy' | 'exact' = 'fuzzy',
    typoTolerance: 'low' | 'medium' | 'high' = 'low',
    smartSearch: boolean = false,
    smartOptions?: { linguistic?: boolean; semantic?: boolean },
    language?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
    followingOnly: boolean = false,
  ): Promise<{
    answers: Answer[];
    pagination: SearchPagination;
    warnings?: { semanticSearchUnavailable?: boolean };
  }> {
    try {
      const params: any = {
        q: searchTerm,
        page,
        limit,
        sortBy: 'date',
        sortOrder,
      };

      if (searchMode !== 'all_words') {
        params.searchMode = searchMode;
      }
      if (matchType !== 'fuzzy') {
        params.matchType = matchType;
      }
      if (matchType === 'fuzzy' && typoTolerance !== 'low') {
        params.typoTolerance = typoTolerance;
      }
      if (smartSearch) {
        params.smartSearch = 'true';
        if (smartOptions) {
          if (smartOptions.linguistic) {
            params.smartLinguistic = 'true';
          }
          if (smartOptions.semantic) {
            params.smartSemantic = 'true';
          }
        }
      }
      if (language) {
        params.language = language;
      }
      if (followingOnly) {
        params.followingOnly = 'true';
      }
      const response = await api.get<{
        success: boolean;
        data: {
          data: AnswerData[];
          pagination: SearchPagination;
          warnings?: {
            semanticSearchUnavailable?: boolean;
          };
        };
      }>('/answers/search', { params });

      if (response.data.success && response.data.data) {
        return {
          answers: response.data.data.data.map(transformAnswerData),
          pagination: response.data.data.pagination,
          warnings: response.data.data.warnings,
        };
      }
      return {
        answers: [],
        pagination: emptyPagination(limit),
        warnings: undefined,
      };
    } catch (error: any) {
      console.error('Cevaplarda arama yapılırken hata:', error);
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('Request error:', error.request);
      } else {
        console.error('Error:', error.message);
      }
      throw error;
    }
  }

  // Kullanıcılarda arama (isim)
  async searchUsers(
    searchTerm: string,
    page: number = 1,
    limit: number = 10,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{
    users: SearchUserHit[];
    pagination: SearchPagination;
  }> {
    try {
      const response = await api.get<{
        success: boolean;
        data: {
          data: Array<{
            _id: string;
            name: string;
            profile_image: string;
            title?: string;
            about?: string;
            createdAt?: string;
            questionsCount?: number;
            answersCount?: number;
          }>;
          pagination: SearchPagination;
        };
      }>('/public/users/search', {
        params: { q: searchTerm, page, limit, sortOrder },
      });

      if (response.data.success && response.data.data) {
        return {
          users: response.data.data.data.map(user => ({
            id: user._id,
            name: user.name,
            profile_image: user.profile_image,
            title: user.title,
            about: user.about,
            createdAt: user.createdAt,
            questionsCount: user.questionsCount ?? 0,
            answersCount: user.answersCount ?? 0,
          })),
          pagination: response.data.data.pagination,
        };
      }
      return {
        users: [],
        pagination: emptyPagination(limit),
      };
    } catch (error) {
      console.error('Kullanıcılarda arama yapılırken hata:', error);
      throw error;
    }
  }

  // Sorular + cevaplar + kullanıcılar
  async searchAll(
    searchTerm: string,
    questionsPage: number = 1,
    questionsLimit: number = 10,
    answersPage: number = 1,
    answersLimit: number = 10,
    searchMode: 'phrase' | 'all_words' | 'any_word' = 'all_words',
    matchType: 'fuzzy' | 'exact' = 'fuzzy',
    typoTolerance: 'low' | 'medium' | 'high' = 'low',
    smartSearch: boolean = false,
    smartOptions?: { linguistic?: boolean; semantic?: boolean },
    language?: string,
    usersPage: number = 1,
    usersLimit: number = 10,
    sortOrder: 'asc' | 'desc' = 'desc',
    followingOnly: boolean = false,
    category?: string,
    tags?: string,
  ): Promise<SearchResult> {
    const [answersResult, questionsResult, usersResult] = await Promise.all([
      this.searchAnswers(
        searchTerm,
        answersPage,
        answersLimit,
        searchMode,
        matchType,
        typoTolerance,
        smartSearch,
        smartOptions,
        language,
        sortOrder,
        followingOnly,
      ),
      this.searchQuestions(
        searchTerm,
        questionsPage,
        questionsLimit,
        searchMode,
        matchType,
        typoTolerance,
        smartSearch,
        smartOptions,
        undefined,
        language,
        sortOrder,
        followingOnly,
        category,
        tags,
      ),
      this.searchUsers(searchTerm, usersPage, usersLimit, sortOrder),
    ]);

    const warnings = questionsResult.warnings || answersResult.warnings;

    return {
      questions: questionsResult.questions,
      answers: answersResult.answers,
      users: usersResult.users,
      questionsPagination: questionsResult.pagination,
      answersPagination: answersResult.pagination,
      usersPagination: usersResult.pagination,
      warnings,
    };
  }
}

export const searchService = new SearchService();
