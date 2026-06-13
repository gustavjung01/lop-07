import rawLessonsBundle from './raw/grade7_all_lessons_normalized.json';
import rawQuestionsBundle from './raw/grade7_all_questions_normalized.json';

export type SubjectKey =
  | 'math'
  | 'english'
  | 'science'
  | 'literature'
  | 'history_geography'
  | 'informatics'
  | 'technology'
  | 'civic';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type PracticeQuestionCountOption = 10 | 12 | 20 | 40;

export type RawLesson = {
  grade: number;
  subjectKey: SubjectKey;
  subjectId: string;
  subject: string;
  lessonId: string;
  unitId: string;
  unitTitle: string;
  strandId: string;
  title: string;
  summary: string;
  skillTags: string[];
  difficultyTags: Difficulty[];
  textbookMap: unknown | null;
  sourceFile: string;
  rawId: string;
};

export type RawQuestionOption = {
  key: string;
  text: string;
};

export type RawQuestion = {
  grade: number;
  subjectKey: SubjectKey;
  subjectId: string;
  subject: string;
  questionId: string;
  lessonId: string;
  unitId: string;
  lessonTitle: string;
  category: string;
  questionType: string;
  questionText: string;
  options: RawQuestionOption[];
  correctAnswer: string;
  correctOptionText: string;
  explanation: string;
  difficulty: Difficulty;
  skillTag: string;
  textbookMap: unknown | null;
  sourceFile: string;
};

export const PRACTICE_QUESTION_COUNT_OPTIONS = [
  {
    value: 10,
    title: 'Luyện nhanh',
    label: '10 câu',
    description: 'Gọn nhẹ để ôn nhanh một lượt.',
  },
  {
    value: 12,
    title: 'Tiêu chuẩn',
    label: '12 câu',
    description: 'Cân bằng giữa khởi động, luyện tập và thử thách.',
  },
  {
    value: 20,
    title: 'Luyện sâu',
    label: '20 câu',
    description: 'Nhiều câu hơn để chốt chắc kiến thức của bài.',
  },
  {
    value: 40,
    title: 'Thử thách đủ bài',
    label: '40 câu',
    description: 'Làm toàn bộ ngân hàng câu hỏi của bài này.',
  },
] as const satisfies ReadonlyArray<{
  value: PracticeQuestionCountOption;
  title: string;
  label: string;
  description: string;
}>;

export const DEFAULT_PRACTICE_QUESTION_COUNT: PracticeQuestionCountOption = 12;

const PRACTICE_SAMPLING_POLICIES: Record<Exclude<PracticeQuestionCountOption, 40>, PracticePolicy> = {
  10: { easy: 4, medium: 4, hard: 2 },
  12: { easy: 5, medium: 5, hard: 2 },
  20: { easy: 6, medium: 10, hard: 4 },
};

type RawLessonsBundle = {
  meta: {
    grade: number;
    batch: string;
    version: string;
    createdAt: string;
    recordCount: number;
  };
  lessons: RawLesson[];
};

type RawQuestionsBundle = {
  meta: {
    grade: number;
    batch: string;
    version: string;
    createdAt: string;
    recordCount: number;
  };
  questions: RawQuestion[];
};

const lessonsBundle = rawLessonsBundle as RawLessonsBundle;
const questionsBundle = rawQuestionsBundle as RawQuestionsBundle;

export const grade7RawLessons = lessonsBundle.lessons;
export const grade7RawQuestions = questionsBundle.questions;

export const grade7SubjectOrder: SubjectKey[] = [
  'english',
  'math',
  'science',
  'literature',
  'history_geography',
  'informatics',
  'technology',
  'civic',
];

export function getRawLessons(subjectKey: SubjectKey) {
  return grade7RawLessons.filter((lesson) => lesson.subjectKey === subjectKey);
}

export function getRawQuestions(subjectKey: SubjectKey) {
  return grade7RawQuestions.filter((question) => question.subjectKey === subjectKey);
}

export function groupQuestionsByLesson(subjectKey: SubjectKey) {
  const map = new Map<string, RawQuestion[]>();

  for (const question of grade7RawQuestions) {
    if (question.subjectKey !== subjectKey) continue;

    const current = map.get(question.lessonId) ?? [];
    current.push(question);
    map.set(question.lessonId, current);
  }

  return map;
}

export function normalizeText(value: string) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function slugify(value: string) {
  return normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function humanize(value: string) {
  const normalized = normalizeText(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return '';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function take<T>(values: T[], count: number) {
  return values.slice(0, Math.max(0, count));
}

export function getDifficultyScore(difficulty: Difficulty) {
  if (difficulty === 'easy') return 1;
  if (difficulty === 'medium') return 2;
  return 3;
}

export function inferDifficulty(questions: Array<{ difficulty: Difficulty }>) {
  if (!questions.length) return 'medium' as const;

  const score = questions.reduce((sum, question) => sum + getDifficultyScore(question.difficulty), 0) / questions.length;
  if (score < 1.5) return 'easy' as const;
  if (score < 2.4) return 'medium' as const;
  return 'hard' as const;
}

export function estimateMinutes(questionCount: number, base = 15) {
  return Math.max(12, Math.min(30, Math.round(base + questionCount / 5)));
}

export type PracticePolicy = {
  easy: number;
  medium: number;
  hard: number;
};

export function shuffleItems<T>(values: T[]) {
  const next = [...values];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = current;
  }

  return next;
}

export function pickPracticeQuestions<T extends { difficulty: Difficulty; id: number }>(
  questions: T[],
  targetCount: number,
  policy: PracticePolicy | null,
) {
  if (targetCount >= questions.length) {
    return shuffleItems(questions);
  }

  if (!policy) {
    return shuffleItems(questions).slice(0, targetCount);
  }

  const selected = (['hard', 'easy', 'medium'] as const).flatMap((difficulty) => {
    const count = policy[difficulty];
    return shuffleItems(questions.filter((question) => question.difficulty === difficulty)).slice(0, count);
  });

  const selectedIds = new Set(selected.map((question) => question.id));
  const fallback = shuffleItems(questions.filter((question) => !selectedIds.has(question.id))).slice(
    0,
    Math.max(0, targetCount - selected.length),
  );

  return shuffleItems([...selected, ...fallback]).slice(0, targetCount);
}

export function isPracticeQuestionCountOption(value: number): value is PracticeQuestionCountOption {
  return PRACTICE_QUESTION_COUNT_OPTIONS.some((option) => option.value === value);
}

export function getPracticeSamplingPolicy(questionCount: PracticeQuestionCountOption) {
  if (questionCount === 40) return null;
  return PRACTICE_SAMPLING_POLICIES[questionCount];
}

export function extractQuotedText(value: string) {
  const matches = [...normalizeText(value).matchAll(/'([^']+)'/g)];
  return matches.map((match) => match[1]).filter(Boolean);
}

export function firstSentence(value: string) {
  const text = normalizeText(value);
  if (!text) return '';

  const parts = text.split(/[.!?]/g);
  return normalizeText(parts[0] ?? text);
}

export function makeGenericKeywords(
  title: string,
  summary: string,
  unitTitle: string,
  skillTags: string[],
) {
  const entries: Array<[string, string]> = [
    ['Chủ đề', title],
    ['Mạch học', unitTitle],
    ['Tóm tắt', summary || title],
    ['Kĩ năng', skillTags.length ? skillTags.slice(0, 3).map(humanize).join(', ') : 'Cơ bản'],
  ];

  return Object.fromEntries(entries);
}

export function makeGenericObjectives(title: string, summary: string, skillTags: string[]) {
  const base = firstSentence(summary) || title;
  const skills = skillTags.length ? skillTags.slice(0, 2).map(humanize).join(' và ') : 'thực hành';

  return [
    `Nhận biết và hiểu ${title.toLowerCase()}.`,
    `Nắm ý chính qua ${base.toLowerCase()}.`,
    `Vận dụng ${skills} trong bài luyện tập.`,
  ];
}

export function makeGenericKeyPoints(title: string, summary: string, skillTags: string[]) {
  const points = uniqueStrings([
    firstSentence(summary) || title,
    skillTags[0] ? humanize(skillTags[0]) : '',
    skillTags[1] ? humanize(skillTags[1]) : '',
    skillTags[2] ? humanize(skillTags[2]) : '',
  ]);

  return take(points, 3);
}

export function makeGenericExamples(questions: RawQuestion[], fallbackTitle: string) {
  const examples = take(
    questions.map((question) => `${question.questionText} - ${question.correctOptionText}`),
    3,
  );

  if (examples.length) return examples;

  return [
    `Ví dụ gần gũi cho ${fallbackTitle}.`,
    'Đọc kĩ đề trước khi chọn đáp án.',
    'Dùng câu hỏi luyện tập để tự kiểm tra.',
  ];
}

export function makeGenericMistakes(title: string) {
  return [
    `Đọc lướt phần ${title.toLowerCase()} nên dễ bỏ sót dữ kiện.`,
    'Nhầm giữa ý chính và chi tiết nhỏ.',
    'Chọn đáp án theo cảm tính thay vì đọc kĩ câu hỏi.',
  ];
}

export function buildLessonSummary(title: string, summary: string, questionCount: number) {
  const summaryText = firstSentence(summary) || title;
  return `${summaryText} Có ${questionCount} câu luyện tập để em ôn chắc từng ý.`;
}
