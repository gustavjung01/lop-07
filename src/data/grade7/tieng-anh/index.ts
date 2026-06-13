import {
  DEFAULT_PRACTICE_QUESTION_COUNT as SHARED_DEFAULT_PRACTICE_QUESTION_COUNT,
  PRACTICE_QUESTION_COUNT_OPTIONS as SHARED_PRACTICE_QUESTION_COUNT_OPTIONS,
  estimateMinutes,
  getPracticeSamplingPolicy as getSharedPracticeSamplingPolicy,
  getRawLessons,
  getRawQuestions,
  groupQuestionsByLesson,
  inferDifficulty,
  isPracticeQuestionCountOption as isSharedPracticeQuestionCountOption,
  normalizeText,
  pickPracticeQuestions,
  slugify,
  type Difficulty,
  type PracticeQuestionCountOption,
  type RawLesson,
  type PracticePolicy,
} from '../shared';

function normalizeEnglishAudioText(value: string) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

function slugifyEnglishAudioText(value: string) {
  return normalizeEnglishAudioText(value)
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function shortHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function buildEnglishAudioSourceId(sourceType: 'lesson-card' | 'question' | 'vocabulary-word' | 'question-option' | 'vietnamese-gloss', text: string) {
  const normalized = normalizeEnglishAudioText(text);
  if (!normalized) return '';
  const slug = slugifyEnglishAudioText(normalized) || 'item';
  return `${slug}-${shortHash(`${sourceType}:${normalized.toLowerCase()}`)}`;
}

export type EnglishDifficulty = Difficulty;

export type EnglishLessonType = 'vocabulary' | 'grammar' | 'skills';

export type EnglishLesson = {
  id: number;
  sourceId: string;
  grade: 7;
  subjectCode: 'tieng-anh';
  unitCode: string;
  unitNumber: number;
  unitTitle: string;
  lessonCode: string;
  lessonType: EnglishLessonType;
  slug: string;
  title: string;
  topic: string;
  objectives: string[];
  vocabulary: Record<string, string>;
  grammarFocus: Array<{ name: string; rule: string }>;
  communicationPatterns: Array<{ question: string; answer: string }>;
  summarySimple: string;
  difficulty: EnglishDifficulty;
  estimatedMinutes: number;
  status: 'draft' | 'ready' | 'archived';
  sortOrder: number;
  isActive: 0 | 1;
};

export type EnglishLessonCard = {
  id: number;
  sourceId: string;
  lessonId: number;
  cardType: 'intro' | 'explain' | 'example' | 'tip' | 'common_mistake' | 'mini_check' | 'recap';
  title: string;
  content: string;
  sortOrder: number;
  isActive: 0 | 1;
  audioKey?: string;
  audioText?: string;
};

export type EnglishQuestionType = 'single_choice' | 'true_false' | 'fill_text' | 'reorder_sentence' | 'writing_prompt';

export type EnglishQuestionOption = {
  key: string;
  text: string;
};

export type EnglishQuestion = {
  id: number;
  sourceId: string;
  lessonId: number;
  questionType: EnglishQuestionType;
  questionText: string;
  options: EnglishQuestionOption[] | null;
  correctAnswer: string;
  answerText: string;
  explanationSimple: string;
  difficulty: EnglishDifficulty;
  skillTag: string;
  tags: string[];
  audioKey?: string;
  audioText?: string;
  isActive: 0 | 1;
};

export type EnglishPracticeQuestionCountOption = PracticeQuestionCountOption;

type EnglishLessonPreset = {
  topic: string;
  lessonType: EnglishLessonType;
  vocabulary: Record<string, string>;
  grammarFocus: Array<{ name: string; rule: string }>;
  communicationPatterns: Array<{ question: string; answer: string }>;
  introText: string;
  tipText: string;
  commonMistakes: string[];
};

const ENGLISH_PRESETS: Record<string, EnglishLessonPreset> = {
  'Hobbies and Free Time': {
    topic: 'Sở thích và thời gian rảnh',
    lessonType: 'vocabulary',
    vocabulary: {
      hobbies: 'sở thích',
      'free time': 'thời gian rảnh',
      enjoy: 'thích, tận hưởng',
      relax: 'thư giãn',
      weekend: 'cuối tuần',
    },
    grammarFocus: [
      { name: 'like/love + V-ing', rule: 'Dùng để nói về điều mình thích làm trong thời gian rảnh.' },
      { name: 'Present simple', rule: 'Dùng để nói thói quen và hoạt động thường ngày.' },
    ],
    communicationPatterns: [
      { question: 'What do you do in your free time?', answer: 'I like reading, drawing, or playing games.' },
      { question: 'Do you enjoy ...?', answer: 'Yes, I do. / No, I do not.' },
      { question: 'What are your hobbies?', answer: 'My hobbies are ...' },
    ],
    introText: 'Từ vựng và mẫu câu về hobbies and free time.',
    tipText: 'Học theo cụm từ, rồi đặt ngay vào câu ngắn của chính em.',
    commonMistakes: ['Nhầm like với likes khi nói về I/He/She.', 'Học từ rời rạc mà không ghép thành câu.', 'Quên thêm V-ing sau like/love.'],
  },
  'Healthy Living': {
    topic: 'Lối sống lành mạnh',
    lessonType: 'grammar',
    vocabulary: {
      healthy: 'khỏe mạnh',
      exercise: 'tập thể dục',
      sleep: 'ngủ',
      water: 'nước',
      vegetables: 'rau xanh',
    },
    grammarFocus: [
      { name: 'should / should not', rule: 'Dùng để đưa lời khuyên và nói điều nên làm / không nên làm.' },
      { name: 'Imperatives', rule: 'Dùng mệnh lệnh ngắn để nhắc việc tốt cho sức khỏe.' },
    ],
    communicationPatterns: [
      { question: 'What should we do to stay healthy?', answer: 'We should eat well and exercise regularly.' },
      { question: 'How often do you exercise?', answer: 'I usually exercise ...' },
      { question: 'Should we drink enough water?', answer: 'Yes, we should.' },
    ],
    introText: 'Từ vựng và cấu trúc để nói về cách sống khỏe mạnh.',
    tipText: 'Khi đưa lời khuyên, hãy nhớ cặp should / should not thật rõ.',
    commonMistakes: ['Nhầm should với must trong mọi tình huống.', 'Dùng sai dạng động từ sau should.', 'Quên nói theo ngữ cảnh thực tế.'],
  },
  'Community Service': {
    topic: 'Việc tốt cho cộng đồng',
    lessonType: 'skills',
    vocabulary: {
      volunteer: 'tình nguyện',
      help: 'giúp đỡ',
      community: 'cộng đồng',
      donate: 'quyên góp',
      collect: 'thu gom',
    },
    grammarFocus: [
      { name: 'can / could', rule: 'Dùng để đề nghị giúp đỡ hoặc xin phép lịch sự.' },
      { name: 'Present simple', rule: 'Dùng để nói hành động phục vụ cộng đồng và thói quen tốt.' },
    ],
    communicationPatterns: [
      { question: 'Can I help you?', answer: 'Yes, please. You can ...' },
      { question: 'What can we do for the community?', answer: 'We can help, donate, and clean up.' },
      { question: 'Would you like to volunteer?', answer: 'Yes, I would.' },
    ],
    introText: 'Cách nói về hoạt động tình nguyện và việc tốt cho cộng đồng.',
    tipText: 'Kết nối từ vựng với tình huống thật để nói tự nhiên hơn.',
    commonMistakes: ['Nhầm can với could trong mọi ngữ cảnh.', 'Chỉ nhớ từ mà quên mẫu câu.', 'Không gắn hoạt động với hành động cụ thể.'],
  },
  'Music and Arts': {
    topic: 'Âm nhạc và nghệ thuật',
    lessonType: 'vocabulary',
    vocabulary: {
      music: 'âm nhạc',
      art: 'nghệ thuật',
      song: 'bài hát',
      paint: 'vẽ, sơn',
      performance: 'buổi biểu diễn',
    },
    grammarFocus: [
      { name: 'like / love + V-ing', rule: 'Dùng để nói sở thích về âm nhạc và nghệ thuật.' },
      { name: 'Adjectives', rule: 'Dùng tính từ để miêu tả cảm xúc, phong cách và tác phẩm.' },
    ],
    communicationPatterns: [
      { question: 'What kind of music do you like?', answer: 'I like pop / folk / classical music.' },
      { question: 'Do you enjoy painting?', answer: 'Yes, I do. It is relaxing.' },
      { question: 'Who is your favorite singer?', answer: 'My favorite singer is ...' },
    ],
    introText: 'Từ vựng chủ đề âm nhạc, hội họa và nghệ thuật biểu diễn.',
    tipText: 'Học từ theo nhóm: nhạc, tranh, biểu diễn, cảm xúc.',
    commonMistakes: ['Nhầm art với artist.', 'Thiếu mạo từ hoặc từ nối trong câu nói.', 'Ghép từ không đúng ngữ cảnh nghệ thuật.'],
  },
  'Food and Drink': {
    topic: 'Đồ ăn và thức uống',
    lessonType: 'vocabulary',
    vocabulary: {
      food: 'thức ăn',
      drink: 'đồ uống',
      meal: 'bữa ăn',
      healthy: 'lành mạnh',
      delicious: 'ngon',
    },
    grammarFocus: [
      { name: 'Countable / uncountable nouns', rule: 'Phân biệt danh từ đếm được và không đếm được trong món ăn, đồ uống.' },
      { name: 'some / any', rule: 'Dùng some/any khi hỏi và nói về số lượng thực phẩm.' },
    ],
    communicationPatterns: [
      { question: 'What would you like to eat?', answer: "I'd like some rice and vegetables." },
      { question: 'Is there any water?', answer: 'Yes, there is. / No, there is not.' },
      { question: 'Do you like healthy food?', answer: 'Yes, I do.' },
    ],
    introText: 'Từ vựng và mẫu câu cơ bản về bữa ăn, món ăn và đồ uống.',
    tipText: 'Khi nói về món ăn, nhớ ghép với some/any và lượng từ phù hợp.',
    commonMistakes: ['Nhầm countable với uncountable.', 'Bỏ quên some/any trong câu hỏi.', 'Chỉ gọi tên món ăn mà không đặt vào câu hoàn chỉnh.'],
  },
  'Places in Town': {
    topic: 'Địa điểm trong thị trấn',
    lessonType: 'skills',
    vocabulary: {
      park: 'công viên',
      market: 'chợ',
      library: 'thư viện',
      bank: 'ngân hàng',
      neighbourhood: 'khu phố',
    },
    grammarFocus: [
      { name: 'Prepositions of place', rule: 'Dùng near, next to, between, opposite để chỉ vị trí.' },
      { name: 'Asking for directions', rule: 'Hỏi đường bằng câu ngắn và lịch sự.' },
    ],
    communicationPatterns: [
      { question: 'Where is the park?', answer: "It is near the library." },
      { question: 'How can I get to the market?', answer: 'Go straight and turn left.' },
      { question: 'Is there a bank nearby?', answer: 'Yes, there is.' },
    ],
    introText: 'Cách nói về địa điểm và hỏi đường trong thị trấn.',
    tipText: 'Khi chỉ đường, hãy dùng động từ và giới từ thật ngắn, thật rõ.',
    commonMistakes: ['Nhầm between với next to.', 'Không dùng động từ chỉ hướng.', 'Quên giữ trật tự câu hỏi.'],
  },
  'Traffic and Road Safety': {
    topic: 'Giao thông và an toàn đường bộ',
    lessonType: 'grammar',
    vocabulary: {
      traffic: 'giao thông',
      helmet: 'mũ bảo hiểm',
      crosswalk: 'vạch qua đường',
      road: 'đường',
      safe: 'an toàn',
    },
    grammarFocus: [
      { name: 'must / must not', rule: 'Dùng để nói quy định và lời nhắc bắt buộc trong giao thông.' },
      { name: 'Imperatives', rule: 'Dùng mệnh lệnh ngắn để nhắc an toàn đường bộ.' },
    ],
    communicationPatterns: [
      { question: 'What must we do on the road?', answer: 'We must wear a helmet and follow the signals.' },
      { question: 'Can I cross here?', answer: 'Cross at the crosswalk, please.' },
      { question: 'Should we run on the road?', answer: 'No, we must not.' },
    ],
    introText: 'Từ vựng và câu cảnh báo về giao thông an toàn.',
    tipText: 'Nhớ dùng must/must not khi nói về quy tắc an toàn.',
    commonMistakes: ['Nhầm must với should khi nói luật lệ.', 'Quên từ chỉ vị trí khi nói qua đường.', 'Dùng câu quá dài trong tình huống khẩn.'],
  },
  'Films and Media': {
    topic: 'Phim ảnh và truyền thông',
    lessonType: 'skills',
    vocabulary: {
      film: 'phim',
      media: 'truyền thông',
      actor: 'diễn viên',
      channel: 'kênh',
      review: 'đánh giá',
    },
    grammarFocus: [
      { name: 'Past simple', rule: 'Dùng để kể điều đã xem hoặc đã làm trong quá khứ.' },
      { name: 'Giving opinions', rule: 'Dùng câu ngắn để nêu ý kiến về phim và chương trình.' },
    ],
    communicationPatterns: [
      { question: 'What did you watch yesterday?', answer: 'I watched a movie / a video.' },
      { question: 'What do you think about the film?', answer: "It's interesting / boring / exciting." },
      { question: 'Who is your favorite actor?', answer: 'My favorite actor is ...' },
    ],
    introText: 'Nói về phim, chương trình và cách bày tỏ ý kiến đơn giản.',
    tipText: 'Khi kể chuyện đã xem, hãy nhớ dấu hiệu quá khứ trong câu.',
    commonMistakes: ['Lẫn giữa hiện tại và quá khứ.', 'Dùng opinion words quá chung chung.', 'Thiếu chủ ngữ khi nêu nhận xét.'],
  },
  'Festivals and Celebrations': {
    topic: 'Lễ hội và ngày kỉ niệm',
    lessonType: 'vocabulary',
    vocabulary: {
      festival: 'lễ hội',
      celebration: 'buổi kỉ niệm',
      tradition: 'truyền thống',
      decorate: 'trang trí',
      lucky: 'may mắn',
    },
    grammarFocus: [
      { name: 'will / going to', rule: 'Dùng để nói kế hoạch, dự định và hoạt động sắp diễn ra.' },
      { name: 'Adjectives', rule: 'Dùng tính từ để mô tả không khí lễ hội và cảm xúc.' },
    ],
    communicationPatterns: [
      { question: 'How do people celebrate?', answer: 'They decorate, dance, and share food.' },
      { question: 'What are you going to do?', answer: "I'm going to join the celebration." },
      { question: 'Do you like festivals?', answer: 'Yes, I do. They are fun.' },
    ],
    introText: 'Từ vựng về lễ hội, truyền thống và không khí vui tươi.',
    tipText: 'Học từ theo bối cảnh lễ hội sẽ dễ nhớ và dễ dùng hơn.',
    commonMistakes: ['Nhầm celebration với festival.', 'Quên nối câu khi nói kế hoạch.', 'Dùng tính từ không hợp ngữ cảnh.'],
  },
  'Energy and the Environment': {
    topic: 'Năng lượng và môi trường',
    lessonType: 'grammar',
    vocabulary: {
      energy: 'năng lượng',
      environment: 'môi trường',
      recycle: 'tái chế',
      reduce: 'giảm bớt',
      save: 'tiết kiệm',
    },
    grammarFocus: [
      { name: 'should / must', rule: 'Dùng để khuyên và nhắc việc bảo vệ môi trường.' },
      { name: 'Verb + object', rule: 'Ghép động từ với hành động cụ thể: save energy, recycle paper.' },
    ],
    communicationPatterns: [
      { question: 'How can we protect the environment?', answer: 'We should reduce waste and recycle.' },
      { question: 'What should we do?', answer: 'We should save energy and water.' },
      { question: 'Do you recycle paper?', answer: 'Yes, I do.' },
    ],
    introText: 'Từ vựng và câu khuyên về năng lượng, tái chế và môi trường.',
    tipText: 'Hãy gắn mỗi động từ với một hành động cụ thể ngoài đời.',
    commonMistakes: ['Nhầm reduce với reuse.', 'Nói lời khuyên quá chung chung.', 'Quên dùng đúng động từ sau should.'],
  },
  'Travelling and Future Transport': {
    topic: 'Du lịch và phương tiện tương lai',
    lessonType: 'skills',
    vocabulary: {
      travel: 'du lịch',
      future: 'tương lai',
      transport: 'phương tiện',
      journey: 'chuyến đi',
      airport: 'sân bay',
    },
    grammarFocus: [
      { name: 'will / be going to', rule: 'Dùng để nói dự định và dự đoán về tương lai.' },
      { name: 'Comparatives', rule: 'Dùng để so sánh phương tiện, chuyến đi và lựa chọn.' },
    ],
    communicationPatterns: [
      { question: 'How will we travel in the future?', answer: 'We will travel by fast and safe transport.' },
      { question: 'Where are you going to go?', answer: "I'm going to go to ..." },
      { question: 'What is the best transport?', answer: 'I think ... is the best.' },
    ],
    introText: 'Nói về chuyến đi, kế hoạch tương lai và phương tiện mới.',
    tipText: 'Dùng will / going to đúng chỗ để câu nói nghe tự nhiên hơn.',
    commonMistakes: ['Nhầm will với going to.', 'So sánh không rõ đối tượng.', 'Dịch từng từ mà không ghép thành ý.'],
  },
  'English-speaking Countries and World Cultures': {
    topic: 'Các nước nói tiếng Anh và văn hóa thế giới',
    lessonType: 'skills',
    vocabulary: {
      country: 'quốc gia',
      culture: 'văn hóa',
      world: 'thế giới',
      tradition: 'truyền thống',
      festival: 'lễ hội',
    },
    grammarFocus: [
      { name: 'Comparatives', rule: 'Dùng để so sánh quốc gia, thành phố và phong tục.' },
      { name: 'Describing places', rule: 'Dùng câu miêu tả ngắn để nói về văn hóa và con người.' },
    ],
    communicationPatterns: [
      { question: 'What do you know about the country?', answer: 'It has interesting culture and traditions.' },
      { question: 'How is it different?', answer: "It's different from my country because ..." },
      { question: 'Do you like world cultures?', answer: 'Yes, I do. They are fascinating.' },
    ],
    introText: 'Nói về văn hóa, phong tục và điểm đặc trưng của các nước nói tiếng Anh.',
    tipText: 'Học theo cặp so sánh và mô tả để dễ mở rộng câu.',
    commonMistakes: ['Nói chung chung mà không có chi tiết.', 'Lẫn country với culture.', 'Dùng so sánh thiếu tiêu chí.'],
  },
};

function makeEnglishPreset(rawLesson: RawLesson, index: number): EnglishLessonPreset {
  const preset = ENGLISH_PRESETS[rawLesson.title];
  if (preset) return preset;

  const fallbackTopic = normalizeText(rawLesson.title) || `Chủ đề ${index + 1}`;
  return {
    topic: fallbackTopic,
    lessonType: index < 4 ? 'vocabulary' : index < 8 ? 'grammar' : 'skills',
    vocabulary: {
      topic: fallbackTopic.toLowerCase(),
      practice: 'luyện tập',
      speak: 'nói',
      remember: 'ghi nhớ',
    },
    grammarFocus: [
      { name: 'Mẫu câu', rule: `Dùng câu ngắn để nói về ${fallbackTopic.toLowerCase()}.` },
      { name: 'Từ vựng theo cụm', rule: 'Học từng cụm thay vì học từng từ rời.' },
    ],
    communicationPatterns: [
      { question: `What is ${fallbackTopic}?`, answer: `It is about ${fallbackTopic.toLowerCase()}.` },
      { question: 'Can you say one sentence?', answer: 'Yes, I can.' },
      { question: 'Do you remember the topic?', answer: 'Yes, I do.' },
    ],
    introText: `Chủ đề ${fallbackTopic.toLowerCase()}.`,
    tipText: 'Học theo cụm và nói thành câu ngắn để nhớ lâu hơn.',
    commonMistakes: ['Nhầm nghĩa từ gần giống.', 'Quên nối từ thành câu.', 'Học xong nhưng không luyện nói lại.'],
  };
}

function makeEnglishObjectives(topic: string, lessonType: EnglishLessonType) {
  const lessonTypeLabel = lessonType === 'vocabulary' ? 'từ vựng' : lessonType === 'grammar' ? 'ngữ pháp' : 'kĩ năng giao tiếp';
  return [
    `Nhận biết và ghi nhớ từ vựng về ${topic.toLowerCase()}.`,
    `Luyện dùng ${lessonTypeLabel} trong câu ngắn và tình huống thực tế.`,
    'Tự tin làm bài luyện tập và nói lại ý chính bằng câu đơn giản.',
  ];
}

function makeEnglishSummary(topic: string, questionCount: number) {
  return `${topic}. Có ${questionCount} câu luyện tập để em ôn chắc từng mẫu câu và từ vựng.`;
}

function makeEnglishCardSourceId(audioText: string) {
  return buildEnglishAudioSourceId('lesson-card', audioText);
}

function makeEnglishQuestionSourceId(questionText: string) {
  return buildEnglishAudioSourceId('question', questionText);
}

const rawLessons = getRawLessons('english');
const rawQuestions = getRawQuestions('english');
const questionsByLessonId = groupQuestionsByLesson('english');
const lessonIdByRawLessonId = new Map<string, number>();

export const englishLessons: EnglishLesson[] = rawLessons.map((rawLesson, index) => {
  const lessonId = index + 1;
  lessonIdByRawLessonId.set(rawLesson.lessonId, lessonId);
  const preset = makeEnglishPreset(rawLesson, index);
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];

  return {
    id: lessonId,
    sourceId: rawLesson.lessonId,
    grade: 7,
    subjectCode: 'tieng-anh',
    unitCode: rawLesson.unitId,
    unitNumber: index + 1,
    unitTitle: rawLesson.unitTitle || preset.topic,
    lessonCode: rawLesson.lessonId,
    lessonType: preset.lessonType,
    slug: slugify(rawLesson.title),
    title: rawLesson.title,
    topic: preset.topic,
    objectives: makeEnglishObjectives(preset.topic, preset.lessonType),
    vocabulary: preset.vocabulary,
    grammarFocus: preset.grammarFocus,
    communicationPatterns: preset.communicationPatterns,
    summarySimple: makeEnglishSummary(preset.topic, lessonQuestions.length),
    difficulty: inferDifficulty(lessonQuestions),
    estimatedMinutes: estimateMinutes(lessonQuestions.length, 18),
    status: 'ready',
    sortOrder: lessonId,
    isActive: 1,
  };
});

export const englishLessonCards: EnglishLessonCard[] = rawLessons.flatMap((rawLesson, index) => {
  const lessonId = index + 1;
  const preset = makeEnglishPreset(rawLesson, index);
  const lessonQuestions = questionsByLessonId.get(rawLesson.lessonId) ?? [];
  const vocabularyEntries = Object.entries(preset.vocabulary);
  const exampleQuestion = lessonQuestions[0]?.questionText || preset.communicationPatterns[0]?.question || rawLesson.title;
  const recapWords = vocabularyEntries.slice(0, 4).map(([word]) => word).join(', ');

  const cards: Array<Omit<EnglishLessonCard, 'id'>> = [
    {
      sourceId: makeEnglishCardSourceId(rawLesson.title),
      lessonId,
      cardType: 'intro',
      title: 'Khởi động',
      content: preset.introText,
      sortOrder: 1,
      isActive: 1,
      audioText: rawLesson.title,
    },
    {
      sourceId: makeEnglishCardSourceId(preset.topic),
      lessonId,
      cardType: 'explain',
      title: 'Trọng tâm ngôn ngữ',
      content: `${preset.topic}. ${preset.grammarFocus[0]?.rule ?? 'Học theo mẫu câu ngắn và rõ.'}`,
      sortOrder: 2,
      isActive: 1,
      audioText: preset.topic,
    },
    {
      sourceId: makeEnglishCardSourceId(exampleQuestion),
      lessonId,
      cardType: 'example',
      title: 'Mẫu giao tiếp',
      content: preset.communicationPatterns
        .slice(0, 2)
        .map((pattern) => `${pattern.question} - ${pattern.answer}`)
        .join('\n'),
      sortOrder: 3,
      isActive: 1,
      audioText: preset.communicationPatterns[0]?.question || exampleQuestion,
    },
    {
      sourceId: makeEnglishCardSourceId(preset.tipText),
      lessonId,
      cardType: 'tip',
      title: 'Mẹo nhớ',
      content: preset.tipText,
      sortOrder: 4,
      isActive: 1,
      audioText: preset.tipText,
    },
    {
      sourceId: makeEnglishCardSourceId('Common mistakes'),
      lessonId,
      cardType: 'common_mistake',
      title: 'Lỗi hay gặp',
      content: preset.commonMistakes.join('\n'),
      sortOrder: 5,
      isActive: 1,
      audioText: 'Common mistakes',
    },
    {
      sourceId: makeEnglishCardSourceId('Quick check'),
      lessonId,
      cardType: 'mini_check',
      title: 'Kiểm tra nhanh',
      content: `Hãy thử nói 1 câu về ${preset.topic.toLowerCase()} bằng tiếng Anh.`,
      sortOrder: 6,
      isActive: 1,
      audioText: 'Quick check',
    },
    {
      sourceId: makeEnglishCardSourceId('Quick recap'),
      lessonId,
      cardType: 'recap',
      title: 'Tóm tắt',
      content: `Từ khóa chính: ${recapWords}. Nhớ ghép từ thành câu ngắn rồi luyện nói lại.`,
      sortOrder: 7,
      isActive: 1,
      audioText: 'Quick recap',
    },
  ];

  return cards.map((card, cardIndex) => ({
    ...card,
    id: lessonId * 10 + cardIndex + 1,
  }));
});

export const englishQuestions: EnglishQuestion[] = rawQuestions.map((rawQuestion, index) => ({
  id: index + 1,
  sourceId: makeEnglishQuestionSourceId(rawQuestion.questionText),
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

export const englishSeed = {
  subjectCode: 'tieng-anh' as const,
  subjectTitle: 'Tiếng Anh Lớp 7',
  unitTitle: 'Tiếng Anh Lớp 7',
  lessons: englishLessons,
  lessonCards: englishLessonCards,
  questions: englishQuestions,
};

export const ENGLISH_PRACTICE_QUESTION_COUNT_OPTIONS = SHARED_PRACTICE_QUESTION_COUNT_OPTIONS;
export const DEFAULT_ENGLISH_PRACTICE_QUESTION_COUNT = SHARED_DEFAULT_PRACTICE_QUESTION_COUNT;

export function getActiveEnglishLessons() {
  return englishLessons.filter((lesson) => lesson.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getEnglishLessonById(lessonId: number) {
  return englishLessons.find((lesson) => lesson.id === lessonId && lesson.isActive);
}

export function getEnglishLessonCards(lessonId: number) {
  return englishLessonCards.filter((card) => card.lessonId === lessonId && card.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getEnglishLessonQuestions(lessonId: number) {
  return englishQuestions.filter((question) => question.lessonId === lessonId && question.isActive);
}

export function isEnglishPracticeQuestionCountOption(value: number): value is EnglishPracticeQuestionCountOption {
  return isSharedPracticeQuestionCountOption(value);
}

export function getEnglishPracticeSamplingPolicy(questionCount: EnglishPracticeQuestionCountOption) {
  return getSharedPracticeSamplingPolicy(questionCount);
}

export function getEnglishLessonPracticeQuestions(
  lessonId: number,
  targetCount: EnglishPracticeQuestionCountOption = DEFAULT_ENGLISH_PRACTICE_QUESTION_COUNT,
) {
  const questions = getEnglishLessonQuestions(lessonId);
  const policy = getEnglishPracticeSamplingPolicy(targetCount);
  return pickPracticeQuestions(questions, targetCount, policy as PracticePolicy | null);
}
