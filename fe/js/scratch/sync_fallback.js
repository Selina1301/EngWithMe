const fs = require('fs');
const path = require('path');

const sqlPath = 'c:\\Code\\EngWithMe\\be\\database\\migrations\\20260529_seed_learning_content_items.sql';
const sql = fs.readFileSync(sqlPath, 'utf8');

// Parse payload_json for each listening row
const regex = /\('listening',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']*)',\s*'(\{.*?\})',\s*(\d+),\s*'published'\)/g;

const items = [];
let match;
while ((match = regex.exec(sql)) !== null) {
  const [_, key, levelKey, goalKey, title, description, jsonStr, sortOrder] = match;
  try {
    // Escaped quotes in SQL like '' -> '
    const cleanJson = jsonStr.replace(/''/g, "'");
    const payload = JSON.parse(cleanJson);
    payload.sessionOrder = (parseInt(sortOrder, 10) % 6) || 6;
    if (!payload.goal) payload.goal = goalKey;
    items.push(payload);
  } catch (e) {
    console.error('Failed to parse item:', key, e.message);
  }
}

console.log('Parsed items count:', items.length);

const byGoal = {};
items.forEach(item => {
  if (!byGoal[item.goal]) byGoal[item.goal] = [];
  byGoal[item.goal].push(item);
});

console.log('Breakdown by goal:');
Object.keys(byGoal).forEach(g => {
  console.log(`- Goal "${g}": ${byGoal[g].length} sessions`);
});

// Output clean file JS
const jsContent = `(function () {
  "use strict";

  const missions = ${JSON.stringify(items, null, 2)};

  window.LISTENING_LAB_MISSIONS = missions;
  window.LISTENING_LAB_MISSION_EXPANSIONS = [];
  window.LISTENING_LAB_SUPPLEMENTAL_EXPANSIONS = [];
})();
`;

fs.writeFileSync('c:\\Code\\EngWithMe\\fe\\js\\listening-data-fallback.js', jsContent, 'utf8');
console.log('Successfully regenerated fe/js/listening-data-fallback.js with 78 clean canonical missions!');
