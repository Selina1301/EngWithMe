document.addEventListener("DOMContentLoaded", () => {
  [
    "setCurrentYear",
    "setActiveNav",
    "initDemoActions",
    "initQuiz",
    "initMiniQuizzes",
    "initVocabularyStudy",
    "initGrammarLearning",
    "initProgressButtons",
    "initAuthForms",
    "initDashboard",
    "initResults",
    "initRecorder",
    "initHomeSuggestion",
    "initHomeInteractions",
    "initContactForm",
    "updateHomeFaq"
  ].forEach((initializerName) => {
    const initializer = window[initializerName];
    if (typeof initializer === "function") initializer();
  });
});
