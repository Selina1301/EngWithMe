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
    "updateHomeFaq",
    "initBlogPage"
  ].forEach((initializerName) => {
    const initializer = window[initializerName];
    if (typeof initializer === "function") {
      try {
        initializer();
      } catch (error) {
        console.warn(`Initializer "${initializerName}" failed to execute:`, error);
      }
    }
  });
});
