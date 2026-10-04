export type CommentTargetType = 'question' | 'answer';

export interface CommentItem {
  id: string;
  body: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  targetType: CommentTargetType;
  targetId: string;
  parentId?: string | null;
  likes?: string[];
  dislikes?: string[];
  deleted?: boolean;
  editedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  questionId?: string;
}
