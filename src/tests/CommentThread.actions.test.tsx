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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import CommentThread from '../components/comment/CommentThread';
import messagingReducer from '../store/messaging/messagingSlice';
import type { CommentItem } from '../types/comment';

jest.mock('../components/ui/ProfileAvatar', () => (props: { fallbackName?: string }) => (
  <span>{props.fallbackName}</span>
));

const comment = (
  overrides: Partial<CommentItem> & Pick<CommentItem, 'id' | 'userId' | 'body'>
): CommentItem => ({
  authorName: 'Mert',
  targetType: 'answer',
  targetId: 'a1',
  likes: [],
  dislikes: [],
  createdAt: '2026-10-04T00:00:00.000Z',
  updatedAt: '2026-10-04T00:00:00.000Z',
  ...overrides,
});

function renderThread(comments: CommentItem[], currentUserId = 'me') {
  const store = configureStore({ reducer: { messaging: messagingReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <CommentThread
          comments={comments}
          currentUserId={currentUserId}
          currentLanguage="en"
          questionId="q1"
          composeMode="line"
          listMode="feed"
          onCreate={jest.fn()}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
          onReact={jest.fn()}
        />
      </MemoryRouter>
    </Provider>
  );
  return store;
}

describe('CommentThread actions', () => {
  it('puts the reply button before like and dislike', () => {
    renderThread([comment({ id: 'c1', userId: 'other', body: 'selam' })]);
    const reply = screen.getByRole('button', { name: 'Comment' });
    const like = screen.getByRole('button', { name: 'Like' });
    expect(reply.compareDocumentPosition(like) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps a reply under a deleted comment and leaves that comment out of the count', () => {
    renderThread([
      comment({ id: 'parent', userId: 'other', body: '', deleted: true }),
      comment({ id: 'child', userId: 'other', body: 'altta kalan', parentId: 'parent' }),
    ]);
    expect(screen.getByText('Comment deleted')).toBeInTheDocument();
    expect(screen.getByText('altta kalan')).toBeInTheDocument();
    expect(screen.getByText('Comments (1)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('hides messaging on your own comment and opens a comment mention for someone else', async () => {
    const store = renderThread([
      comment({ id: 'mine', userId: 'me', body: 'benim' }),
      comment({ id: 'theirs', userId: 'other', body: 'onun', authorName: 'Ada' }),
    ]);
    const messageButtons = screen.getAllByRole('button', { name: 'Send message' });
    expect(messageButtons).toHaveLength(1);
    await userEvent.click(messageButtons[0]);
    expect(store.getState().messaging.pendingCompose).toMatchObject({
      recipient: { id: 'other', name: 'Ada' },
      questionId: 'q1',
      commentId: 'theirs',
    });
  });

  it('marks a comment edited only when its text was changed', () => {
    renderThread([
      comment({
        id: 'liked',
        userId: 'other',
        body: 'beğenildi',
        updatedAt: '2026-10-04T03:00:00.000Z',
      }),
      comment({
        id: 'changed',
        userId: 'other',
        body: 'değişti',
        updatedAt: '2026-10-04T03:00:00.000Z',
        editedAt: '2026-10-04T03:00:00.000Z',
      }),
    ]);
    expect(screen.getAllByText(/edited/)).toHaveLength(1);
  });

  it('opens and highlights the comment targeted by the hash', async () => {
    window.history.replaceState(null, '', '/#comment-child');
    renderThread([
      comment({ id: 'parent', userId: 'other', body: 'üst', createdAt: '2026-10-04T00:00:00.000Z' }),
      comment({
        id: 'child',
        userId: 'other',
        body: 'hedef yorum',
        parentId: 'parent',
        createdAt: '2026-10-04T01:00:00.000Z',
      }),
    ]);
    await waitFor(() => {
      expect(document.querySelector('[data-highlighted="true"]')).toBeTruthy();
    });
    expect(screen.getByText('hedef yorum')).toBeInTheDocument();
    window.history.replaceState(null, '', '/');
  });
});
