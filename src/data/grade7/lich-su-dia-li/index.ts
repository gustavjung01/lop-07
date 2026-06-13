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

export type LichSuDiaLiDifficulty = Difficulty;
export type LichSuDiaLiSubjectPart = 'lich_su' | 'dia_li';

export type LichSuDiaLiLesson = {
  id: number;
  sourceId: string;
  grade: 7;
  subjectCode: 'lich-su-dia-li';
  subjectPart: LichSuDiaLiSubjectPart;
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
  timeline: string[];
  mapSkills: string[];
  summarySimple: string;
  difficulty: LichSuDiaLiDifficulty;
  estimatedMinutes: number;
  status: 'draft' | 'ready' | 'archived';
  sortOrder: number;
  isActive: 0 | 1;
};

export type LichSuDiaLiLessonCard = {
  id: number;
  sourceId: string;
  lessonId: number;
  cardType: string;
  title: string;
  content: string;
  sortOrder: number;
  isActive: 0 | 1;
};

export type LichSuDiaLiQuestionType = 'single_choice' | 'true_false' | 'short_answer' | 'scenario_choice';

export type LichSuDiaLiQuestionOption = {
  key: string;
  text: string;
};

export type LichSuDiaLiQuestion = {
  id: number;
  sourceId: string;
  lessonId: number;
  questionType: LichSuDiaLiQuestionType;
  questionText: string;
  options: LichSuDiaLiQuestionOption[] | null;
  correctAnswer: string;
  answerText: string;
  explanationSimple: string;
  difficulty: LichSuDiaLiDifficulty;
  skillTag: string;
  tags: string[];
  isActive: 0 | 1;
};

export type LichSuDiaLiPracticeQuestionCountOption = PracticeQuestionCountOption;

const rawLessons = getRawLessons('history_geography');
const rawQuestions = getRawQuestions('history_geography');
const questionsByLessonId = groupQuestionsByLesson('history_geography');
const lessonIdByRawLessonId = new Map<string, number>();

function getSubjectPart(rawLesson: RawLesson): LichSuDiaLiSubjectPart {
  return rawLesson.unitId.startsWith('history') ? 'lich_su' : 'dia_li';
}

function buildTimeline(rawLesson: RawLesson, lessonQuestions: RawQuestion[]) {
  const entries = [
    normalizeText(rawLesson.summary) ? `Bối cảnh: ${normalizeText(rawLesson.summary)}` : `Bối cảnh: ${rawLesson.title}`,
    lessonQuestions[0]?.questionText ? `Mốc / dữ kiện: ${lessonQuestions[0].questionText}` : `Mốc / dữ kiện chính: ${rawLesson.title}`,
    lessonQuestions[1]?.correctOptionText ? `Ý nghĩa / kết quả: ${lessonQuestions[1].correctOptionText}` : `Ý nghĩa / kết quả: ${rawLesson.unitTitle}`,
  ];
  return entries.map((entry) => entry.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 3);
}

function buildMapSkills(rawLesson: RawLesson, lessonQuestions: RawQuestion[]) {
  const entries = [
    `Đọc và xác định ${rawLesson.unitTitle.toLowerCase()}.`,
    lessonQuestions[0]?.questionText ? `Quan sát dữ kiện từ câu: ${lessonQuestions[0].questionText}` : 'Xác định vị trí, thời gian và mối liên hệ.',
    lessonQuestions[1]?.correctOptionText ? `Liên hệ kết quả với bối cảnh: ${lessonQuestions[1].correctOptionText}` : 'Đọc kí hiệu, hướng và không gian trên bản đồ.',
  ];
  return entries.map((entry) => entry.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 3);
}

function buildLichSuDiaLiLesson(rawLesson: RawLesson, lessonId: number, lessonQuestions: RawQuestion[]): LichSuDiaLiLesson {
  const subjectPart = getSubjectPart(rawLesson);
  const timeline = subjectPart === 'lich_su' ? buildTimeline(rawLesson, lessonQuestions) : [];
  const mapSkills = subjectPart === 'dia_li' ? buildMapSkills(rawLesson, lessonQuestions) : [];
  const summarySimple = buildLessonSummary(rawLesson.title, rawLesson.summary, lessonQuestions.length);
  return {
    id: lessonId,
    sourceId: rawLesson.lessonId,
    grade: 7,
    subjectCode: 'lich-su-dia-li',
    subjectPart,
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
    timeline,
    mapSkills,
    summarySimple,
    difficulty: inferDifficulty(lessonQuestions),
    estimatedMinutes: estimateMinutes(lessonQuestions.length, 17),
    status: 'ready',
    sortOrder: lessonId,
    isActive: 1,
  };
}

function buildLichSuDiaLiLessonCards(rawLesson: RawLesson, lessonId: number, lessonQuestions: RawQuestion[]) {
  const lesson = buildLichSuDiaLiLesson(rawLesson, lessonId, lessonQuestions);
  const focusItems = lesson.subjectPart === 'lich_su' ? lesson.timeline : lesson.mapSkills;
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
      content: lesson.keyPoints.join('\n'),
      sortOrder: 2,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 3,
      sourceId: `${rawLesson.lessonId}-example`,
      lessonId,
      cardType: 'example',
      title: lesson.subjectPart === 'lich_su' ? 'Mốc / chứng cứ' : 'Bản đồ / địa lí',
      content: focusItems.length ? focusItems.join('\n') : lesson.examples.join('\n'),
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
      content: `Em có thể tóm tắt ${rawLesson.title.toLowerCase()} bằng 1 mốc, 1 ý nghĩa hoặc 1 kĩ năng bản đồ không?`,
      sortOrder: 5,
      isActive: 1 as const,
    },
  ] satisfies LichSuDiaLiLessonCard[];
}

export const lichSuDiaLiLessons: LichSuDiaLiLesson[] = rawLessons.map((rawLesson, index) => {
  const lessonId = index + 1;
  lessonIdByRawLessonId.set(rawLesson.lessonId, lessonId);
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];
  return buildLichSuDiaLiLesson(rawLesson, lessonId, lessonQuestions);
});

export const lichSuDiaLiLessonCards: LichSuDiaLiLessonCard[] = rawLessons.flatMap((rawLesson, index) => {
  const lessonId = index + 1;
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];
  return buildLichSuDiaLiLessonCards(rawLesson, lessonId, lessonQuestions);
});

export const lichSuDiaLiQuestions: LichSuDiaLiQuestion[] = rawQuestions.map((rawQuestion, index) => ({
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

export const lichSuDiaLiSeed = {
  subjectCode: 'lich-su-dia-li' as const,
  subjectTitle: 'Lịch sử & Địa lí Lớp 7',
  unitTitle: 'Lịch sử & Địa lí Lớp 7',
  lessons: lichSuDiaLiLessons,
  lessonCards: lichSuDiaLiLessonCards,
  questions: lichSuDiaLiQuestions,
};

export const LICH_SU_DIA_LI_PRACTICE_QUESTION_COUNT_OPTIONS = SHARED_PRACTICE_QUESTION_COUNT_OPTIONS;
export const DEFAULT_LICH_SU_DIA_LI_PRACTICE_QUESTION_COUNT = SHARED_DEFAULT_PRACTICE_QUESTION_COUNT;

export function getActiveLichSuDiaLiLessons() {
  return lichSuDiaLiLessons.filter((lesson) => lesson.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getLichSuDiaLiLessonById(lessonId: number) {
  return lichSuDiaLiLessons.find((lesson) => lesson.id === lessonId && lesson.isActive);
}

export function getLichSuDiaLiLessonCards(lessonId: number) {
  return lichSuDiaLiLessonCards.filter((card) => card.lessonId === lessonId && card.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getLichSuDiaLiLessonQuestions(lessonId: number) {
  return lichSuDiaLiQuestions.filter((question) => question.lessonId === lessonId && question.isActive);
}

export function isLichSuDiaLiPracticeQuestionCountOption(value: number): value is LichSuDiaLiPracticeQuestionCountOption {
  return isSharedPracticeQuestionCountOption(value);
}

export function getLichSuDiaLiPracticeSamplingPolicy(questionCount: LichSuDiaLiPracticeQuestionCountOption) {
  return getSharedPracticeSamplingPolicy(questionCount);
}

export function getLichSuDiaLiLessonPracticeQuestions(
  lessonId: number,
  targetCount: LichSuDiaLiPracticeQuestionCountOption = DEFAULT_LICH_SU_DIA_LI_PRACTICE_QUESTION_COUNT,
) {
  const questions = getLichSuDiaLiLessonQuestions(lessonId);
  const policy = getLichSuDiaLiPracticeSamplingPolicy(targetCount);
  return pickPracticeQuestions(questions, targetCount, policy as PracticePolicy | null);
}
