// Aggregates split vocabulary level files into the legacy vocabularyData global.
const VOCABULARY_LEVEL_ORDER = ["easy", "medium", "hard"];
const VOCABULARY_LEVEL_DATA = window.VOCABULARY_LEVEL_DATA || {};

const vocabularyData = VOCABULARY_LEVEL_ORDER.reduce((levels, levelKey) => {
  if (VOCABULARY_LEVEL_DATA[levelKey]) {
    levels[levelKey] = VOCABULARY_LEVEL_DATA[levelKey];
  }
  return levels;
}, {});

window.vocabularyData = vocabularyData;
