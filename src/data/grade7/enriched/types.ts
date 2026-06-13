import type { SubjectKey } from '../shared';

export type TextbookMapStatus = 'unmapped' | 'mapped' | 'needs_review';

export type EnrichedTextbookMap = {
  status: TextbookMapStatus;
  bookSeries: string | null;
  bookLessonTitle: string | null;
  bookPage: string | null;
  note?: string;
};

export type WorkedExample = {
  title: string;
  problem: string;
  steps: string[];
  answer: string;
  explanation?: string;
};

export type CommonMistake = {
  mistake: string;
  fix: string;
};

export type WarmupQuestion = {
  question: string;
  suggestedAnswer?: string;
};

export type ApplicationQuestion = {
  question: string;
  hint?: string;
  suggestedAnswer?: string;
};

export type MediaHint = {
  type: 'image' | 'diagram' | 'audio' | 'video' | 'interactive';
  description: string;
  priority?: 'low' | 'medium' | 'high';
};

export type EnrichedLesson = {
  lessonId: string;
  subjectKey?: SubjectKey;
  learningObjectives?: string[];
  easyExplanation?: string;
  workedExamples?: WorkedExample[];
  steps?: string[];
  commonMistakes?: CommonMistake[];
  quickMemory?: string;
  warmupQuestions?: WarmupQuestion[];
  applicationQuestions?: ApplicationQuestion[];
  mediaHints?: MediaHint[];
  textbookMap?: EnrichedTextbookMap;
  updatedAt?: string;
};
