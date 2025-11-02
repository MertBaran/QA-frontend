import { Answer } from '../../types/answer';

export interface AnswerState {
  answers: Answer[];
  currentAnswer: Answer | null;
  loading: boolean;
  error: string | null;
  totalAnswers: number;
  currentPage: number;
  answersPerPage: number;
}
