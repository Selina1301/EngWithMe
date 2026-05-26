// Shared TOEIC exam configuration and scoring helpers.
function getExamCompletionKey(set, part) {
  return getAccountKey(`engWithMeExamCompleted_${set}_${part}`);
}

const TOEIC_READING_PARTS = ["5", "6", "7"];
const TOEIC_LISTENING_PARTS = ["1", "2", "3", "4"];
const TOEIC_PART_CONFIG = {
  1: { label: "Part 1 - 6 câu (1-6)", shortLabel: "Part 1" },
  2: { label: "Part 2 - 25 câu (7-31)", shortLabel: "Part 2" },
  3: { label: "Part 3 - 39 câu (32-70)", shortLabel: "Part 3" },
  4: { label: "Part 4 - 30 câu (71-100)", shortLabel: "Part 4" },
  5: { label: "Part 5 - 30 câu (101-130)", shortLabel: "Part 5" },
  6: { label: "Part 6 - 16 câu (131-146)", shortLabel: "Part 6" },
  7: { label: "Part 7 - 54 câu (147-200)", shortLabel: "Part 7" }
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

function getSetMeta(setId) {
  const readingMeta = TOEIC_READING_SETS.find((set) => set.id === setId) || TOEIC_READING_SETS[TOEIC_READING_SETS.length - 1];
  const listeningMeta = getListeningExam(setId)?.meta;
  if (!listeningMeta) return readingMeta;
  return {
    ...readingMeta,
    ...listeningMeta,
    label: listeningMeta.fullLabel || readingMeta?.label || listeningMeta.label
  };
}

function getExamTitle(setId, year) {
  const displayYear = year || setId.replace("y", "");
  return hasListeningExam(setId) ? `TOEIC Test ${displayYear}` : `TOEIC Reading Test ${displayYear}`;
}

function formatToeicPartSelection(parts) {
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
