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

export type NguVanDifficulty = Difficulty;

export type NguVanLesson = {
  id: number;
  sourceId: string;
  grade: 7;
  subjectCode: 'ngu-van';
  unitCode: string;
  unitTitle: string;
  lessonCode: string;
  skillType: string;
  textType: string;
  slug: string;
  title: string;
  focus: string;
  objectives: string[];
  keyPoints: string[];
  keywords: Record<string, string>;
  miniText: string;
  examples: string[];
  commonMistakes: string[];
  summarySimple: string;
  difficulty: NguVanDifficulty;
  estimatedMinutes: number;
  status: 'draft' | 'ready' | 'archived';
  sortOrder: number;
  isActive: 0 | 1;
};

export type NguVanLessonCard = {
  id: number;
  sourceId: string;
  lessonId: number;
  cardType: string;
  title: string;
  content: string;
  sortOrder: number;
  isActive: 0 | 1;
};

export type NguVanQuestionType = 'single_choice' | 'true_false' | 'short_answer' | 'scenario_choice' | 'writing_prompt';

export type NguVanQuestionOption = {
  key: string;
  text: string;
};

export type NguVanQuestion = {
  id: number;
  sourceId: string;
  lessonId: number;
  questionType: NguVanQuestionType;
  questionText: string;
  options: NguVanQuestionOption[] | null;
  correctAnswer: string;
  answerText: string;
  explanationSimple: string;
  difficulty: NguVanDifficulty;
  skillTag: string;
  tags: string[];
  audioKey?: string;
  audioText?: string;
  isActive: 0 | 1;
};

export type NguVanPracticeQuestionCountOption = PracticeQuestionCountOption;

type NguVanUnitMeta = {
  skillType: string;
  textType: string;
};

const UNIT_META: Record<string, NguVanUnitMeta> = {
  story_folk_modern: { skillType: 'Đọc hiểu truyện', textType: 'Truyện kể' },
  poetry: { skillType: 'Đọc hiểu thơ', textType: 'Thơ' },
  language: { skillType: 'Tiếng Việt', textType: 'Ngôn ngữ' },
  informational: { skillType: 'Đọc hiểu thông tin', textType: 'Văn bản thông tin' },
  writing: { skillType: 'Viết', textType: 'Bài viết' },
  memoir_essay: { skillType: 'Đọc hiểu tùy bút', textType: 'Tùy bút / tản văn' },
  argument: { skillType: 'Nghị luận', textType: 'Văn nghị luận' },
};

const rawLessons = getRawLessons('literature');
const rawQuestions = getRawQuestions('literature');
const questionsByLessonId = groupQuestionsByLesson('literature');
const lessonIdByRawLessonId = new Map<string, number>();

function getUnitMeta(rawLesson: RawLesson) {
  return UNIT_META[rawLesson.unitId] || { skillType: rawLesson.unitTitle, textType: rawLesson.unitTitle };
}

function buildNguVanLesson(rawLesson: RawLesson, lessonId: number, lessonQuestions: RawQuestion[]): NguVanLesson {
  const meta = getUnitMeta(rawLesson);
  const examples = makeGenericExamples(lessonQuestions, rawLesson.title);
  const summarySimple = buildLessonSummary(rawLesson.title, rawLesson.summary, lessonQuestions.length);
  const miniText = normalizeText(rawLesson.summary) || examples[0] || rawLesson.title;

  return {
    id: lessonId,
    sourceId: rawLesson.lessonId,
    grade: 7,
    subjectCode: 'ngu-van',
    unitCode: rawLesson.unitId,
    unitTitle: rawLesson.unitTitle,
    lessonCode: rawLesson.lessonId,
    skillType: meta.skillType,
    textType: meta.textType,
    slug: slugify(rawLesson.title),
    title: rawLesson.title,
    focus: normalizeText(rawLesson.summary) || rawLesson.title,
    objectives: makeGenericObjectives(rawLesson.title, rawLesson.summary, rawLesson.skillTags),
    keyPoints: makeGenericKeyPoints(rawLesson.title, rawLesson.summary, rawLesson.skillTags),
    keywords: makeGenericKeywords(rawLesson.title, rawLesson.summary, rawLesson.unitTitle, rawLesson.skillTags),
    miniText,
    examples,
    commonMistakes: makeGenericMistakes(rawLesson.title),
    summarySimple,
    difficulty: inferDifficulty(lessonQuestions),
    estimatedMinutes: estimateMinutes(lessonQuestions.length, 17),
    status: 'ready',
    sortOrder: lessonId,
    isActive: 1,
  };
}

function buildNguVanLessonCards(rawLesson: RawLesson, lessonId: number, lessonQuestions: RawQuestion[]) {
  const lesson = buildNguVanLesson(rawLesson, lessonId, lessonQuestions);
  return [
    {
      id: lessonId * 10 + 1,
      sourceId: `${rawLesson.lessonId}-intro`,
      lessonId,
      cardType: 'intro',
      title: `Vào bài: ${rawLesson.title}`,
      content: lesson.summarySimple,
      sortOrder: 1,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 2,
      sourceId: `${rawLesson.lessonId}-explain`,
      lessonId,
      cardType: 'explain',
      title: 'Khái niệm chính',
      content: lesson.focus,
      sortOrder: 2,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 3,
      sourceId: `${rawLesson.lessonId}-example`,
      lessonId,
      cardType: 'example',
      title: 'Ngữ liệu luyện đọc',
      content: lesson.miniText,
      sortOrder: 3,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 4,
      sourceId: `${rawLesson.lessonId}-common-mistake`,
      lessonId,
      cardType: 'common_mistake',
      title: 'Lỗi hay gặp',
      content: lesson.commonMistakes.join('\n'),
      sortOrder: 4,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 5,
      sourceId: `${rawLesson.lessonId}-mini-check`,
      lessonId,
      cardType: 'mini_check',
      title: 'Kiểm tra nhanh',
      content: `Em có thể tóm tắt ${rawLesson.title.toLowerCase()} bằng 1-2 câu của mình không?`,
      sortOrder: 5,
      isActive: 1 as const,
    },
  ] satisfies NguVanLessonCard[];
}

export const nguVanLessons: NguVanLesson[] = rawLessons.map((rawLesson, index) => {
  const lessonId = index + 1;
  lessonIdByRawLessonId.set(rawLesson.lessonId, lessonId);
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];
  return buildNguVanLesson(rawLesson, lessonId, lessonQuestions);
});

export const nguVanLessonCards: NguVanLessonCard[] = rawLessons.flatMap((rawLesson, index) => {
  const lessonId = index + 1;
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];
  return buildNguVanLessonCards(rawLesson, lessonId, lessonQuestions);
});

export const nguVanQuestions: NguVanQuestion[] = rawQuestions.map((rawQuestion, index) => ({
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
  audioText: normalizeText(rawQuestion.questionText),
  isActive: 1,
}));

export const nguVanSeed = {
  subjectCode: 'ngu-van' as const,
  subjectTitle: 'Ngữ văn Lớp 7',
  unitTitle: 'Ngữ văn Lớp 7',
  lessons: nguVanLessons,
  lessonCards: nguVanLessonCards,
  questions: nguVanQuestions,
};

export const NGU_VAN_PRACTICE_QUESTION_COUNT_OPTIONS = SHARED_PRACTICE_QUESTION_COUNT_OPTIONS;
export const DEFAULT_NGU_VAN_PRACTICE_QUESTION_COUNT = SHARED_DEFAULT_PRACTICE_QUESTION_COUNT;

export function getActiveNguVanLessons() {
  return nguVanLessons.filter((lesson) => lesson.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getNguVanLessonById(lessonId: number) {
  return nguVanLessons.find((lesson) => lesson.id === lessonId && lesson.isActive);
}

export function getNguVanLessonCards(lessonId: number) {
  return nguVanLessonCards.filter((card) => card.lessonId === lessonId && card.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getNguVanLessonQuestions(lessonId: number) {
  return nguVanQuestions.filter((question) => question.lessonId === lessonId && question.isActive);
}

export function isNguVanPracticeQuestionCountOption(value: number): value is NguVanPracticeQuestionCountOption {
  return isSharedPracticeQuestionCountOption(value);
}

export function getNguVanPracticeSamplingPolicy(questionCount: NguVanPracticeQuestionCountOption) {
  return getSharedPracticeSamplingPolicy(questionCount);
}

export function getNguVanLessonPracticeQuestions(
  lessonId: number,
  targetCount: NguVanPracticeQuestionCountOption = DEFAULT_NGU_VAN_PRACTICE_QUESTION_COUNT,
) {
  const questions = getNguVanLessonQuestions(lessonId);
  const policy = getNguVanPracticeSamplingPolicy(targetCount);
  return pickPracticeQuestions(questions, targetCount, policy as PracticePolicy | null);
}
