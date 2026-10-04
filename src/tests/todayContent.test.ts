jest.mock('axios', () => {
  const instance = {
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };
  return { __esModule: true, default: { create: () => instance, ...instance } };
});

import answerReducer from '../store/answers/answerSlice';
import messagingReducer, {
  requestMessageCompose,
  setActiveConversation,
} from '../store/messaging/messagingSlice';
import { deleteAnswer } from '../store/answers/answerThunks';
import { fetchConversations } from '../store/messaging/messagingThunks';
import { filledMetadata, filledReferences } from '../utils/filledEntries';
import { t } from '../utils/translations';
import type { Answer } from '../types/answer';
import type { ConversationListItem } from '../services/messageService';

const answer: Answer = {
  id: 'a1',
  content: 'selam',
  author: { id: 'u1', name: 'Ada', avatar: '' },
  likesCount: 1,
  likedByUsers: ['u2'],
  dislikesCount: 0,
  dislikedByUsers: [],
  createdAt: '2026-10-04T00:00:00.000Z',
  timeAgo: 'az önce',
  references: [{ type: 'link', content: 'https://example.com', description: 'kaynak' }],
  metadata: [{ key: 'konu', value: 'test' }],
  attachments: [{ key: 'file-1', size: 12 }],
};

const conversation = (
  id: string,
  unreadCount: number
): ConversationListItem => ({
  id,
  updatedAt: '2026-10-04T00:00:00.000Z',
  otherUser: { id: `user-${id}`, name: 'Ada', profile_image: '' },
  lastMessage: null,
  unreadCount,
});

describe('today content rules', () => {
  it('keeps only references and metadata that have values', () => {
    expect(filledReferences([
      { type: 'link', content: '  ', description: 'boş' },
      { type: 'link', content: 'https://example.com', description: 'dolu' },
    ])).toEqual([{ type: 'link', content: 'https://example.com', description: 'dolu' }]);
    expect(filledMetadata([
      { key: 'konu', value: '' },
      { key: '', value: 'değer' },
      { key: 'konu', value: 'test' },
    ])).toEqual([{ key: 'konu', value: 'test' }]);
  });

  it('turns a deleted answer into a tombstone without removing it from the list', () => {
    const next = answerReducer(
      {
        answers: [answer],
        currentAnswer: null,
        loading: true,
        error: null,
        totalAnswers: 2,
        currentPage: 1,
        answersPerPage: 10,
      },
      deleteAnswer.fulfilled(true, 'request', { answerId: 'a1', questionId: 'q1' })
    );
    expect(next.answers).toHaveLength(1);
    expect(next.totalAnswers).toBe(2);
    expect(next.answers[0]).toMatchObject({
      deleted: true,
      content: '',
      references: [],
      metadata: [],
      attachments: [],
      likesCount: 1,
    });
  });

  it('clears unread only for the conversation that is already open', () => {
    const opened = messagingReducer(undefined, setActiveConversation('open-chat'));
    const refreshed = messagingReducer(
      opened,
      fetchConversations.fulfilled(
        [conversation('open-chat', 4), conversation('other-chat', 2)],
        'request',
        undefined
      )
    );
    expect(refreshed.conversations.find(item => item.id === 'open-chat')?.unreadCount).toBe(0);
    expect(refreshed.conversations.find(item => item.id === 'other-chat')?.unreadCount).toBe(2);
  });

  it('stores a comment mention on the compose request', () => {
    const next = messagingReducer(
      undefined,
      requestMessageCompose({
        recipient: { id: 'u2', name: 'Mert' },
        questionId: 'q1',
        commentId: 'c1',
      })
    );
    expect(next.pendingCompose).toMatchObject({
      recipient: { id: 'u2', name: 'Mert' },
      questionId: 'q1',
      commentId: 'c1',
    });
  });

  it('uses the labels added for deleted content and related questions', () => {
    expect(t('related_questions', 'tr')).toBe('Hakkında sorulan sorular');
    expect(t('related_questions', 'en')).toBe('Questions about this');
    expect(t('answer_deleted', 'tr')).toBe('Cevap silindi');
    expect(t('comment_deleted', 'de')).toBe('Kommentar gelöscht');
    expect(t('send_message', 'tr')).toBe('Mesaj gönder');
  });
});
