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

export type GdcdDifficulty = Difficulty;

export type GdcdTopicType = 'tu_nhan_thuc' | 'dao_duc' | 'phap_luat' | 'ky_nang_song' | 'cong_dong';

export type GdcdLesson = {
  id: number;
  sourceId: string;
  grade: 7;
  subjectCode: 'gdcd';
  unitCode: string;
  unitTitle: string;
  topicType: GdcdTopicType;
  lessonCode: string;
  slug: string;
  title: string;
  objectives: string[];
  keyPoints: string[];
  keywords: Record<string, string>;
  examples: string[];
  commonMistakes: string[];
  summarySimple: string;
  difficulty: GdcdDifficulty;
  estimatedMinutes: number;
  status: 'draft' | 'ready' | 'archived';
  sortOrder: number;
  isActive: 0 | 1;
};

export type GdcdLessonCard = {
  id: number;
  sourceId: string;
  lessonId: number;
  cardType: 'intro' | 'explain' | 'example' | 'tip' | 'mini_check';
  title: string;
  content: string;
  sortOrder: number;
  isActive: 0 | 1;
};

export type GdcdQuestionType = 'single_choice' | 'true_false' | 'fill_text' | 'scenario_choice' | 'order_steps';

export type GdcdQuestionOption = {
  key: string;
  text: string;
};

export type GdcdQuestion = {
  id: number;
  sourceId: string;
  lessonId: number;
  questionType: GdcdQuestionType;
  questionText: string;
  options: GdcdQuestionOption[] | null;
  correctAnswer: string;
  answerText: string;
  explanationSimple: string;
  difficulty: GdcdDifficulty;
  skillTag: string;
  tags: string[];
  isActive: 0 | 1;
};

export type GdcdPracticeQuestionCountOption = PracticeQuestionCountOption;

const TOPIC_TYPE_MAP: Record<string, GdcdTopicType> = {
  ethics: 'dao_duc',
  life_skill: 'ky_nang_song',
  school_behavior: 'dao_duc',
  citizenship: 'cong_dong',
  digital_citizenship: 'ky_nang_song',
  rights_duties: 'phap_luat',
  law_basic: 'phap_luat',
  money: 'ky_nang_song',
  integrated: 'cong_dong',
};

const rawLessons = getRawLessons('civic');
const rawQuestions = getRawQuestions('civic');
const questionsByLessonId = groupQuestionsByLesson('civic');
const lessonIdByRawLessonId = new Map<string, number>();

function getTopicType(rawLesson: RawLesson): GdcdTopicType {
  return TOPIC_TYPE_MAP[rawLesson.unitId] || 'dao_duc';
}

function buildGdcdLesson(rawLesson: RawLesson, lessonId: number, lessonQuestions: RawQuestion[]): GdcdLesson {
  const summarySimple = buildLessonSummary(rawLesson.title, rawLesson.summary, lessonQuestions.length);
  return {
    id: lessonId,
    sourceId: rawLesson.lessonId,
    grade: 7,
    subjectCode: 'gdcd',
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

function buildGdcdLessonCards(rawLesson: RawLesson, lessonId: number, lessonQuestions: RawQuestion[]) {
  const lesson = buildGdcdLesson(rawLesson, lessonId, lessonQuestions);
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
      title: 'Tình huống gần gũi',
      content: lesson.examples.join('\n'),
      sortOrder: 3,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 4,
      sourceId: `${rawLesson.lessonId}-tip`,
      lessonId,
      cardType: 'tip',
      title: 'Gợi ý mềm',
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
      content: `Em có thể nêu lại ${rawLesson.title.toLowerCase()} bằng một ví dụ gần gũi với lớp học hoặc gia đình không?`,
      sortOrder: 5,
      isActive: 1 as const,
    },
  ] satisfies GdcdLessonCard[];
}

export const gdcdLessons: GdcdLesson[] = rawLessons.map((rawLesson, index) => {
  const lessonId = index + 1;
  lessonIdByRawLessonId.set(rawLesson.lessonId, lessonId);
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];
  return buildGdcdLesson(rawLesson, lessonId, lessonQuestions);
});

export const gdcdLessonCards: GdcdLessonCard[] = rawLessons.flatMap((rawLesson, index) => {
  const lessonId = index + 1;
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];
  return buildGdcdLessonCards(rawLesson, lessonId, lessonQuestions);
});

export const gdcdQuestions: GdcdQuestion[] = rawQuestions.map((rawQuestion, index) => ({
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

export const gdcdSeed = {
  subjectCode: 'gdcd' as const,
  subjectTitle: 'GDCD Lớp 7',
  unitTitle: 'GDCD Lớp 7',
  lessons: gdcdLessons,
  lessonCards: gdcdLessonCards,
  questions: gdcdQuestions,
};

export const GDCD_PRACTICE_QUESTION_COUNT_OPTIONS = SHARED_PRACTICE_QUESTION_COUNT_OPTIONS;
export const DEFAULT_GDCD_PRACTICE_QUESTION_COUNT = SHARED_DEFAULT_PRACTICE_QUESTION_COUNT;

export function getActiveGdcdLessons() {
  return gdcdLessons.filter((lesson) => lesson.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getGdcdLessonById(lessonId: number) {
  return gdcdLessons.find((lesson) => lesson.id === lessonId && lesson.isActive);
}

export function getGdcdLessonCards(lessonId: number) {
  return gdcdLessonCards.filter((card) => card.lessonId === lessonId && card.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getGdcdLessonQuestions(lessonId: number) {
  return gdcdQuestions.filter((question) => question.lessonId === lessonId && question.isActive);
}

export function isGdcdPracticeQuestionCountOption(value: number): value is GdcdPracticeQuestionCountOption {
  return isSharedPracticeQuestionCountOption(value);
}

export function getGdcdPracticeSamplingPolicy(questionCount: GdcdPracticeQuestionCountOption) {
  return getSharedPracticeSamplingPolicy(questionCount);
}

export function getGdcdLessonPracticeQuestions(
  lessonId: number,
  targetCount: GdcdPracticeQuestionCountOption = DEFAULT_GDCD_PRACTICE_QUESTION_COUNT,
) {
  const questions = getGdcdLessonQuestions(lessonId);
  const policy = getGdcdPracticeSamplingPolicy(targetCount);
  return pickPracticeQuestions(questions, targetCount, policy as PracticePolicy | null);
}
