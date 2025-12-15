import type { CharacterListItem } from "./character";

export interface QuizOption {
  text: string;
  value: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  image?: string;
}

export interface QuizResultLogic {
  heroId: CharacterListItem;
  logic: Record<string, string[]>;
  description?: string;
}

export interface Quiz {
  _id: string;
  id: string;
  title: string;
  description?: string;
  image?: string;
  questions: QuizQuestion[];
  results: QuizResultLogic[];
  isActive: boolean;
  totalAttempts: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizListItem {
  _id: string;
  id: string;
  title: string;
  description?: string;
  image?: string;
  isActive: boolean;
  totalAttempts: number;
}

export interface QuizForPlay {
  _id: string;
  title: string;
  description?: string;
  image?: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  hero: CharacterListItem | null;
  description: string | null;
  scores: Record<string, number>;
  totalQuestions: number;
}

export interface QuizAnswers {
  [questionId: string]: string;
}
