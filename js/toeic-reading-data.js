const TOEIC_PART_LABELS = {
  1: "Part 1: Photographs",
  2: "Part 2: Question-Response",
  3: "Part 3: Conversations",
  4: "Part 4: Talks",
  5: "Part 5: Incomplete Sentences",
  6: "Part 6: Text Completion",
  7: "Part 7: Reading Comprehension"
};

const examQuestionBank = [];
const TOEIC_READING_EXAMS = window.TOEIC_READING_EXAMS || {};
const TOEIC_LISTENING_EXAMS = window.TOEIC_LISTENING_EXAMS || {};
const TOEIC_READING_YEAR_IDS = [
  "y2017",
  "y2018",
  "y2019",
  "y2020",
  "y2021",
  "y2022",
  "y2023",
  "y2024",
  "y2025"
];

const TOEIC_READING_SETS = TOEIC_READING_YEAR_IDS
  .map((id) => TOEIC_READING_EXAMS[id]?.meta)
  .filter(Boolean);

const TOEIC_LISTENING_YEAR_IDS = Object.keys(TOEIC_LISTENING_EXAMS);

function buildToeicReadingQuestionBank() {
  return TOEIC_READING_YEAR_IDS.flatMap((setId) => {
    const exam = TOEIC_READING_EXAMS[setId];
    if (!exam || !Array.isArray(exam.questions)) return [];

    const set = exam.meta || { id: setId, label: `TOEIC Reading ${setId.replace("y", "")}` };
    return exam.questions.map((item) => ({
      id: `${set.id}-${item.partNumber}-${item.questionNo}`,
      set: set.id,
      setLabel: set.label,
      section: "reading",
      partNumber: String(item.partNumber),
      part: TOEIC_PART_LABELS[item.partNumber] || TOEIC_PART_LABELS[String(item.partNumber)],
      questionNo: item.questionNo,
      group: item.group,
      passage: item.passage,
      question: item.question,
      options: item.options,
      answer: item.answer,
      explain: item.explain
    }));
  });
}

function buildToeicListeningQuestionBank() {
  return TOEIC_LISTENING_YEAR_IDS.flatMap((setId) => {
    const exam = TOEIC_LISTENING_EXAMS[setId];
    if (!exam || !Array.isArray(exam.questions)) return [];

    const set = exam.meta || { id: setId, label: `TOEIC Listening ${setId.replace("y", "")}` };
    return exam.questions.map((item) => ({
      id: `${set.id}-${item.partNumber}-${item.questionNo}`,
      set: set.id,
      setLabel: set.fullLabel || set.label,
      section: "listening",
      partNumber: String(item.partNumber),
      part: TOEIC_PART_LABELS[item.partNumber] || TOEIC_PART_LABELS[String(item.partNumber)],
      questionNo: item.questionNo,
      group: item.group,
      passage: item.passage,
      question: item.question,
      options: item.options,
      answer: item.answer,
      explain: item.explain,
      imageUrl: item.imageUrl,
      audioUrl: item.audioUrl,
      transcript: item.transcript,
      topic: item.topic,
      trapType: item.trapType,
      skill: item.skill,
      talkType: item.talkType
    }));
  });
}

const toeicReadingQuestionBank = buildToeicReadingQuestionBank();
const toeicListeningQuestionBank = buildToeicListeningQuestionBank();
const toeicExamQuestionBank = [
  ...toeicListeningQuestionBank,
  ...toeicReadingQuestionBank
];
