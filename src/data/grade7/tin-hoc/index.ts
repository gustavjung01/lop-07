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

export type TinHocDifficulty = Difficulty;

export type TinHocTopicType = 'may_tinh' | 'internet' | 'an_toan_so' | 'thuat_toan' | 'ung_dung';

export type TinHocLesson = {
  id: number;
  sourceId: string;
  grade: 7;
  subjectCode: 'tin-hoc';
  unitCode: string;
  unitTitle: string;
  topicType: TinHocTopicType;
  lessonCode: string;
  slug: string;
  title: string;
  objectives: string[];
  keyPoints: string[];
  keywords: Record<string, string>;
  examples: string[];
  commonMistakes: string[];
  summarySimple: string;
  difficulty: TinHocDifficulty;
  estimatedMinutes: number;
  status: 'draft' | 'ready' | 'archived';
  sortOrder: number;
  isActive: 0 | 1;
};

export type TinHocLessonCard = {
  id: number;
  sourceId: string;
  lessonId: number;
  cardType: 'intro' | 'explain' | 'example' | 'tip' | 'mini_check';
  title: string;
  content: string;
  sortOrder: number;
  isActive: 0 | 1;
};

export type TinHocQuestionType = 'single_choice' | 'true_false' | 'fill_text' | 'scenario_choice' | 'order_steps';

export type TinHocQuestionOption = {
  key: string;
  text: string;
};

export type TinHocQuestion = {
  id: number;
  sourceId: string;
  lessonId: number;
  questionType: TinHocQuestionType;
  questionText: string;
  options: TinHocQuestionOption[] | null;
  correctAnswer: string;
  answerText: string;
  explanationSimple: string;
  difficulty: TinHocDifficulty;
  skillTag: string;
  tags: string[];
  isActive: 0 | 1;
};

export type TinHocPracticeQuestionCountOption = PracticeQuestionCountOption;

const TOPIC_TYPE_MAP: Record<string, TinHocTopicType> = {
  digital: 'may_tinh',
  internet: 'internet',
  safety: 'an_toan_so',
  algorithm: 'thuat_toan',
  data: 'ung_dung',
  office: 'ung_dung',
  programming: 'ung_dung',
};

const rawLessons = getRawLessons('informatics');
const rawQuestions = getRawQuestions('informatics');
const questionsByLessonId = groupQuestionsByLesson('informatics');
const lessonIdByRawLessonId = new Map<string, number>();

function getTopicType(rawLesson: RawLesson): TinHocTopicType {
  return TOPIC_TYPE_MAP[rawLesson.unitId] || 'ung_dung';
}

function buildTinHocLesson(rawLesson: RawLesson, lessonId: number, lessonQuestions: RawQuestion[]): TinHocLesson {
  const summarySimple = buildLessonSummary(rawLesson.title, rawLesson.summary, lessonQuestions.length);
  return {
    id: lessonId,
    sourceId: rawLesson.lessonId,
    grade: 7,
    subjectCode: 'tin-hoc',
    unitCode: rawLesson.unitId,
    unitTitle: rawLesson.unitTitle,
    topicType: getTopicType(rawLesson),
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

function buildTinHocLessonCards(rawLesson: RawLesson, lessonId: number, lessonQuestions: RawQuestion[]) {
  const lesson = buildTinHocLesson(rawLesson, lessonId, lessonQuestions);
  return [
    {
      id: lessonId * 10 + 1,
      sourceId: `${rawLesson.lessonId}-intro`,
      lessonId,
      cardType: 'intro',
      title: `Khởi động: ${rawLesson.title}`,
      content: lesson.summarySimple,
      sortOrder: 1,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 2,
      sourceId: `${rawLesson.lessonId}-explain`,
      lessonId,
      cardType: 'explain',
      title: 'Giải thích',
      content: lesson.keyPoints.join('\n'),
      sortOrder: 2,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 3,
      sourceId: `${rawLesson.lessonId}-example`,
      lessonId,
      cardType: 'example',
      title: 'Ví dụ thao tác',
      content: lesson.examples.join('\n'),
      sortOrder: 3,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 4,
      sourceId: `${rawLesson.lessonId}-tip`,
      lessonId,
      cardType: 'tip',
      title: 'Mẹo an toàn',
      content: lesson.commonMistakes.join('\n'),
      sortOrder: 4,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 5,
      sourceId: `${rawLesson.lessonId}-mini-check`,
      lessonId,
      cardType: 'mini_check',
      title: 'Tự kiểm tra',
      content: `Em có thể nêu lại ${rawLesson.title.toLowerCase()} bằng một thao tác hoặc một ví dụ không?`,
      sortOrder: 5,
      isActive: 1 as const,
    },
  ] satisfies TinHocLessonCard[];
}

export const tinHocLessons: TinHocLesson[] = rawLessons.map((rawLesson, index) => {
  const lessonId = index + 1;
  lessonIdByRawLessonId.set(rawLesson.lessonId, lessonId);
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];
  return buildTinHocLesson(rawLesson, lessonId, lessonQuestions);
});

export const tinHocLessonCards: TinHocLessonCard[] = rawLessons.flatMap((rawLesson, index) => {
  const lessonId = index + 1;
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];
  return buildTinHocLessonCards(rawLesson, lessonId, lessonQuestions);
});

export const tinHocQuestions: TinHocQuestion[] = rawQuestions.map((rawQuestion, index) => ({
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

export const tinHocSeed = {
  subjectCode: 'tin-hoc' as const,
  subjectTitle: 'Tin học Lớp 7',
  unitTitle: 'Tin học Lớp 7',
  lessons: tinHocLessons,
  lessonCards: tinHocLessonCards,
  questions: tinHocQuestions,
};

export const TIN_HOC_PRACTICE_QUESTION_COUNT_OPTIONS = SHARED_PRACTICE_QUESTION_COUNT_OPTIONS;
export const DEFAULT_TIN_HOC_PRACTICE_QUESTION_COUNT = SHARED_DEFAULT_PRACTICE_QUESTION_COUNT;

export function getActiveTinHocLessons() {
  return tinHocLessons.filter((lesson) => lesson.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getTinHocLessonById(lessonId: number) {
  return tinHocLessons.find((lesson) => lesson.id === lessonId && lesson.isActive);
}

export function getTinHocLessonCards(lessonId: number) {
  return tinHocLessonCards.filter((card) => card.lessonId === lessonId && card.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getTinHocLessonQuestions(lessonId: number) {
  return tinHocQuestions.filter((question) => question.lessonId === lessonId && question.isActive);
}

export function isTinHocPracticeQuestionCountOption(value: number): value is TinHocPracticeQuestionCountOption {
  return isSharedPracticeQuestionCountOption(value);
}

export function getTinHocPracticeSamplingPolicy(questionCount: TinHocPracticeQuestionCountOption) {
  return getSharedPracticeSamplingPolicy(questionCount);
}

export function getTinHocLessonPracticeQuestions(
  lessonId: number,
  targetCount: TinHocPracticeQuestionCountOption = DEFAULT_TIN_HOC_PRACTICE_QUESTION_COUNT,
) {
  const questions = getTinHocLessonQuestions(lessonId);
  const policy = getTinHocPracticeSamplingPolicy(targetCount);
  return pickPracticeQuestions(questions, targetCount, policy as PracticePolicy | null);
}
