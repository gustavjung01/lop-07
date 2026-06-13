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
  makeGenericExamples,
  makeGenericMistakes,
  makeGenericObjectives,
  normalizeText,
  pickPracticeQuestions,
  type Difficulty,
  type PracticeQuestionCountOption,
  type RawLesson,
  type RawQuestion,
  type PracticePolicy,
  isPracticeQuestionCountOption as isSharedPracticeQuestionCountOption,
} from '../shared';

export type MathDifficulty = Difficulty;

export type MathLesson = {
  id: number;
  grade: 7;
  subjectCode: 'math';
  unitCode: string;
  lessonCode: string;
  title: string;
  objective: string;
  summarySimple: string;
  tips: string;
  difficulty: MathDifficulty;
  estimatedMinutes: number;
  status: 'draft' | 'ready' | 'archived';
  sortOrder: number;
  isActive: 0 | 1;
};

export type MathLessonCard = {
  id: number;
  lessonId: number;
  cardType: 'intro' | 'explain' | 'example' | 'tip' | 'mini_check';
  title: string;
  content: string;
  exampleJson: string | null;
  sortOrder: number;
  isActive: 0 | 1;
};

export type MathQuestion = {
  id: number;
  grade: 7;
  subjectCode: 'math';
  lessonId: number;
  questionType: 'single_choice' | 'scenario_choice' | 'true_false' | 'fill_number';
  questionText: string;
  optionsJson: string | null;
  correctAnswer: string;
  explanationSimple: string;
  wrongAnswerExplanations?: Record<string, string>;
  difficulty: MathDifficulty;
  skillTag: string;
  sourceType: 'manual' | 'generated' | 'imported';
  isVerified: 0 | 1;
  isActive: 0 | 1;
};

export type MathPracticeQuestionCountOption = PracticeQuestionCountOption;

const rawLessons = getRawLessons('math');
const rawQuestions = getRawQuestions('math');
const questionsByLessonId = groupQuestionsByLesson('math');

const lessonIdByRawLessonId = new Map<string, number>();

function buildMathObjective(rawLesson: RawLesson) {
  return makeGenericObjectives(rawLesson.title, rawLesson.summary, rawLesson.skillTags).join(' ');
}

function buildMathTips(rawLesson: RawLesson) {
  return makeGenericMistakes(rawLesson.title).join(' ');
}

function buildMathLessonCards(rawLesson: RawLesson, lessonId: number, lessonQuestions: RawQuestion[]) {
  const examples = makeGenericExamples(lessonQuestions, rawLesson.title);
  const baseSourceId = rawLesson.lessonId;
  const hint = 'Sau card mini_check nên hiển thị 1 câu hỏi ngắn.';

  return [
    {
      id: lessonId * 10 + 1,
      lessonId,
      cardType: 'intro' as const,
      title: `Vào bài: ${rawLesson.title}`,
      content: buildLessonSummary(rawLesson.title, rawLesson.summary, lessonQuestions.length),
      exampleJson: JSON.stringify({ sourceId: `${baseSourceId}-intro`, appHint: hint }),
      sortOrder: 1,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 2,
      lessonId,
      cardType: 'explain' as const,
      title: 'Khái niệm chính',
      content: buildMathObjective(rawLesson),
      exampleJson: JSON.stringify({ sourceId: `${baseSourceId}-explain`, appHint: hint }),
      sortOrder: 2,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 3,
      lessonId,
      cardType: 'example' as const,
      title: 'Ví dụ gần gũi',
      content: examples[0] || `Ví dụ ngắn gọn về ${rawLesson.title.toLowerCase()}.`,
      exampleJson: JSON.stringify({ sourceId: `${baseSourceId}-example`, appHint: hint }),
      sortOrder: 3,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 4,
      lessonId,
      cardType: 'tip' as const,
      title: 'Mẹo tránh lỗi',
      content: buildMathTips(rawLesson),
      exampleJson: JSON.stringify({ sourceId: `${baseSourceId}-tip`, appHint: hint }),
      sortOrder: 4,
      isActive: 1 as const,
    },
    {
      id: lessonId * 10 + 5,
      lessonId,
      cardType: 'mini_check' as const,
      title: 'Kiểm tra nhanh',
      content: `Em có thể giải thích ${rawLesson.title.toLowerCase()} bằng một ví dụ riêng của mình không?`,
      exampleJson: JSON.stringify({ sourceId: `${baseSourceId}-mini-check`, appHint: hint }),
      sortOrder: 5,
      isActive: 1 as const,
    },
  ] satisfies MathLessonCard[];
}

export const mathLessons: MathLesson[] = rawLessons.map((rawLesson, index) => {
  const lessonId = index + 1;
  lessonIdByRawLessonId.set(rawLesson.lessonId, lessonId);
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];
  const summarySimple = buildLessonSummary(rawLesson.title, rawLesson.summary, lessonQuestions.length);

  return {
    id: lessonId,
    grade: 7,
    subjectCode: 'math',
    unitCode: rawLesson.unitId,
    lessonCode: rawLesson.lessonId,
    title: rawLesson.title,
    objective: buildMathObjective(rawLesson),
    summarySimple,
    tips: buildMathTips(rawLesson),
    difficulty: inferDifficulty(lessonQuestions),
    estimatedMinutes: estimateMinutes(lessonQuestions.length, 14),
    status: 'ready',
    sortOrder: lessonId,
    isActive: 1,
  };
});

export const mathLessonCards: MathLessonCard[] = rawLessons.flatMap((rawLesson, index) => {
  const lessonId = index + 1;
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];
  return buildMathLessonCards(rawLesson, lessonId, lessonQuestions);
});

export const mathQuestions: MathQuestion[] = rawQuestions.map((rawQuestion, index) => ({
  id: index + 1,
  grade: 7,
  subjectCode: 'math',
  lessonId: lessonIdByRawLessonId.get(rawQuestion.lessonId) ?? 0,
  questionType: 'single_choice',
  questionText: normalizeText(rawQuestion.questionText),
  optionsJson: JSON.stringify(rawQuestion.options),
  correctAnswer: rawQuestion.correctAnswer,
  explanationSimple: rawQuestion.explanation,
  difficulty: rawQuestion.difficulty,
  skillTag: rawQuestion.skillTag,
  sourceType: 'imported',
  isVerified: 1,
  isActive: 1,
}));

export const mathSeed = {
  subjectCode: 'math' as const,
  subjectTitle: 'Toán Lớp 7',
  unitTitle: 'Toán Lớp 7',
  lessons: mathLessons,
  lessonCards: mathLessonCards,
  questions: mathQuestions,
};

export const PRACTICE_QUESTION_COUNT_OPTIONS = SHARED_PRACTICE_QUESTION_COUNT_OPTIONS;
export const DEFAULT_PRACTICE_QUESTION_COUNT = SHARED_DEFAULT_PRACTICE_QUESTION_COUNT;

export function getActiveMathLessons() {
  return mathLessons.filter((lesson) => lesson.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getMathLessonById(lessonId: number) {
  return mathLessons.find((lesson) => lesson.id === lessonId && lesson.isActive);
}

export function getMathLessonCards(lessonId: number) {
  return mathLessonCards.filter((card) => card.lessonId === lessonId && card.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getMathLessonQuestions(lessonId: number) {
  return mathQuestions.filter((question) => question.lessonId === lessonId && question.isActive);
}

export function isPracticeQuestionCountOption(value: number): value is MathPracticeQuestionCountOption {
  return isSharedPracticeQuestionCountOption(value);
}

export function getPracticeSamplingPolicy(questionCount: MathPracticeQuestionCountOption) {
  return getSharedPracticeSamplingPolicy(questionCount);
}

export function getMathLessonPracticeQuestions(
  lessonId: number,
  targetCount: MathPracticeQuestionCountOption = DEFAULT_PRACTICE_QUESTION_COUNT,
) {
  const questions = getMathLessonQuestions(lessonId);
  const policy = getPracticeSamplingPolicy(targetCount);
  return pickPracticeQuestions(questions, targetCount, policy as PracticePolicy | null);
}
