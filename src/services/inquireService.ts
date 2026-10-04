import api from './api';
import type {
  InquireContentRef,
  InquireContentType,
  InquireGraphResponse,
} from '../types/inquire';

type ApiOk<T> = { success: boolean; data: T };

class InquireService {
  async findPath(
    from: InquireContentRef,
    to: InquireContentRef
  ): Promise<InquireGraphResponse> {
    const res = await api.post<ApiOk<InquireGraphResponse>>('/inquire/path', {
      from: { id: from.id, contentType: from.contentType },
      to: { id: to.id, contentType: to.contentType },
    });
    if (!res.data.success || !res.data.data) {
      return { paths: [], nodes: [], edges: [] };
    }
    return res.data.data;
  }

  async getNeighbors(
    contentType: InquireContentType,
    id: string,
    depth = 1
  ): Promise<InquireGraphResponse> {
    const res = await api.get<ApiOk<InquireGraphResponse>>(
      `/inquire/neighbors/${contentType}/${id}`,
      { params: { depth } }
    );
    if (!res.data.success || !res.data.data) {
      return { paths: [], nodes: [], edges: [] };
    }
    return res.data.data;
  }
}

export const inquireService = new InquireService();
