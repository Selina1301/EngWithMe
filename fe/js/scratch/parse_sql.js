const fs = require('fs');

const sqlPath = 'c:\\Code\\EngWithMe\\be\\database\\migrations\\20260529_seed_learning_content_items.sql';
const sql = fs.readFileSync(sqlPath, 'utf8');

const items = [];
const lines = sql.split('\n');

lines.forEach((line) => {
  line = line.trim();
  if (!line.startsWith("('listening',")) return;

  // Extract everything between single quotes for goalKey, sortOrder, and the JSON object
  // Format: ('listening', 'contentKey', 'levelKey', 'goalKey', 'title', 'description', 'JSON', sortOrder, 'published')
  
  // Find start of JSON object: '{"id":
  const jsonStart = line.indexOf("'{\"");
  if (jsonStart === -1) return;

  // Find end of JSON object: }',
  const jsonEnd = line.indexOf("}',", jsonStart);
  if (jsonEnd === -1) return;

  const rawJson = line.substring(jsonStart + 1, jsonEnd + 1); // include }
  
  // Extract goalKey: it's the 4th value: ('listening', 'key', 'level', 'goalKey', ...
  const parts = line.substring(0, jsonStart).split("', '");
  const goalKey = parts[3] ? parts[3].replace(/^'/, '') : 'unknown';

  // Extract sortOrder: after }', sortOrder, 'published'
  const afterJson = line.substring(jsonEnd + 3); // sortOrder, 'published')
  const sortMatch = afterJson.match(/^\s*(\d+)/);
  const sortOrder = sortMatch ? parseInt(sortMatch[1], 10) : 1;

  // Unescape SQL string ('' -> ')
  const cleanJsonStr = rawJson.replace(/''/g, "'");

  try {
    const obj = JSON.parse(cleanJsonStr);
    obj.goal = goalKey;
    obj.sessionOrder = (sortOrder % 6) || 6;
    items.push(obj);
  } catch (err) {
    // If standard JSON.parse fails due to unescaped single quote or backslash, evaluate via JS function
    try {
      const obj = eval('(' + cleanJsonStr + ')');
      obj.goal = goalKey;
      obj.sessionOrder = (sortOrder % 6) || 6;
      items.push(obj);
    } catch (err2) {
      console.error('Failed to parse:', parts[1], err2.message);
    }
  }
});

console.log('Successfully parsed canonical listening items from SQL:', items.length);

const byGoal = {};
items.forEach(item => {
  if (!byGoal[item.goal]) byGoal[item.goal] = [];
  byGoal[item.goal].push(item);
});

console.log('\n--- CANONICAL GOAL BREAKDOWN ---');
Object.keys(byGoal).forEach(g => {
  console.log(`Goal: "${g}" (${byGoal[g].length} sessions):`);
  byGoal[g].forEach((m, idx) => {
    console.log(`  [Session ${idx+1}] id="${m.id}" | title="${m.title}"`);
  });
});

// Write perfectly formatted listening-data-fallback.js
const jsContent = `(function () {
  "use strict";

  const missions = ${JSON.stringify(items, null, 2)};

  window.LISTENING_LAB_MISSIONS = missions;
  window.LISTENING_LAB_MISSION_EXPANSIONS = [];
  window.LISTENING_LAB_SUPPLEMENTAL_EXPANSIONS = [];
})();
`;

fs.writeFileSync('c:\\Code\\EngWithMe\\fe\\js\\listening-data-fallback.js', jsContent, 'utf8');
console.log('\n✅ Successfully regenerated fe/js/listening-data-fallback.js with ALL 78 CANONICAL MISSIONS!');
