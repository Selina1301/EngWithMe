const fs = require('fs');
const path = require('path');

const sqlPath = 'c:\\Code\\EngWithMe\\be\\database\\migrations\\20260529_seed_learning_content_items.sql';
const sql = fs.readFileSync(sqlPath, 'utf8');

const regex = /\('listening',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',/g;
let match;
const sqlByGoal = {};
const sqlItems = [];

while ((match = regex.exec(sql)) !== null) {
  const [_, contentKey, levelKey, goalKey, title] = match;
  if (!sqlByGoal[goalKey]) sqlByGoal[goalKey] = [];
  sqlByGoal[goalKey].push({ key: contentKey, level: levelKey, title });
  sqlItems.push({ key: contentKey, level: levelKey, goal: goalKey, title });
}

console.log('Total listening items in SQL seed file:', sqlItems.length);
console.log('\n--- SQL BREAKDOWN BY GOAL ---');
Object.keys(sqlByGoal).forEach(g => {
  console.log(`Goal: "${g}" (${sqlByGoal[g].length} items):`);
  sqlByGoal[g].forEach((item, i) => {
    console.log(`  [${i+1}] key="${item.key}" | title="${item.title}"`);
  });
});
