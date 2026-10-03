import api from './api';
import type {
  CreateQuestionFeatureTemplatePayload,
  QuestionFeatureTemplate,
  UpdateQuestionFeatureTemplatePayload,
} from '../types/questionFeatureTemplate';

interface ApiOk<T> {
  success: boolean;
  data: T;
}

class QuestionFeatureTemplateService {
  async list(): Promise<QuestionFeatureTemplate[]> {
    const res = await api.get<ApiOk<QuestionFeatureTemplate[]>>('/question-feature-templates');
    if (res.data.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  }

  async getById(id: string): Promise<QuestionFeatureTemplate | null> {
    const res = await api.get<ApiOk<QuestionFeatureTemplate>>(`/question-feature-templates/${id}`);
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    return null;
  }

  async create(body: CreateQuestionFeatureTemplatePayload): Promise<QuestionFeatureTemplate | null> {
    const res = await api.post<ApiOk<QuestionFeatureTemplate>>('/question-feature-templates', body);
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    return null;
  }

  async update(
    id: string,
    body: UpdateQuestionFeatureTemplatePayload,
  ): Promise<QuestionFeatureTemplate | null> {
    const res = await api.patch<ApiOk<QuestionFeatureTemplate>>(
      `/question-feature-templates/${id}`,
      body,
    );
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    return null;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/question-feature-templates/${id}`);
  }
}

export const questionFeatureTemplateService = new QuestionFeatureTemplateService();
