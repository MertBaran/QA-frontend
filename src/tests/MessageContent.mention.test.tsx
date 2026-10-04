import { render, screen, waitFor } from '@testing-library/react';
import MessageContent from '../components/messaging/MessageContent';
import { questionService } from '../services/questionService';
import { answerService } from '../services/answerService';
import { commentService } from '../services/commentService';

jest.mock('../services/questionService', () => ({
  questionService: { getQuestionById: jest.fn() },
}));
jest.mock('../services/answerService', () => ({
  answerService: { getAnswerByQuestionAndId: jest.fn() },
}));
jest.mock('../services/commentService', () => ({
  commentService: { listForQuestion: jest.fn() },
}));
jest.mock('../services/contentAssetService', () => ({
  contentAssetService: { resolveUrl: jest.fn() },
}));

const questionServiceMock = questionService as jest.Mocked<typeof questionService>;
const answerServiceMock = answerService as jest.Mocked<typeof answerService>;
const commentServiceMock = commentService as jest.Mocked<typeof commentService>;

describe('MessageContent mentions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('strips the blank lines between a platform mention and the typed text', async () => {
    commentServiceMock.listForQuestion.mockResolvedValue([
      {
        id: 'c1',
        body: 'selam',
        userId: 'u1',
        authorName: 'Mert',
        targetType: 'answer',
        targetId: 'a1',
        createdAt: '2026-10-04T00:00:00.000Z',
        updatedAt: '2026-10-04T00:00:00.000Z',
      },
    ]);
    const origin = window.location.origin;
    render(
      <MessageContent
        content={`${origin}/questions/q1#comment-c1\n\n\nyazilan metin`}
        isOwn={false}
        currentLanguage="tr"
      />
    );
    expect((await screen.findByText('yazilan metin')).textContent).toBe('yazilan metin');
    expect(await screen.findByText('selam')).toBeInTheDocument();
    expect(commentServiceMock.listForQuestion).toHaveBeenCalledWith('q1');
    expect(answerServiceMock.getAnswerByQuestionAndId).not.toHaveBeenCalled();
  });

  it('loads an answer mention without treating it as a comment', async () => {
    questionServiceMock.getQuestionById.mockResolvedValue({
      id: 'q1',
      summary: 'Soru',
      detail: 'detay',
      author: { id: 'u1', name: 'Ada', avatar: '' },
    } as any);
    answerServiceMock.getAnswerByQuestionAndId.mockResolvedValue({
      id: 'a1',
      content: 'cevap metni',
      author: { id: 'u2', name: 'Ada', avatar: '' },
      likesCount: 0,
      likedByUsers: [],
      dislikesCount: 0,
      dislikedByUsers: [],
      createdAt: '',
      timeAgo: '',
    });
    const origin = window.location.origin;
    render(
      <MessageContent
        content={`${origin}/questions/q1#answer-a1`}
        isOwn={false}
        currentLanguage="en"
      />
    );
    expect(await screen.findByText('cevap metni')).toBeInTheDocument();
    expect(commentServiceMock.listForQuestion).not.toHaveBeenCalled();
  });

  it('shows a deleted comment as deleted text', async () => {
    commentServiceMock.listForQuestion.mockResolvedValue([
      {
        id: 'c9',
        body: '',
        userId: 'u1',
        authorName: 'Mert',
        targetType: 'question',
        targetId: 'q1',
        deleted: true,
        createdAt: '2026-10-04T00:00:00.000Z',
        updatedAt: '2026-10-04T00:00:00.000Z',
      },
    ]);
    render(
      <MessageContent
        content={`${window.location.origin}/questions/q1#comment-c9`}
        isOwn={false}
        currentLanguage="en"
      />
    );
    expect(await screen.findByText('Comment deleted')).toBeInTheDocument();
  });

  it('leaves an outside link as a link', async () => {
    render(
      <MessageContent
        content="https://example.com/notes"
        isOwn={false}
        currentLanguage="en"
      />
    );
    const link = screen.getByRole('link', { name: 'https://example.com/notes' });
    expect(link).toHaveAttribute('href', 'https://example.com/notes');
    await waitFor(() => {
      expect(questionServiceMock.getQuestionById).not.toHaveBeenCalled();
    });
  });
});
