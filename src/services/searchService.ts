import api from './api';
import { Question, QuestionData } from '../types/question';
import { Answer, AnswerData } from '../types/answer';
import { transformQuestionData } from './questionService';
import { transformAnswerData } from './answerService';

export interface SearchResult {
  questions: Question[];
  answers: Answer[];
  questionsPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  answersPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  warnings?: {
    semanticSearchUnavailable?: boolean;
  };
}

class SearchService {
  // Sorularda arama
  async searchQuestions(
    searchTerm: string,
    page: number = 1,
    limit: number = 10,
    searchMode: 'phrase' | 'all_words' | 'any_word' = 'any_word',
    matchType: 'fuzzy' | 'exact' = 'fuzzy',
    typoTolerance: 'low' | 'medium' | 'high' = 'medium',
    smartSearch: boolean = false,
    smartOptions?: { linguistic?: boolean; semantic?: boolean },
    excludeQuestionIds?: string[],
    language?: string,
  ): Promise<{
    questions: Question[];
    pagination: any;
    warnings?: { semanticSearchUnavailable?: boolean };
  }> {
    try {
      const params: any = {
        q: searchTerm,
        page,
        limit,
      };

      if (searchMode !== 'any_word') {
        params.searchMode = searchMode;
      }
      if (matchType !== 'fuzzy') {
        params.matchType = matchType;
      }
      if (matchType === 'fuzzy' && typoTolerance !== 'medium') {
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
      const response = await api.get<{
        success: boolean;
        data: {
          data: QuestionData[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
          };
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
        pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        warnings: undefined,
      };
    } catch (error) {
      console.error('Sorularda arama yapılırken hata:', error);
      return {
        questions: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        warnings: undefined,
      };
    }
  }

  // Cevaplarda arama
  async searchAnswers(
    searchTerm: string,
    page: number = 1,
    limit: number = 10,
    searchMode: 'phrase' | 'all_words' | 'any_word' = 'any_word',
    matchType: 'fuzzy' | 'exact' = 'fuzzy',
    typoTolerance: 'low' | 'medium' | 'high' = 'medium',
    smartSearch: boolean = false,
    smartOptions?: { linguistic?: boolean; semantic?: boolean },
    language?: string,
  ): Promise<{
    answers: Answer[];
    pagination: any;
    warnings?: { semanticSearchUnavailable?: boolean };
  }> {
    try {
      const params: any = {
        q: searchTerm,
        page,
        limit,
      };

      if (searchMode !== 'any_word') {
        params.searchMode = searchMode;
      }
      if (matchType !== 'fuzzy') {
        params.matchType = matchType;
      }
      if (matchType === 'fuzzy' && typoTolerance !== 'medium') {
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
      const response = await api.get<{
        success: boolean;
        data: {
          data: AnswerData[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
          };
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
        pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        warnings: undefined,
      };
    } catch (error: any) {
      console.error('Cevaplarda arama yapılırken hata:', error);
      // Hata detaylarını logla
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('Request error:', error.request);
      } else {
        console.error('Error:', error.message);
      }
      return {
        answers: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        warnings: undefined,
      };
    }
  }

  // Hem sorular hem cevaplarda arama (her zaman cevapları dahil eder)
  async searchAll(
    searchTerm: string,
    questionsPage: number = 1,
    questionsLimit: number = 10,
    answersPage: number = 1,
    answersLimit: number = 10,
    searchMode: 'phrase' | 'all_words' | 'any_word' = 'any_word',
    matchType: 'fuzzy' | 'exact' = 'fuzzy',
    typoTolerance: 'low' | 'medium' | 'high' = 'medium',
    smartSearch: boolean = false,
    smartOptions?: { linguistic?: boolean; semantic?: boolean },
    language?: string,
  ): Promise<SearchResult> {
    // Önce cevaplarda arama yap
      const answersResult = await this.searchAnswers(
        searchTerm,
        answersPage,
        answersLimit,
        searchMode,
        matchType,
        typoTolerance,
        smartSearch,
        smartOptions,
        language,
      );

    // Sorularda arama yap (cevaplarda geçen soru ID'lerini çıkarmadan)
    const questionsResult = await this.searchQuestions(
      searchTerm,
      questionsPage,
      questionsLimit,
      searchMode,
      matchType,
      typoTolerance,
      smartSearch,
      smartOptions,
      undefined, // excludeQuestionIds kaldırıldı - aynı soru hem soru hem cevap sonuçlarında görünebilir
      language,
    );

    // Warnings'i birleştir (questions veya answers'da semantic search kullanılamadıysa)
    const warnings = questionsResult.warnings || answersResult.warnings;

    return {
      questions: questionsResult.questions,
      answers: answersResult.answers,
      questionsPagination: questionsResult.pagination,
      answersPagination: answersResult.pagination,
      warnings,
    };
  }
}

export const searchService = new SearchService();
