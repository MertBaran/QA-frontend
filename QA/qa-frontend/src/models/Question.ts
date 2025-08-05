import type { User } from './User';

export interface Question {
  _id: string;
  title: string;
  content: string;
  user: string | User;
  createdAt: string;
  updatedAt: string;
  likes: string[];
  answers?: string[] | Answer[];
  // Diğer alanlar eklenebilir
}

export interface Answer {
  _id: string;
  content: string;
  user: string; // veya User
  question: string;
  createdAt: string;
  updatedAt: string;
  // Diğer alanlar eklenebilir
}

export interface AskQuestionData {
  title: string;
  content: string;
  // Diğer alanlar eklenebilir
}

export interface AnswerData {
  content: string;
  // Diğer alanlar eklenebilir
}
