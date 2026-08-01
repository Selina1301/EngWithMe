const fs = require('fs');

const sqlPath = 'c:\\Code\\EngWithMe\\be\\database\\migrations\\20260529_seed_learning_content_items.sql';
const sql = fs.readFileSync(sqlPath, 'utf8');

const lines = sql.split('\n');
const line28 = lines[27].trim(); // coffee-shop line

const startIdx = line28.indexOf("'{\"id\"");
const endIdx = line28.lastIndexOf("}',");

const rawJsonStr = line28.substring(startIdx + 1, endIdx + 1);

// Unescape SQL quotes: '' -> ' and \\" -> \"
const unescaped = rawJsonStr.replace(/''/g, "'").replace(/\\\\"/g, '\\"');

try {
  const parsed = JSON.parse(unescaped);
  console.log('SUCCESSFULLY parsed coffee-shop JSON!');
  console.log('ID:', parsed.id, 'Title:', parsed.title);
} catch (err) {
  console.error('JSON parse error:', err.message);
}
