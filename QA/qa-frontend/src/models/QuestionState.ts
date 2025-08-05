import { Question } from './Question';

export interface QuestionState {
  questions: Question[];
  currentQuestion: Question | null;
  loading: boolean;
  error: string | null;
  totalQuestions: number;
  currentPage: number;
  questionsPerPage: number;
}
