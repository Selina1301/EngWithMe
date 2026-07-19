const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const outFile = path.join(root, "database", "migrations", "20260529_seed_learning_content_items.sql");

function extractJsArray(source, marker) {
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Cannot find marker: ${marker}`);
  const bracketStart = source.indexOf("[", start);
  if (bracketStart < 0) throw new Error(`Cannot find array after marker: ${marker}`);

  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = bracketStart; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (depth === 0) return source.slice(bracketStart, index + 1);
  }

  throw new Error(`Cannot close array after marker: ${marker}`);
}

function loadReadingLessons() {
  const html = fs.readFileSync(path.join(root, "reading.html"), "utf8");
  const arraySource = extractJsArray(html, "let readingLessons");
  return vm.runInNewContext(arraySource, {});
}

function loadListeningMissions() {
  const fallbackSource = fs.readFileSync(path.join(root, "js", "listening-data-fallback.js"), "utf8");
  const labSource = fs.readFileSync(path.join(root, "js", "listening-lab.js"), "utf8");
  const sandbox = {
    window: {},
    console,
    URLSearchParams,
    Date,
    Math,
    JSON,
    setTimeout,
    clearTimeout
  };
  vm.runInNewContext(fallbackSource, sandbox, { filename: "listening-data-fallback.js" });
  vm.runInNewContext(labSource, sandbox, { filename: "listening-lab.js" });
  return sandbox.window.LISTENING_MISSIONS_FALLBACK || [];
}

function loadGrammarTopics() {
  const source = fs.readFileSync(path.join(root, "js", "grammar-data-fallback.js"), "utf8");
  const sandbox = {
    window: {},
    console,
    JSON,
    Math
  };
  vm.runInNewContext(source, sandbox, { filename: "grammar-data-fallback.js" });
  return sandbox.window.GRAMMAR_TOPICS_FALLBACK || [];
}

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

function sqlJson(value) {
  return sqlString(JSON.stringify(value));
}

function row({ section, key, level, goal, title, description, payload, sortOrder }) {
  return [
    sqlString(section),
    sqlString(key),
    sqlString(level),
    sqlString(goal),
    sqlString(title),
    sqlString(description),
    sqlJson(payload),
    Number(sortOrder) || 0,
    sqlString("published")
  ].join(", ");
}

function main() {
  const readingLessons = loadReadingLessons();
  const listeningMissions = loadListeningMissions();
  const grammarTopics = loadGrammarTopics();
  const rows = [];

  readingLessons.forEach((lesson, index) => {
    rows.push(`(${row({
      section: "reading",
      key: lesson.id,
      level: lesson.level,
      goal: null,
      title: lesson.title,
      description: lesson.description,
      payload: lesson,
      sortOrder: index + 1
    })})`);
  });

  listeningMissions.forEach((mission, index) => {
    const { voiceRoute, ...payload } = mission;
    rows.push(`(${row({
      section: "listening",
      key: mission.id,
      level: mission.level,
      goal: mission.goal,
      title: mission.title,
      description: mission.opening || mission.story || "",
      payload,
      sortOrder: index + 1
    })})`);
  });

  grammarTopics.forEach((topic, index) => {
    rows.push(`(${row({
      section: "grammar",
      key: topic.id,
      level: topic.level,
      goal: null,
      title: topic.title,
      description: topic.summary,
      payload: topic,
      sortOrder: Number(topic.order) || index + 1
    })})`);
  });

  const sql = `USE engwithme_db;

INSERT INTO learning_content_items
  (section, content_key, level_key, goal_key, title, description, payload_json, sort_order, status)
VALUES
  ${rows.join(",\n  ")}
ON DUPLICATE KEY UPDATE
  level_key = VALUES(level_key),
  goal_key = VALUES(goal_key),
  title = VALUES(title),
  description = VALUES(description),
  payload_json = VALUES(payload_json),
  sort_order = VALUES(sort_order),
  status = VALUES(status);
`;

  fs.writeFileSync(outFile, sql, "utf8");
  console.log(`Wrote ${rows.length} content rows to ${path.relative(root, outFile)}`);
}

main();
