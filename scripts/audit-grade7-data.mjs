import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const LESSONS_PATH = path.join(ROOT_DIR, 'src/data/grade7/raw/grade7_all_lessons_normalized.json');
const QUESTIONS_PATH = path.join(ROOT_DIR, 'src/data/grade7/raw/grade7_all_questions_normalized.json');
const APP_PATH = path.join(ROOT_DIR, 'src/app/Lop7App.tsx');
const OUTPUT_PATH = path.join(ROOT_DIR, 'docs/lop7-data-audit.md');

const SUBJECT_LABELS = {
  math: 'Toán',
  english: 'Tiếng Anh',
  science: 'Khoa học tự nhiên',
  literature: 'Ngữ văn',
  history_geography: 'Lịch sử & Địa lí',
  informatics: 'Tin học',
  technology: 'Công nghệ',
  civic: 'GDCD',
};

const DASHBOARD_CONSTANT_BY_SUBJECT = {
  math: 'MATH_LESSON_COUNT',
  english: 'ENGLISH_LESSON_COUNT',
  science: 'KHTN_LESSON_COUNT',
  literature: 'NGU_VAN_LESSON_COUNT',
  history_geography: 'LICH_SU_DIA_LI_LESSON_COUNT',
  informatics: 'TIN_HOC_LESSON_COUNT',
  technology: 'CONG_NGHE_LESSON_COUNT',
  civic: 'GDCD_LESSON_COUNT',
};

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function countBy(values, keyGetter) {
  const map = new Map();
  for (const value of values) {
    const key = keyGetter(value);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function readDashboardCounts() {
  if (!fs.existsSync(APP_PATH)) return new Map();
  const content = fs.readFileSync(APP_PATH, 'utf8');
  const map = new Map();
  for (const [subjectKey, constantName] of Object.entries(DASHBOARD_CONSTANT_BY_SUBJECT)) {
    const match = content.match(new RegExp(`const\\s+${constantName}\\s*=\\s*(\\d+)`));
    if (match) map.set(subjectKey, Number(match[1]));
  }
  return map;
}

function formatIssueList(items, max = 20) {
  if (!items.length) return 'Không có.';
  const shown = items.slice(0, max).map((item) => `- ${item}`);
  if (items.length > max) shown.push(`- ... còn ${items.length - max} mục nữa`);
  return shown.join('\n');
}

function main() {
  const lessonsBundle = readJson(LESSONS_PATH);
  const questionsBundle = readJson(QUESTIONS_PATH);
  const lessons = lessonsBundle.lessons ?? [];
  const questions = questionsBundle.questions ?? [];

  const lessonCountBySubject = countBy(lessons, (lesson) => lesson.subjectKey);
  const questionCountBySubject = countBy(questions, (question) => question.subjectKey);
  const questionCountByLesson = countBy(questions, (question) => question.lessonId);
  const dashboardCounts = readDashboardCounts();

  const subjectKeys = [...new Set([...lessons.map((lesson) => lesson.subjectKey), ...questions.map((question) => question.subjectKey)])].sort();

  const rows = subjectKeys.map((subjectKey) => {
    const lessonCount = lessonCountBySubject.get(subjectKey) ?? 0;
    const questionCount = questionCountBySubject.get(subjectKey) ?? 0;
    const avg = lessonCount ? (questionCount / lessonCount).toFixed(1) : '0.0';
    const dashboardCount = dashboardCounts.get(subjectKey);
    const dashboardStatus = dashboardCount == null ? 'Chưa đọc được' : dashboardCount === lessonCount ? 'Khớp' : `Lệch: UI ${dashboardCount}`;
    return `| ${SUBJECT_LABELS[subjectKey] ?? subjectKey} | ${lessonCount} | ${questionCount} | ${avg} | ${dashboardStatus} |`;
  });

  const lessonsWithoutQuestions = lessons
    .filter((lesson) => (questionCountByLesson.get(lesson.lessonId) ?? 0) === 0)
    .map((lesson) => `${lesson.subject} / ${lesson.lessonId}: ${lesson.title}`);

  const lessonsUnderTenQuestions = lessons
    .filter((lesson) => {
      const count = questionCountByLesson.get(lesson.lessonId) ?? 0;
      return count > 0 && count < 10;
    })
    .map((lesson) => `${lesson.subject} / ${lesson.lessonId}: ${lesson.title} (${questionCountByLesson.get(lesson.lessonId) ?? 0} câu)`);

  const missingSummary = lessons
    .filter((lesson) => !String(lesson.summary ?? '').trim())
    .map((lesson) => `${lesson.subject} / ${lesson.lessonId}: ${lesson.title}`);

  const shortSummary = lessons
    .filter((lesson) => String(lesson.summary ?? '').trim().length > 0 && String(lesson.summary ?? '').trim().length < 40)
    .map((lesson) => `${lesson.subject} / ${lesson.lessonId}: ${lesson.title}`);

  const shortTitle = lessons
    .filter((lesson) => String(lesson.title ?? '').trim().length < 8)
    .map((lesson) => `${lesson.subject} / ${lesson.lessonId}: ${lesson.title}`);

  const lessonsWithoutTextbookMap = lessons.filter((lesson) => lesson.textbookMap == null);
  const questionsWithoutTextbookMap = questions.filter((question) => question.textbookMap == null);

  const questionsMissingAnswer = questions
    .filter((question) => !String(question.correctAnswer ?? '').trim())
    .map((question) => `${question.subject} / ${question.questionId}`);

  const questionsMissingExplanation = questions
    .filter((question) => !String(question.explanation ?? '').trim())
    .map((question) => `${question.subject} / ${question.questionId}`);

  const questionsMissingOptions = questions
    .filter((question) => !Array.isArray(question.options) || question.options.length < 2)
    .map((question) => `${question.subject} / ${question.questionId}`);

  const dashboardMismatches = subjectKeys
    .filter((subjectKey) => dashboardCounts.has(subjectKey) && dashboardCounts.get(subjectKey) !== (lessonCountBySubject.get(subjectKey) ?? 0))
    .map((subjectKey) => `${SUBJECT_LABELS[subjectKey] ?? subjectKey}: raw ${lessonCountBySubject.get(subjectKey) ?? 0}, UI ${dashboardCounts.get(subjectKey)}`);

  const generatedAt = new Date().toISOString();
  const markdown = `# Audit data Lớp 7\n\nGenerated at: ${generatedAt}\n\n## Tổng quan\n\n- Raw lessons meta recordCount: ${lessonsBundle.meta?.recordCount ?? 'unknown'}\n- Lessons parsed: ${lessons.length}\n- Raw questions meta recordCount: ${questionsBundle.meta?.recordCount ?? 'unknown'}\n- Questions parsed: ${questions.length}\n\n## Theo môn\n\n| Môn | Bài/chủ đề | Câu hỏi | Câu hỏi/bài | Dashboard |\n|---|---:|---:|---:|---|\n${rows.join('\n')}\n\n## Cảnh báo chính\n\n### Dashboard lệch số bài\n\n${formatIssueList(dashboardMismatches)}\n\n### Bài không có câu hỏi\n\n${formatIssueList(lessonsWithoutQuestions)}\n\n### Bài dưới 10 câu hỏi\n\n${formatIssueList(lessonsUnderTenQuestions)}\n\n### Bài thiếu summary\n\n${formatIssueList(missingSummary)}\n\n### Bài có summary quá ngắn\n\n${formatIssueList(shortSummary)}\n\n### Bài có title quá ngắn\n\n${formatIssueList(shortTitle)}\n\n### Textbook map\n\n- Lessons textbookMap null: ${lessonsWithoutTextbookMap.length}/${lessons.length}\n- Questions textbookMap null: ${questionsWithoutTextbookMap.length}/${questions.length}\n\n### Câu hỏi thiếu đáp án/giải thích/options\n\n- Missing correctAnswer: ${questionsMissingAnswer.length}\n- Missing explanation: ${questionsMissingExplanation.length}\n- Missing options hoặc options < 2: ${questionsMissingOptions.length}\n\n## Gợi ý xử lý\n\n1. Giữ nguyên raw data.\n2. Sửa dashboard để lấy số bài từ data thật thay vì hard-code.\n3. Bổ sung data làm dày vào \`src/data/grade7/enriched/\`, theo batch 5-10 bài.\n4. Ưu tiên enrich Toán trước, sau đó KHTN và Tiếng Anh.\n`;

  ensureDir(OUTPUT_PATH);
  fs.writeFileSync(OUTPUT_PATH, markdown, 'utf8');
  console.log(`Wrote ${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
}

main();
