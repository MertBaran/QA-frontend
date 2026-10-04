export type BookmarkTargetType =
  | 'question'
  | 'answer'
  | 'note'
  | 'article'
  | 'comment'
  | 'query';

export interface BookmarkTargetData {
  title: string;
  content: string;
  author?: string;
  authorId?: string;
  created_at: string;
  url?: string;
}

export type QueryBookmarkPayload = {
  version: 1;
  rows: Array<{
    id: string;
    entity: 'question' | 'answer';
    combinator: 'AND' | 'OR';
    indent: number;
    field: string;
    op: string;
    value?: unknown;
    selected?: boolean;
  }>;
  dateSort: 'newest' | 'oldest';
};

export interface AddBookmarkRequest {
  targetType: BookmarkTargetType;
  targetId?: string;
  targetData: BookmarkTargetData;
  payload?: QueryBookmarkPayload;
  tags?: string[];
  notes?: string;
  isPublic?: boolean;
}

export interface UpdateBookmarkRequest {
  tags?: string[];
  notes?: string;
  isPublic?: boolean;
  targetData?: {
    title?: string;
    content?: string;
    url?: string;
  };
  payload?: QueryBookmarkPayload;
}

export interface BookmarkResponse {
  _id: string;
  user_id: string;
  target_type: BookmarkTargetType;
  target_id: string;
  target_data: BookmarkTargetData;
  payload?: QueryBookmarkPayload | null;
  tags?: string[];
  notes?: string;
  is_public: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Bookmark in a collection - includes addedAt when fetched from collection items */
export interface BookmarkCollectionItemResponse extends BookmarkResponse {
  addedAt?: string;
}
