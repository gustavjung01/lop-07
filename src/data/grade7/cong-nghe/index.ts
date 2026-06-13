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

export type CongNgheDifficulty = Difficulty;

export type CongNgheTopicType = 'nha_o' | 'vat_lieu' | 'thuc_pham' | 'trang_phuc' | 'do_dung' | 'quy_trinh';

export type CongNgheLesson = {
  id: number;
  sourceId: string;
  grade: 7;
  subjectCode: 'cong-nghe';
  unitCode: string;
  unitTitle: string;
  topicType: CongNgheTopicType;
  lessonCode: string;
  slug: string;
  title: string;
  objectives: string[];
  keyPoints: string[];
  keywords: Record<string, string>;
  examples: string[];
  commonMistakes: string[];
  summarySimple: string;
  difficulty: CongNgheDifficulty;
  estimatedMinutes: number;
  status: 'draft' | 'ready' | 'archived';
  sortOrder: number;
  isActive: 0 | 1;
};

export type CongNgheLessonCard = {
  id: number;
  sourceId: string;
  lessonId: number;
  cardType: 'intro' | 'explain' | 'example' | 'tip' | 'mini_check';
  title: string;
  content: string;
  sortOrder: number;
  isActive: 0 | 1;
};

export type CongNgheQuestionType = 'single_choice' | 'true_false' | 'fill_text' | 'scenario_choice' | 'order_steps';

export type CongNgheQuestionOption = {
  key: string;
  text: string;
};

export type CongNgheQuestion = {
  id: number;
  sourceId: string;
  lessonId: number;
  questionType: CongNgheQuestionType;
  questionText: string;
  options: CongNgheQuestionOption[] | null;
  correctAnswer: string;
  answerText: string;
  explanationSimple: string;
  difficulty: CongNgheDifficulty;
  skillTag: string;
  tags: string[];
  isActive: 0 | 1;
};

export type CongNghePracticeQuestionCountOption = PracticeQuestionCountOption;

const TOPIC_TYPE_MAP: Record<string, CongNgheTopicType> = {
  tech_life: 'do_dung',
  design: 'quy_trinh',
  project: 'quy_trinh',
  practice: 'quy_trinh',
  materials: 'vat_lieu',
  agriculture: 'thuc_pham',
  livestock: 'thuc_pham',
  environment: 'nha_o',
  labor_safety: 'quy_trinh',
};

const rawLessons = getRawLessons('technology');
const rawQuestions = getRawQuestions('technology');
const questionsByLessonId = groupQuestionsByLesson('technology');
const lessonIdByRawLessonId = new Map<string, number>();

function getTopicType(rawLesson: RawLesson): CongNgheTopicType {
  return TOPIC_TYPE_MAP[rawLesson.unitId] || 'quy_trinh';
}

function buildCongNgheLesson(rawLesson: RawLesson, lessonId: number, lessonQuestions: RawQuestion[]): CongNgheLesson {
  const summarySimple = buildLessonSummary(rawLesson.title, rawLesson.summary, lessonQuestions.length);
  return {
    id: lessonId,
    sourceId: rawLesson.lessonId,
    grade: 7,
    subjectCode: 'cong-nghe',
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

function buildCongNgheLessonCards(rawLesson: RawLesson, lessonId: number, lessonQuestions: RawQuestion[]) {
  const lesson = buildCongNgheLesson(rawLesson, lessonId, lessonQuestions);
  return [
    {
      id: lessonId * 10 + 1,
      sourceId: `${rawLesson.lessonId}-intro`,
      lessonId,
      cardType: 'intro',
      title: `Mở đầu: ${rawLesson.title}`,
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
      title: 'Ví dụ',
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
      content: `Em có thể nêu lại ${rawLesson.title.toLowerCase()} bằng một thao tác hoặc một vật liệu cụ thể không?`,
      sortOrder: 5,
      isActive: 1 as const,
    },
  ] satisfies CongNgheLessonCard[];
}

export const congNgheLessons: CongNgheLesson[] = rawLessons.map((rawLesson, index) => {
  const lessonId = index + 1;
  lessonIdByRawLessonId.set(rawLesson.lessonId, lessonId);
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];
  return buildCongNgheLesson(rawLesson, lessonId, lessonQuestions);
});

export const congNgheLessonCards: CongNgheLessonCard[] = rawLessons.flatMap((rawLesson, index) => {
  const lessonId = index + 1;
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];
  return buildCongNgheLessonCards(rawLesson, lessonId, lessonQuestions);
});

export const congNgheQuestions: CongNgheQuestion[] = rawQuestions.map((rawQuestion, index) => ({
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

export const congNgheSeed = {
  subjectCode: 'cong-nghe' as const,
  subjectTitle: 'Công nghệ Lớp 7',
  unitTitle: 'Công nghệ Lớp 7',
  lessons: congNgheLessons,
  lessonCards: congNgheLessonCards,
  questions: congNgheQuestions,
};

export const CONG_NGHE_PRACTICE_QUESTION_COUNT_OPTIONS = SHARED_PRACTICE_QUESTION_COUNT_OPTIONS;
export const DEFAULT_CONG_NGHE_PRACTICE_QUESTION_COUNT = SHARED_DEFAULT_PRACTICE_QUESTION_COUNT;

export function getActiveCongNgheLessons() {
  return congNgheLessons.filter((lesson) => lesson.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCongNgheLessonById(lessonId: number) {
  return congNgheLessons.find((lesson) => lesson.id === lessonId && lesson.isActive);
}

export function getCongNgheLessonCards(lessonId: number) {
  return congNgheLessonCards.filter((card) => card.lessonId === lessonId && card.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCongNgheLessonQuestions(lessonId: number) {
  return congNgheQuestions.filter((question) => question.lessonId === lessonId && question.isActive);
}

export function isCongNghePracticeQuestionCountOption(value: number): value is CongNghePracticeQuestionCountOption {
  return isSharedPracticeQuestionCountOption(value);
}

export function getCongNghePracticeSamplingPolicy(questionCount: CongNghePracticeQuestionCountOption) {
  return getSharedPracticeSamplingPolicy(questionCount);
}

export function getCongNgheLessonPracticeQuestions(
  lessonId: number,
  targetCount: CongNghePracticeQuestionCountOption = DEFAULT_CONG_NGHE_PRACTICE_QUESTION_COUNT,
) {
  const questions = getCongNgheLessonQuestions(lessonId);
  const policy = getCongNghePracticeSamplingPolicy(targetCount);
  return pickPracticeQuestions(questions, targetCount, policy as PracticePolicy | null);
}
