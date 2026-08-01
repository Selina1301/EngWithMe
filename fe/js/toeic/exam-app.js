// TOEIC exam entrypoint loaded by pages that need the TOEIC exam flow.
function initQuiz() {
  if (typeof initToeicExamOverview === "function") initToeicExamOverview();
  if (typeof initToeicExamPractice === "function") initToeicExamPractice();
}

// Compatibility aliases for older page scripts or browser console usage.
function initExamOverviewV2() {
  if (typeof initToeicExamOverview === "function") initToeicExamOverview();
}

function initExamPractice() {
  if (typeof initToeicExamPractice === "function") initToeicExamPractice();
}
