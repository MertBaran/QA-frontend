export type BookmarkTargetType = 'question' | 'answer' | 'note' | 'article' | 'comment';

export interface BookmarkTargetData {
  title: string;
  content: string;
  author?: string;
  authorId?: string;
  created_at: string;
  url?: string;
}

export interface AddBookmarkRequest {
  targetType: BookmarkTargetType;
  targetId: string;
  targetData: BookmarkTargetData;
  tags?: string[];
  notes?: string;
  isPublic?: boolean;
}

export interface BookmarkResponse {
  _id: string;
  user_id: string;
  target_type: BookmarkTargetType;
  target_id: string;
  target_data: BookmarkTargetData;
  tags?: string[];
  notes?: string;
  is_public: boolean;
  createdAt: string;
  updatedAt: string;
}
