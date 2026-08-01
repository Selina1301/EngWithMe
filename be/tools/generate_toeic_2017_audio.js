/**
 * Generate TOEIC Listening MP3 files from js/toeic/<year>-listening.js.
 * 
 * This script uses edge-tts neural voices and writes browser-ready MP3 files into:
 * audio/toeic/<year>/part1..part4/
 * 
 * Usage:
 *   node tools/generate_toeic_2017_audio.js
 *   node tools/generate_toeic_2017_audio.js --year 2018
 *   node tools/generate_toeic_2017_audio.js --force
 *   node tools/generate_toeic_2017_audio.js --parts 1,2
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");
const { UniversalCommunicate, listVoicesUniversal } = require("edge-tts-universal");

const YEAR_DEFAULT = "2017";
const SUPPORTED_YEAR_PATTERN = /^\d{4}$/;
const DEFAULT_RATE = "+0%";
const DEFAULT_VOICE_COUNT = 30;
const PREFERRED_ENGLISH_LOCALES = [
  "en-US",
  "en-GB",
  "en-AU",
  "en-CA",
  "en-IE",
  "en-NZ",
];
const PINNED_ENGLISH_VOICE_POOL = [
  "en-US-AnaNeural",
  "en-US-AriaNeural",
  "en-US-AvaMultilingualNeural",
  "en-US-AvaNeural",
  "en-US-EmmaMultilingualNeural",
  "en-US-EmmaNeural",
  "en-US-JennyNeural",
  "en-US-MichelleNeural",
  "en-US-AndrewMultilingualNeural",
  "en-US-AndrewNeural",
  "en-US-BrianMultilingualNeural",
  "en-US-BrianNeural",
  "en-US-ChristopherNeural",
  "en-US-EricNeural",
  "en-US-GuyNeural",
  "en-US-RogerNeural",
  "en-US-SteffanNeural",
  "en-GB-LibbyNeural",
  "en-GB-MaisieNeural",
  "en-GB-SoniaNeural",
  "en-GB-RyanNeural",
  "en-GB-ThomasNeural",
  "en-AU-NatashaNeural",
  "en-AU-WilliamMultilingualNeural",
  "en-CA-ClaraNeural",
  "en-CA-LiamNeural",
  "en-IE-EmilyNeural",
  "en-IE-ConnorNeural",
  "en-NZ-MollyNeural",
  "en-NZ-MitchellNeural",
];

function stableIndex(key, modulo) {
  if (modulo <= 0) {
    throw new Error("Cannot select a voice from an empty voice pool.");
  }
  const digest = crypto.createHash("sha256").update(key).digest("hex");
  return parseInt(digest.slice(0, 12), 16) % modulo;
}

function localeRank(locale) {
  const index = PREFERRED_ENGLISH_LOCALES.indexOf(locale);
  return index === -1 ? PREFERRED_ENGLISH_LOCALES.length : index;
}

function normalizeEdgeVoice(rawVoice) {
  const shortName = rawVoice.ShortName || rawVoice.shortName || "";
  const locale = rawVoice.Locale || rawVoice.locale || shortName.slice(0, 5);
  const gender = rawVoice.Gender || rawVoice.gender || "Unknown";
  const displayName = rawVoice.FriendlyName || rawVoice.friendlyName || rawVoice.DisplayName || rawVoice.displayName || shortName;
  return { shortName, locale, gender, displayName };
}

function sortVoices(voices) {
  return [...voices].sort((a, b) => {
    const rankA = localeRank(a.locale);
    const rankB = localeRank(b.locale);
    if (rankA !== rankB) return rankA - rankB;

    const genderA = a.gender.toLowerCase() === "female" ? 0 : 1;
    const genderB = b.gender.toLowerCase() === "female" ? 0 : 1;
    if (genderA !== genderB) return genderA - genderB;

    return a.shortName.localeCompare(b.shortName);
  });
}

function diversifyVoicePool(voices, size) {
  const byLocale = {};
  for (const voice of sortVoices(voices)) {
    if (!byLocale[voice.locale]) {
      byLocale[voice.locale] = [];
    }
    byLocale[voice.locale].push(voice);
  }

  const pool = [];
  const localeOrder = Object.keys(byLocale).sort((a, b) => localeRank(a) - localeRank(b));
  while (pool.length < size) {
    let added = false;
    for (const locale of localeOrder) {
      const localeVoices = byLocale[locale];
      if (localeVoices && localeVoices.length > 0) {
        pool.push(localeVoices.shift());
        added = true;
        if (pool.length === size) break;
      }
    }
    if (!added) break;
  }
  return pool;
}

async function loadVoicePool(size) {
  const rawVoices = await listVoicesUniversal();
  const englishNeuralVoices = rawVoices
    .map(normalizeEdgeVoice)
    .filter(voice => voice.locale.startsWith("en-") && voice.shortName.endsWith("Neural"));

  const voicesByShortName = {};
  for (const voice of englishNeuralVoices) {
    voicesByShortName[voice.shortName] = voice;
  }

  const voicePool = [];
  for (const shortName of PINNED_ENGLISH_VOICE_POOL.slice(0, size)) {
    if (voicesByShortName[shortName]) {
      voicePool.push(voicesByShortName[shortName]);
    }
  }

  if (voicePool.length < size) {
    const pinnedNames = new Set(voicePool.map(v => v.shortName));
    const remainingVoices = englishNeuralVoices.filter(v => !pinnedNames.has(v.shortName));
    const extraVoices = diversifyVoicePool(remainingVoices, size - voicePool.length);
    voicePool.push(...extraVoices);
  }

  if (voicePool.length < size) {
    console.error(`edge-tts returned only ${voicePool.length} English neural voices; ${size} are required.`);
    process.exit(1);
  }
  return voicePool;
}

function selectVoice(voicePool, key, gender = null) {
  let candidates = voicePool;
  if (gender) {
    candidates = voicePool.filter(v => v.gender.toLowerCase() === gender.toLowerCase());
  }
  if (candidates.length === 0) {
    candidates = voicePool;
  }
  return candidates[stableIndex(key, candidates.length)].shortName;
}

function loadQuestions(year, repoRoot) {
  const filePath = path.join(repoRoot, "js", "toeic", `${year}-listening.js`);
  if (!fs.existsSync(filePath)) {
    console.error(`Could not find questions file: ${filePath}`);
    process.exit(1);
  }
  const source = fs.readFileSync(filePath, "utf8");
  const context = { window: {} };
  context.window.window = context.window;
  vm.createContext(context);
  vm.runInContext(source, context);

  const exams = context.window.TOEIC_LISTENING_EXAMS;
  if (!exams || !exams[`y${year}`] || !exams[`y${year}`].questions) {
    console.error(`Could not load TOEIC Listening ${year} question data.`);
    process.exit(1);
  }
  return exams[`y${year}`].questions;
}

function labelOptions(options) {
  const labels = ["A", "B", "C", "D"];
  return options.map((option, index) => `${labels[index]}. ${option}`).join(" ");
}

function normalizeTtsText(text) {
  const replacements = {
    "A.M.": "A M",
    "P.M.": "P M",
    "a.m.": "A M",
    "p.m.": "P M",
    "Ms.": "Miss",
    "Mr.": "Mister",
    "Dr.": "Doctor",
    "St.": "Saint",
    "555-0186": "five five five, zero one eight six",
    "555-0147": "five five five, zero one four seven",
    "8:15": "eight fifteen",
    "8:20": "eight twenty",
    "8:30": "eight thirty",
    "10:00": "ten o'clock",
    "5:45": "five forty five",
    "7:00": "seven o'clock",
    "1:00": "one o'clock",
    "3:00": "three o'clock",
    "15 percent": "fifteen percent",
    "20 percent": "twenty percent",
    "25 percent": "twenty five percent",
    "12 percent": "twelve percent",
    "Room 204": "Room two oh four",
    "$8": "eight dollars",
    "$18": "eighteen dollars",
    "$20": "twenty dollars",
    "$60": "sixty dollars",
    "$68": "sixty eight dollars",
    "$85": "eighty five dollars",
    "$100": "one hundred dollars",
    "$150": "one hundred fifty dollars",
    "$200": "two hundred dollars",
    "$240": "two hundred forty dollars",
    "$500": "five hundred dollars",
    "$900": "nine hundred dollars",
    "$950": "nine hundred fifty dollars",
  };
  let normalized = text;
  for (const [source, target] of Object.entries(replacements)) {
    normalized = normalized.split(source).join(target);
  }
  normalized = normalized.split("—").join(", ");
  normalized = normalized.replace(/\s+/g, " ");
  return normalized.trim();
}

function audioPath(repoRoot, year, part, questionNo, group = null) {
  const folder = path.join(repoRoot, "audio", "toeic", year, `part${part}`);
  if (part === "1" || part === "2") {
    return path.join(folder, `question-${String(questionNo).padStart(3, "0")}.mp3`);
  }

  const match = (group || "").match(/(\d+)-(\d+)/);
  if (match) {
    return path.join(
      folder,
      `questions-${String(match[1]).padStart(3, "0")}-${String(match[2]).padStart(3, "0")}.mp3`
    );
  }

  return path.join(folder, `question-${String(questionNo).padStart(3, "0")}.mp3`);
}

function buildPart1Or2Job(repoRoot, year, item, voicePool) {
  const part = String(item.partNumber);
  const questionNo = parseInt(item.questionNo, 10);
  let spoken;
  if (part === "1") {
    spoken = `Question ${questionNo}. ${labelOptions(item.options)}`;
  } else {
    spoken = `Question ${questionNo}. ${item.question} ${labelOptions(item.options)}`;
  }

  const voice = selectVoice(voicePool, `part-${part}:question-${questionNo}:single-speaker`);
  return {
    part,
    output: audioPath(repoRoot, year, part, questionNo),
    segments: [[voice, normalizeTtsText(spoken)]]
  };
}

function groupIntro(part, group, talkType) {
  const readableGroup = group.replace("-", " through ");
  if (part === "3") {
    return `${readableGroup} refer to the following conversation.`;
  }
  const descriptor = String(talkType || "talk").replace("-", " ");
  const article = ["a", "e", "i", "o", "u"].includes(descriptor[0].toLowerCase()) ? "an" : "a";
  return `${readableGroup} refer to the following ${article} ${descriptor}.`;
}

function conversationSegments(passage, maleVoice, femaleVoice, narratorVoice) {
  const segments = [];
  for (const rawLine of passage.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("W:")) {
      segments.push([femaleVoice, normalizeTtsText(line.slice(2).trim())]);
    } else if (line.startsWith("M:")) {
      segments.push([maleVoice, normalizeTtsText(line.slice(2).trim())]);
    } else {
      segments.push([narratorVoice, normalizeTtsText(line)]);
    }
  }
  return segments;
}

function buildGroupedJobs(repoRoot, year, items, voicePool) {
  const jobs = [];
  const seen = new Set();

  for (const item of items) {
    const part = String(item.partNumber);
    if (part !== "3" && part !== "4") continue;

    const group = String(item.group || `Question ${item.questionNo}`);
    const passage = String(item.passage || item.transcript || "");
    const key = `${part}|${group}|${passage}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const intro = groupIntro(part, group, item.talkType);
    const baseKey = `part-${part}:group-${group}:question-${item.questionNo}`;
    const narratorVoice = selectVoice(voicePool, `${baseKey}:narrator`);
    let segments;
    if (part === "3") {
      const maleVoice = selectVoice(voicePool, `${baseKey}:male-speaker`, "Male");
      const femaleVoice = selectVoice(voicePool, `${baseKey}:female-speaker`, "Female");
      segments = [
        [narratorVoice, normalizeTtsText(intro)],
        ...conversationSegments(passage, maleVoice, femaleVoice, narratorVoice)
      ];
    } else {
      const text = `${intro} ${passage}`;
      segments = [[narratorVoice, normalizeTtsText(text)]];
    }

    jobs.push({
      part,
      output: audioPath(repoRoot, year, part, parseInt(item.questionNo, 10), group),
      segments
    });
  }

  return jobs;
}

function buildJobs(repoRoot, year, questions, selectedParts, voicePool) {
  const jobs = [];
  for (const item of questions) {
    const part = String(item.partNumber);
    if ((part === "1" || part === "2") && selectedParts.has(part)) {
      jobs.push(buildPart1Or2Job(repoRoot, year, item, voicePool));
    }
  }

  const groupedItems = questions.filter(item => selectedParts.has(String(item.partNumber)));
  jobs.push(...buildGroupedJobs(repoRoot, year, groupedItems, voicePool));
  return jobs;
}

async function synthesizeSegment(text, voice, rate) {
  const comm = new UniversalCommunicate(text, { voice, rate });
  const chunks = [];
  for await (const chunk of comm.stream()) {
    if (chunk.type === "audio") {
      chunks.push(chunk.data);
    }
  }
  return Buffer.concat(chunks);
}

async function synthesizeJob(job, force, rate, repoRoot) {
  const relative = path.relative(repoRoot, job.output);
  if (fs.existsSync(job.output) && !force) {
    return `skip ${relative}`;
  }

  const parentFolder = path.dirname(job.output);
  if (!fs.existsSync(parentFolder)) {
    fs.mkdirSync(parentFolder, { recursive: true });
  }

  if (job.segments.length === 1) {
    const [voice, text] = job.segments[0];
    const audioBuffer = await synthesizeSegment(text, voice, rate);
    fs.writeFileSync(job.output, audioBuffer);
    return `write ${relative}`;
  }

  const segmentBuffers = [];
  for (const [voice, text] of job.segments) {
    const buffer = await synthesizeSegment(text, voice, rate);
    segmentBuffers.push(buffer);
  }

  const combinedBuffer = Buffer.concat(segmentBuffers);
  fs.writeFileSync(job.output, combinedBuffer);
  return `write ${relative}`;
}

function parseArgs() {
  const args = {
    year: YEAR_DEFAULT,
    parts: "1,2,3,4",
    force: false,
    dryRun: false,
    rate: DEFAULT_RATE,
    voiceCount: DEFAULT_VOICE_COUNT,
    printVoicePool: false,
  };

  const rawArgs = process.argv.slice(2);
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === "--year") {
      args.year = rawArgs[++i];
    } else if (arg === "--parts") {
      args.parts = rawArgs[++i];
    } else if (arg === "--force") {
      args.force = true;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--rate") {
      args.rate = rawArgs[++i];
    } else if (arg === "--voice-count") {
      args.voiceCount = parseInt(rawArgs[++i], 10);
    } else if (arg === "--print-voice-pool") {
      args.printVoicePool = true;
    }
  }
  return args;
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const args = parseArgs();

  if (!SUPPORTED_YEAR_PATTERN.test(args.year)) {
    console.error("--year must be a four-digit year, for example 2018.");
    process.exit(1);
  }

  const selectedParts = new Set(
    args.parts
      .split(",")
      .map(part => part.trim())
      .filter(Boolean)
  );

  const invalidParts = [...selectedParts].filter(part => !["1", "2", "3", "4"].includes(part));
  if (invalidParts.length > 0) {
    console.error(`Only Listening parts 1-4 are supported. Invalid: ${invalidParts.join(", ")}`);
    process.exit(1);
  }

  if (args.voiceCount < 1) {
    console.error("--voice-count must be at least 1.");
    process.exit(1);
  }

  console.log("Loading stable voice pool...");
  const voicePool = await loadVoicePool(args.voiceCount);

  if (args.printVoicePool) {
    console.log("Stable English edge-tts voice pool:");
    voicePool.forEach((voice, index) => {
      console.log(`  ${String(index + 1).padStart(2, "0")}. ${voice.shortName} (${voice.locale}, ${voice.gender})`);
    });
  }

  const questions = loadQuestions(args.year, repoRoot);
  const jobs = buildJobs(repoRoot, args.year, questions, selectedParts, voicePool);

  console.log(`TOEIC ${args.year} Listening audio jobs: ${jobs.length}`);
  console.log(`Using ${voicePool.length} stable English edge-tts voices.`);

  for (const job of jobs) {
    const relative = path.relative(repoRoot, job.output);
    if (args.dryRun) {
      const voicesSummary = Array.from(new Set(job.segments.map(seg => seg[0]))).join(", ");
      console.log(`dry-run ${relative} voices=[${voicesSummary}]`);
    } else {
      try {
        const result = await synthesizeJob(job, args.force, args.rate, repoRoot);
        console.log(result);
      } catch (err) {
        console.error(`Failed to synthesize ${relative}:`, err.message);
      }
    }
  }
}

main().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
