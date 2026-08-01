const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../listening-data-fallback.js'), 'utf8');

// Mock window environment
const window = {};
eval(content);

const allItems = [
  ...(window.LISTENING_LAB_MISSIONS || []),
  ...(window.LISTENING_LAB_MISSION_EXPANSIONS || []),
  ...(window.LISTENING_LAB_SUPPLEMENTAL_EXPANSIONS || [])
];

console.log('Total raw items in fallback file:', allItems.length);

const byGoal = {};
const idsByGoal = {};
const invalidGoals = [];

allItems.forEach((item, idx) => {
  if (!item) return;
  const goal = item.goal || 'MISSING';
  if (!byGoal[goal]) {
    byGoal[goal] = 0;
    idsByGoal[goal] = [];
  }
  byGoal[goal]++;
  idsByGoal[goal].push({ id: item.id, title: item.title, index: idx });
});

console.log('\n--- BREAKDOWN BY GOAL ---');
console.dir(byGoal);

console.log('\n--- DETAILED ITEMS PER GOAL ---');
Object.keys(idsByGoal).forEach((g) => {
  console.log(`\nGoal: "${g}" (${idsByGoal[g].length} items):`);
  idsByGoal[g].forEach((item, i) => {
    console.log(`  [${i+1}] id="${item.id}" | title="${item.title}"`);
  });
});
