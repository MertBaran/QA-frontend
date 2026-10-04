import api from './api';
import { transformQuestionData } from './questionService';
import { transformAnswerData } from './answerService';
import type { QuestionData } from '../types/question';
import type { AnswerData } from '../types/answer';
import type {
  QueryEntity,
  QueryFieldDef,
  QueryMatchExplanation,
  QueryNode,
  QueryPagination,
} from '../types/query';

type ApiOk<T> = { success: boolean; data: T };

class QueryService {
  async getFields(entity: QueryEntity): Promise<QueryFieldDef[]> {
    const res = await api.get<ApiOk<{ fields: QueryFieldDef[] }>>('/query/fields', {
      params: { entity },
    });
    if (res.data.success && res.data.data?.fields) {
      return res.data.data.fields;
    }
    return [];
  }

  async execute(params: {
    entity: QueryEntity;
    root: QueryNode;
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    data: unknown[];
    explanations: Record<string, QueryMatchExplanation[]>;
    pagination: QueryPagination;
  }> {
    const res = await api.post<
      ApiOk<{
        data: unknown[];
        explanations?: Record<string, QueryMatchExplanation[]>;
        pagination: QueryPagination;
      }>
    >('/query/execute', {
      entity: params.entity,
      root: params.root,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      sortBy: 'createdAt',
      sortOrder: params.sortOrder ?? 'desc',
    });
    if (!res.data.success || !res.data.data) {
      return {
        data: [],
        explanations: {},
        pagination: {
          page: 1,
          limit: params.limit ?? 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    const raw = res.data.data.data || [];
    let data: unknown[] = raw;
    if (params.entity === 'question') {
      data = (raw as QuestionData[]).map(transformQuestionData);
    } else if (params.entity === 'answer') {
      data = (raw as AnswerData[]).map(transformAnswerData);
    }

    return {
      data,
      explanations: res.data.data.explanations || {},
      pagination: res.data.data.pagination,
    };
  }
}

export const queryService = new QueryService();
