// Shared TOEIC exam configuration and scoring helpers.
function getExamCompletionKey(set, part) {
  return getAccountKey(`engWithMeExamCompleted_${set}_${part}`);
}

const TOEIC_READING_PARTS = ["5", "6", "7"];
const TOEIC_LISTENING_PARTS = ["1", "2", "3", "4"];
const TOEIC_PART_CONFIG = {
  1: { label: "Part 1 (6 câu)", shortLabel: "Part 1" },
  2: { label: "Part 2 (25 câu)", shortLabel: "Part 2" },
  3: { label: "Part 3 (39 câu)", shortLabel: "Part 3" },
  4: { label: "Part 4 (30 câu)", shortLabel: "Part 4" },
  5: { label: "Part 5 (30 câu)", shortLabel: "Part 5" },
  6: { label: "Part 6 (16 câu)", shortLabel: "Part 6" },
  7: { label: "Part 7 (54 câu)", shortLabel: "Part 7" }
};

function getListeningExam(setId) {
  if (typeof TOEIC_LISTENING_EXAMS === "undefined") return null;
  return TOEIC_LISTENING_EXAMS[setId] || null;
}

function hasListeningExam(setId) {
  const exam = getListeningExam(setId);
  return Array.isArray(exam?.questions) && exam.questions.length > 0;
}

function getExamPartsForSet(setId) {
  return hasListeningExam(setId) ? [...TOEIC_LISTENING_PARTS, ...TOEIC_READING_PARTS] : [...TOEIC_READING_PARTS];
}

const TOEIC_SET_YEAR_MAP = {
  y2017: "2026",
  y2018: "2025",
  y2019: "2024",
  y2020: "2023",
  y2021: "2022",
  y2022: "2021",
  y2023: "2020",
  y2024: "2019",
  y2025: "2018"
};

function getSetMeta(setId) {
  const readingSets = window.TOEIC_READING_SETS || [];
  const readingMeta = readingSets.find((set) => set.id === setId) || readingSets[0] || { id: setId, label: `TOEIC Exam ${TOEIC_SET_YEAR_MAP[setId] || setId.replace("y", "")}` };
  const listeningMeta = getListeningExam(setId)?.meta;
  const displayYear = TOEIC_SET_YEAR_MAP[setId] || setId.replace("y", "");
  const defaultLabel = hasListeningExam(setId) ? `TOEIC Test ${displayYear}` : `TOEIC Reading Test ${displayYear}`;

  return {
    ...readingMeta,
    ...listeningMeta,
    label: defaultLabel
  };
}

function getExamTitle(setId, year) {
  const displayYear = year || TOEIC_SET_YEAR_MAP[setId] || setId.replace("y", "");
  return hasListeningExam(setId) ? `TOEIC Test ${displayYear}` : `TOEIC Reading Test ${displayYear}`;
}

function formatToeicPartSelection(parts) {
  if (!Array.isArray(parts)) parts = [parts].filter(Boolean);
  const numbers = parts
    .map((partNumber) => Number(partNumber))
    .filter(Number.isFinite)
    .sort((first, second) => first - second);

  if (!numbers.length) return "Part";
  if (numbers.length === 1) return `Part ${numbers[0]}`;

  const isConsecutive = numbers.every((partNumber, index) => index === 0 || partNumber === numbers[index - 1] + 1);
  if (isConsecutive) return `Parts ${numbers[0]}-${numbers[numbers.length - 1]}`;

  return `Parts ${numbers.join(", ")}`;
}

function getRecommendedLevel(correct, total) {
  const ratio = total ? correct / total : 0;
  if (ratio >= 0.9) return "B2";
  if (ratio >= 0.7) return "B1";
  if (ratio >= 0.45) return "A2";
  return "A1";
}

function getRecommendedLesson(level) {
  const lessons = {
    A1: "Greetings and Introductions",
    A2: "Present Simple và Daily Activities",
    B1: "TOEIC Reading Strategies",
    B2: "Advanced Business Reading"
  };
  return lessons[level] || lessons.A1;
}

window.TOEIC_READING_PARTS = TOEIC_READING_PARTS;
window.TOEIC_LISTENING_PARTS = TOEIC_LISTENING_PARTS;
window.TOEIC_PART_CONFIG = TOEIC_PART_CONFIG;
window.getExamCompletionKey = getExamCompletionKey;
window.getListeningExam = getListeningExam;
window.hasListeningExam = hasListeningExam;
window.getExamPartsForSet = getExamPartsForSet;
window.getSetMeta = getSetMeta;
window.getExamTitle = getExamTitle;
window.formatToeicPartSelection = formatToeicPartSelection;
window.getRecommendedLevel = getRecommendedLevel;
window.getRecommendedLesson = getRecommendedLesson;
window.TOEIC_SET_YEAR_MAP = TOEIC_SET_YEAR_MAP;

