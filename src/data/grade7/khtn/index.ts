import {
  DEFAULT_PRACTICE_QUESTION_COUNT as SHARED_DEFAULT_PRACTICE_QUESTION_COUNT,
  PRACTICE_QUESTION_COUNT_OPTIONS as SHARED_PRACTICE_QUESTION_COUNT_OPTIONS,
  buildLessonSummary,
  estimateMinutes,
  getPracticeSamplingPolicy as getSharedPracticeSamplingPolicy,
  getRawLessons,
  getRawQuestions,
  groupQuestionsByLesson,
  inferDifficulty,
  isPracticeQuestionCountOption as isSharedPracticeQuestionCountOption,
  makeGenericExamples,
  makeGenericKeyPoints,
  makeGenericKeywords,
  makeGenericMistakes,
  makeGenericObjectives,
  normalizeText,
  pickPracticeQuestions,
  slugify,
  type Difficulty,
  type PracticeQuestionCountOption,
  type RawLesson,
  type RawQuestion,
  type PracticePolicy,
} from '../shared';

export type KhtnDifficulty = Difficulty;

export type KhtnLesson = {
  id: number;
  sourceId: string;
  grade: 7;
  subjectCode: 'khtn';
  unitCode: string;
  unitTitle: string;
  lessonCode: string;
  slug: string;
  title: string;
  objectives: string[];
  keyPoints: string[];
  keywords: Record<string, string>;
  examples: string[];
  commonMistakes: string[];
  summarySimple: string;
  difficulty: KhtnDifficulty;
  estimatedMinutes: number;
  status: 'draft' | 'ready' | 'archived';
  sortOrder: number;
  isActive: 0 | 1;
};

export type KhtnLessonCard = {
  id: number;
  sourceId: string;
  lessonId: number;
  cardType: string;
  title: string;
  content: string;
  sortOrder: number;
  isActive: 0 | 1;
};

export type KhtnQuestionType = 'single_choice' | 'true_false' | 'fill_text' | 'scenario_choice';

export type KhtnQuestionOption = {
  key: string;
  text: string;
};

export type KhtnQuestion = {
  id: number;
  sourceId: string;
  lessonId: number;
  questionType: KhtnQuestionType;
  questionText: string;
  options: KhtnQuestionOption[] | null;
  correctAnswer: string;
  answerText: string;
  explanationSimple: string;
  difficulty: KhtnDifficulty;
  skillTag: string;
  tags: string[];
  isActive: 0 | 1;
};

export type KhtnPracticeQuestionCountOption = PracticeQuestionCountOption;

const rawLessons = getRawLessons('science');
const rawQuestions = getRawQuestions('science');
const questionsByLessonId = groupQuestionsByLesson('science');
const lessonIdByRawLessonId = new Map<string, number>();

function buildKhtnLesson(rawLesson: RawLesson, lessonId: number, lessonQuestions: RawQuestion[]): KhtnLesson {
  const summarySimple = buildLessonSummary(rawLesson.title, rawLesson.summary, lessonQuestions.length);
  return {
    id: lessonId,
    sourceId: rawLesson.lessonId,
    grade: 7,
    subjectCode: 'khtn',
    unitCode: rawLesson.unitId,
    unitTitle: rawLesson.unitTitle,
    lessonCode: rawLesson.lessonId,
    slug: slugify(rawLesson.title),
    title: rawLesson.title,
    objectives: makeGenericObjectives(rawLesson.title, rawLesson.summary, rawLesson.skillTags),
    keyPoints: makeGenericKeyPoints(rawLesson.title, rawLesson.summary, rawLesson.skillTags),
    keywords: makeGenericKeywords(rawLesson.title, rawLesson.summary, rawLesson.unitTitle, rawLesson.skillTags),
    examples: makeGenericExamples(lessonQuestions, rawLesson.title),
    commonMistakes: makeGenericMistakes(rawLesson.title),
    summarySimple,
    difficulty: inferDifficulty(lessonQuestions),
    estimatedMinutes: estimateMinutes(lessonQuestions.length, 16),
    status: 'ready',
    sortOrder: lessonId,
    isActive: 1,
  };
}

function buildKhtnLessonCards(rawLesson: RawLesson, lessonId: number, lessonQuestions: RawQuestion[]) {
  const firstQuestion = lessonQuestions[0];
  const examples = makeGenericExamples(lessonQuestions, rawLesson.title);
  const commonMistakes = makeGenericMistakes(rawLesson.title);
  const summarySimple = buildLessonSummary(rawLesson.title, rawLesson.summary, lessonQuestions.length);

  return [
    {
      id: lessonId * 10 + 1,
      sourceId: `${rawLesson.lessonId}-intro`,
      lessonId,
      cardType: 'intro',
      title: `Vào bài: ${rawLesson.title}`,
      content: summarySimple,
      sortOrder: 1,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 2,
      sourceId: `${rawLesson.lessonId}-explain`,
      lessonId,
      cardType: 'explain',
      title: 'Khái niệm chính',
      content: makeGenericKeyPoints(rawLesson.title, rawLesson.summary, rawLesson.skillTags).join('\n'),
      sortOrder: 2,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 3,
      sourceId: `${rawLesson.lessonId}-example`,
      lessonId,
      cardType: 'example',
      title: 'Ví dụ gần gũi',
      content: firstQuestion ? `${firstQuestion.questionText}\nĐáp án: ${firstQuestion.correctOptionText}` : examples[0] || rawLesson.summary,
      sortOrder: 3,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 4,
      sourceId: `${rawLesson.lessonId}-common-mistake`,
      lessonId,
      cardType: 'common_mistake',
      title: 'Lỗi hay gặp',
      content: commonMistakes.join('\n'),
      sortOrder: 4,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 5,
      sourceId: `${rawLesson.lessonId}-mini-check`,
      lessonId,
      cardType: 'mini_check',
      title: 'Kiểm tra nhanh',
      content: `Em có thể nêu lại ${rawLesson.title.toLowerCase()} bằng một ví dụ và một ý chính không?`,
      sortOrder: 5,
      isActive: 1 as const,
    },
  ] satisfies KhtnLessonCard[];
}

export const khtnLessons: KhtnLesson[] = rawLessons.map((rawLesson, index) => {
  const lessonId = index + 1;
  lessonIdByRawLessonId.set(rawLesson.lessonId, lessonId);
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];
  return buildKhtnLesson(rawLesson, lessonId, lessonQuestions);
});

export const khtnLessonCards: KhtnLessonCard[] = rawLessons.flatMap((rawLesson, index) => {
  const lessonId = index + 1;
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];
  return buildKhtnLessonCards(rawLesson, lessonId, lessonQuestions);
});

export const khtnQuestions: KhtnQuestion[] = rawQuestions.map((rawQuestion, index) => ({
  id: index + 1,
  sourceId: rawQuestion.questionId,
  lessonId: lessonIdByRawLessonId.get(rawQuestion.lessonId) ?? 0,
  questionType: 'single_choice',
  questionText: normalizeText(rawQuestion.questionText),
  options: rawQuestion.options?.length ? rawQuestion.options : null,
  correctAnswer: rawQuestion.correctAnswer,
  answerText: rawQuestion.correctOptionText,
  explanationSimple: rawQuestion.explanation,
  difficulty: rawQuestion.difficulty,
  skillTag: rawQuestion.skillTag,
  tags: [rawQuestion.category, rawQuestion.unitId, rawQuestion.skillTag].filter(Boolean),
  isActive: 1,
}));

export const khtnSeed = {
  subjectCode: 'khtn' as const,
  subjectTitle: 'Khoa học Tự nhiên Lớp 7',
  unitTitle: 'Khoa học Tự nhiên Lớp 7',
  lessons: khtnLessons,
  lessonCards: khtnLessonCards,
  questions: khtnQuestions,
};

export const KHTN_PRACTICE_QUESTION_COUNT_OPTIONS = SHARED_PRACTICE_QUESTION_COUNT_OPTIONS;
export const DEFAULT_KHTN_PRACTICE_QUESTION_COUNT = SHARED_DEFAULT_PRACTICE_QUESTION_COUNT;

export function getActiveKhtnLessons() {
  return khtnLessons.filter((lesson) => lesson.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getKhtnLessonById(lessonId: number) {
  return khtnLessons.find((lesson) => lesson.id === lessonId && lesson.isActive);
}

export function getKhtnLessonCards(lessonId: number) {
  return khtnLessonCards.filter((card) => card.lessonId === lessonId && card.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getKhtnLessonQuestions(lessonId: number) {
  return khtnQuestions.filter((question) => question.lessonId === lessonId && question.isActive);
}

export function isKhtnPracticeQuestionCountOption(value: number): value is KhtnPracticeQuestionCountOption {
  return isSharedPracticeQuestionCountOption(value);
}

export function getKhtnPracticeSamplingPolicy(questionCount: KhtnPracticeQuestionCountOption) {
  return getSharedPracticeSamplingPolicy(questionCount);
}

export function getKhtnLessonPracticeQuestions(
  lessonId: number,
  targetCount: KhtnPracticeQuestionCountOption = DEFAULT_KHTN_PRACTICE_QUESTION_COUNT,
) {
  const questions = getKhtnLessonQuestions(lessonId);
  const policy = getKhtnPracticeSamplingPolicy(targetCount);
  return pickPracticeQuestions(questions, targetCount, policy as PracticePolicy | null);
}
