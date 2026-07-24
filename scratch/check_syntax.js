const fs = require('fs');
const code = fs.readFileSync('js/vocabulary-study.js', 'utf8');

// Check for missing functions or variables
const matches = code.match(/[a-zA-Z0-9_]+\s*\(/g) || [];
const funcs = new Set(matches.map(m => m.replace(/\s*\(/, '')));

console.log("Total function calls found:", funcs.size);

// Test executing using node vm to check for ReferenceError
const vm = require('vm');
const dummyWindow = {
  location: { search: '?level=easy&topic=food&mode=study' },
  localStorage: { getItem: () => null, setItem: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {}
};
const dummyDoc = {
  querySelector: () => ({ querySelectorAll: () => [], addEventListener: () => {} }),
  querySelectorAll: () => []
};

try {
  const sandbox = {
    document: dummyDoc,
    window: dummyWindow,
    localStorage: dummyWindow.localStorage,
    URLSearchParams: function() { return { get: () => 'easy' }; },
    Set: Set,
    Array: Array,
    Map: Map,
    Math: Math,
    Date: Date,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    console: console,
    vocabularyData: {
      easy: {
        topics: [{ id: 'food', words: [{ word: 'banana', meaning: 'quả chuối', phonetic: '/bəˈnæn.ə/' }] }]
      }
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  console.log("Code executed successfully in VM without top-level syntax/reference errors!");
} catch (err) {
  console.error("VM Error:", err.stack);
}
