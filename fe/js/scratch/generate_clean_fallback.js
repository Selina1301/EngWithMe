const fs = require('fs');

const sqlPath = 'c:\\Code\\EngWithMe\\be\\database\\migrations\\20260529_seed_learning_content_items.sql';
const sql = fs.readFileSync(sqlPath, 'utf8');

const items = [];
const lines = sql.split('\n');

lines.forEach((line, lineIdx) => {
  line = line.trim();
  if (!line.startsWith("('listening',")) return;

  const startIdx = line.indexOf("'{\"id\"");
  const endIdx = line.lastIndexOf("}',");

  if (startIdx === -1 || endIdx === -1) return;

  const rawJsonStr = line.substring(startIdx + 1, endIdx + 1);

  // Extract goalKey: ('listening', 'key', 'level', 'goalKey', ...
  const metaPart = line.substring(0, startIdx);
  const metaTokens = metaPart.split("', '");
  const goalKey = metaTokens[3] ? metaTokens[3] : '';

  // Extract sortOrder: after }', sortOrder, 'published')
  const afterJson = line.substring(endIdx + 3);
  const sortMatch = afterJson.match(/^\s*(\d+)/);
  const sortOrder = sortMatch ? parseInt(sortMatch[1], 10) : 1;

  // Unescape SQL string ('' -> ') and fix escaped quotes (\\" -> \")
  const unescaped = rawJsonStr.replace(/''/g, "'").replace(/\\\\"/g, '\\"');

  try {
    const parsed = JSON.parse(unescaped);
    parsed.goal = goalKey;
    parsed.sessionOrder = (sortOrder % 6) || 6;
    items.push(parsed);
  } catch (err) {
    console.error(`Line ${lineIdx+1} failed: ${err.message}`);
  }
});

console.log('Total items parsed successfully:', items.length);

const byGoal = {};
items.forEach((m) => {
  if (!byGoal[m.goal]) byGoal[m.goal] = [];
  byGoal[m.goal].push(m);
});

console.log('\n--- CANONICAL GOAL BREAKDOWN (EXACTLY 6 PER GOAL) ---');
Object.keys(byGoal).sort().forEach((g) => {
  console.log(`Goal: "${g}" (${byGoal[g].length} sessions):`);
  byGoal[g].forEach((m, idx) => {
    console.log(`  [Session ${idx+1}] id="${m.id}" | title="${m.title}"`);
  });
});

if (items.length === 78) {
  const jsContent = `(function () {
  "use strict";

  const missions = ${JSON.stringify(items, null, 2)};

  window.LISTENING_LAB_MISSIONS = missions;
  window.LISTENING_LAB_MISSION_EXPANSIONS = [];
  window.LISTENING_LAB_SUPPLEMENTAL_EXPANSIONS = [];
})();
`;
  fs.writeFileSync('c:\\Code\\EngWithMe\\fe\\js\\listening-data-fallback.js', jsContent, 'utf8');
  console.log('\n🎉 SUCCESS! Regenerated fe/js/listening-data-fallback.js with ALL 78 CANONICAL SESSIONS!');
} else {
  console.error(`\n❌ ERROR: Parsed count is ${items.length}, expected 78.`);
}
