const fs = require('fs');

const sqlPath = 'c:\\Code\\EngWithMe\\be\\database\\migrations\\20260529_seed_learning_content_items.sql';
const sql = fs.readFileSync(sqlPath, 'utf8');

const items = [];
const lines = sql.split('\n');

lines.forEach((line, lineIdx) => {
  line = line.trim();
  if (!line.startsWith("('listening',")) return;

  // Extract json_string: find opening '{"id": and closing }',
  const jsonStart = line.indexOf("'{\"");
  if (jsonStart === -1) return;

  // The sortOrder comes after }', sortOrder, 'published')
  const lastPublished = line.lastIndexOf(", 'published')");
  if (lastPublished === -1) return;

  // Sort order is before , 'published')
  const beforePublished = line.substring(0, lastPublished);
  const lastComma = beforePublished.lastIndexOf(',');
  const sortOrderStr = beforePublished.substring(lastComma + 1).trim();
  const sortOrder = parseInt(sortOrderStr, 10) || 1;

  // Everything before '{"id": contains key, level, goal
  const metaPart = line.substring(0, jsonStart);
  const metaTokens = metaPart.split("', '");
  const key = metaTokens[1] ? metaTokens[1] : '';
  const goalKey = metaTokens[3] ? metaTokens[3] : '';

  // The json payload is between jsonStart + 1 and lastComma before sortOrder
  const jsonRawWithQuotes = beforePublished.substring(jsonStart + 1, lastComma).trim();
  // Strip trailing quote ' if present
  let jsonRaw = jsonRawWithQuotes;
  if (jsonRaw.endsWith("'")) {
    jsonRaw = jsonRaw.substring(0, jsonRaw.length - 1);
  }

  // Fix SQL double single-quotes '' -> '
  let cleanStr = jsonRaw.replace(/''/g, "'");
  // Fix double escaped quotes \\"\\" -> \\"
  cleanStr = cleanStr.replace(/\\\\"\\"/g, '\\"');

  try {
    const parsed = JSON.parse(cleanStr);
    parsed.goal = goalKey;
    parsed.sessionOrder = (sortOrder % 6) || 6;
    items.push(parsed);
  } catch (err) {
    // If standard JSON.parse fails, try replacing invalid escaped quotes
    try {
      // Fix \\" inside strings
      const sanitized = cleanStr.replace(/\\\\"/g, '"').replace(/\\"/g, '"');
      const parsed = JSON.parse(sanitized);
      parsed.goal = goalKey;
      parsed.sessionOrder = (sortOrder % 6) || 6;
      items.push(parsed);
    } catch (err2) {
      console.error(`Line ${lineIdx+1} [${key}]:`, err2.message);
    }
  }
});

console.log('Total items parsed successfully:', items.length);

const byGoal = {};
items.forEach((m) => {
  if (!byGoal[m.goal]) byGoal[m.goal] = [];
  byGoal[m.goal].push(m);
});

console.log('\n--- CANONICAL GOAL BREAKDOWN ---');
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
  console.log('\nSUCCESS! Generated fe/js/listening-data-fallback.js with ALL 78 PERFECT CANONICAL SESSIONS!');
} else {
  console.error('\nWARNING: Count is not 78. Not writing file yet.');
}
