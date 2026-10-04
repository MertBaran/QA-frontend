import api from './api';

export type ContentAssetType =
  | 'question-thumbnail'
  | 'question-attachment'
  | 'answer-attachment'
  | 'user-profile-avatar'
  | 'user-profile-background'
  | 'bookmark-collection-cover'
  | 'message-voice';

export type ContentAssetVisibility = 'public' | 'private';

const BASE_PATH = 'content-assets';

export interface CreatePresignedAssetUploadRequest {
  type: ContentAssetType;
  filename: string;
  mimeType?: string;
  contentLength?: number;
  ownerId?: string;
  entityId?: string;
  visibility?: ContentAssetVisibility;
  expiresInSeconds?: number;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  expiresInSeconds: number;
  headers: Record<string, string>;
  key: string;
}

export interface ResolveAssetUrlRequest {
  key: string;
  type: ContentAssetType;
  ownerId?: string;
  entityId?: string;
  visibility?: ContentAssetVisibility;
  presignedUrl?: boolean;
  expiresInSeconds?: number;
  download?: boolean;
  responseContentType?: string;
  responseDispositionFilename?: string;
}

export interface DeleteAssetRequest {
  key: string;
  type: ContentAssetType;
  ownerId?: string;
  entityId?: string;
}

export interface DownloadAssetRequest {
  key: string;
  type: ContentAssetType;
  ownerId?: string;
  entityId?: string;
  filename?: string;
}

class ContentAssetService {
  async createPresignedUpload(
    payload: CreatePresignedAssetUploadRequest,
  ): Promise<PresignedUploadResult> {
    const response = await api.post<{ success: boolean; data: PresignedUploadResult }>(
      `${BASE_PATH}/presigned-upload`,
      payload,
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Presigned URL alınamadı');
    }

    return response.data.data;
  }

  async resolveAssetUrl(payload: ResolveAssetUrlRequest): Promise<string> {
    const response = await api.post<{ success: boolean; data: { url: string } }>(
      `${BASE_PATH}/resolve-url`,
      payload,
    );

    if (!response.data.success || !response.data.data?.url) {
      throw new Error('Asset URL çözümlenemedi');
    }

    return response.data.data.url;
  }

  async deleteAsset(payload: DeleteAssetRequest): Promise<void> {
    await api.delete(`${BASE_PATH}/`, { data: payload });
  }

  async downloadAsset(payload: DownloadAssetRequest): Promise<Blob> {
    const params = new URLSearchParams();
    params.set('key', payload.key);
    params.set('type', payload.type);
    if (payload.ownerId) params.set('ownerId', payload.ownerId);
    if (payload.entityId) params.set('entityId', payload.entityId);
    if (payload.filename) params.set('filename', payload.filename);
    const response = await api.get(`${BASE_PATH}/download?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  }
}

export const contentAssetService = new ContentAssetService();

export async function uploadFileToPresignedUrl(
  presigned: PresignedUploadResult,
  file: File,
): Promise<void> {
  const headers = new Headers();

  Object.entries(presigned.headers || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      headers.append(key, value);
    }
  });

  // Note: We don't add Content-Type header because it's not in the signed headers.
  // AWS SDK's getSignedUrl doesn't include ContentType in the signature for presigned URLs.
  // Adding it would cause a signature mismatch (403 Forbidden).

  const response = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    headers,
    body: file,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Dosya yüklenemedi: ${response.status} ${text}`);
  }
}
