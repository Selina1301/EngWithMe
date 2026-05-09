document.addEventListener("DOMContentLoaded", () => {
  [
    "setCurrentYear",
    "setActiveNav",
    "initAuthNav",
    "initDemoActions",
    "initQuiz",
    "initMiniQuizzes",
    "initVocabularyStudy",
    "initGrammarLearning",
    "initProgressButtons",
    "initAuthForms",
    "initDashboard",
    "initProfile",
    "initAdminDashboard",
    "initLogoutButtons",
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
