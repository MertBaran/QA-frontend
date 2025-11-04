import { Question } from '../../types/question';

export interface QuestionFilters {
  search: string;
  category: string;
  tags: string;
  sortBy: string;
  savedOnly: string;
}

export interface NewQuestion {
  title: string;
  content: string;
  category: string;
  tags: string;
}

export interface ValidationErrors {
  title?: string;
  content?: string;
  category?: string;
  tags?: string;
}

export interface HomeState {
  // Questions data
  questions: Question[];
  loading: boolean;
  error: string | null;

  // Filters
  filters: QuestionFilters;
  activeFilters: string[];

  // Modals
  filterModalOpen: boolean;
  createQuestionModalOpen: boolean;

  // Create question form
  newQuestion: NewQuestion;
  validationErrors: ValidationErrors;
  isSubmitting: boolean;

  // Pagination
  currentPage: number;
  itemsPerPage: number;
  totalQuestions: number;
  totalPages: number;
}
