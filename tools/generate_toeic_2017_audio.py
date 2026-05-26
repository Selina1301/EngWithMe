"""Generate TOEIC 2017 Listening MP3 files from js/toeic/2017-listening.js.

This script uses edge-tts neural voices and writes browser-ready MP3 files into:
audio/toeic/2017/part1..part4/

Usage:
  python tools/generate_toeic_2017_audio.py
  python tools/generate_toeic_2017_audio.py --force
  python tools/generate_toeic_2017_audio.py --parts 1,2
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

try:
    import edge_tts
except ImportError as exc:  # pragma: no cover - developer setup guard
    raise SystemExit(
        "Missing dependency: edge-tts. Install it with: python -m pip install --user edge-tts"
    ) from exc


REPO_ROOT = Path(__file__).resolve().parents[1]
YEAR = "2017"
DEFAULT_RATE = "+0%"
DEFAULT_VOICE_COUNT = 30
PREFERRED_ENGLISH_LOCALES = (
    "en-US",
    "en-GB",
    "en-AU",
    "en-CA",
    "en-IN",
    "en-IE",
    "en-NZ",
    "en-ZA",
    "en-SG",
    "en-HK",
    "en-PH",
    "en-KE",
    "en-NG",
    "en-TZ",
    "en-GH",
)
PINNED_ENGLISH_VOICE_POOL = (
    "en-US-AnaNeural",
    "en-GB-LibbyNeural",
    "en-AU-NatashaNeural",
    "en-CA-ClaraNeural",
    "en-IN-NeerjaExpressiveNeural",
    "en-IE-EmilyNeural",
    "en-NZ-MollyNeural",
    "en-ZA-LeahNeural",
    "en-SG-LunaNeural",
    "en-HK-YanNeural",
    "en-PH-RosaNeural",
    "en-KE-AsiliaNeural",
    "en-NG-EzinneNeural",
    "en-TZ-ImaniNeural",
    "en-US-AriaNeural",
    "en-GB-MaisieNeural",
    "en-AU-WilliamMultilingualNeural",
    "en-CA-LiamNeural",
    "en-IN-NeerjaNeural",
    "en-IE-ConnorNeural",
    "en-NZ-MitchellNeural",
    "en-ZA-LukeNeural",
    "en-SG-WayneNeural",
    "en-HK-SamNeural",
    "en-PH-JamesNeural",
    "en-KE-ChilembaNeural",
    "en-NG-AbeoNeural",
    "en-TZ-ElimuNeural",
    "en-US-AvaMultilingualNeural",
    "en-GB-SoniaNeural",
)


@dataclass(frozen=True)
class TtsVoice:
    short_name: str
    locale: str
    gender: str
    display_name: str


@dataclass(frozen=True)
class AudioJob:
    part: str
    output: Path
    segments: tuple[tuple[str, str], ...]


def run_node_json(script: str) -> object:
    node = shutil.which("node")
    if not node:
        raise SystemExit("Node.js is required to read the TOEIC JS data file.")

    result = subprocess.run(
        [node, "-e", script],
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return json.loads(result.stdout)


def load_questions() -> list[dict]:
    script = r"""
const fs = require("fs");
const vm = require("vm");
const context = { window: {} };
context.window.window = context.window;
vm.createContext(context);
vm.runInContext(fs.readFileSync("js/toeic/2017-listening.js", "utf8"), context);
console.log(JSON.stringify(context.window.TOEIC_LISTENING_EXAMS.y2017.questions));
"""
    data = run_node_json(script)
    if not isinstance(data, list):
      raise SystemExit("Could not load TOEIC Listening 2017 question data.")
    return data


def label_options(options: Iterable[str]) -> str:
    labels = ["A", "B", "C", "D"]
    return " ".join(f"{labels[index]}. {option}" for index, option in enumerate(options))


def normalize_tts_text(text: str) -> str:
    replacements = {
        "A.M.": "A M",
        "P.M.": "P M",
        "a.m.": "A M",
        "p.m.": "P M",
        "Ms.": "Miss",
        "Mr.": "Mister",
        "Dr.": "Doctor",
        "St.": "Saint",
        "555-0186": "five five five, zero one eight six",
        "8:15": "eight fifteen",
        "8:30": "eight thirty",
        "10:00": "ten o'clock",
        "3:00": "three o'clock",
        "15 percent": "fifteen percent",
        "20 percent": "twenty percent",
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
    }
    normalized = text
    for source, target in replacements.items():
        normalized = normalized.replace(source, target)
    normalized = normalized.replace("—", ", ")
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.strip()


def stable_index(key: str, modulo: int) -> int:
    if modulo <= 0:
        raise ValueError("Cannot select a voice from an empty voice pool.")
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return int(digest[:12], 16) % modulo


def locale_rank(locale: str) -> int:
    try:
        return PREFERRED_ENGLISH_LOCALES.index(locale)
    except ValueError:
        return len(PREFERRED_ENGLISH_LOCALES)


def normalize_edge_voice(raw_voice: dict) -> TtsVoice:
    short_name = str(raw_voice.get("ShortName") or "")
    locale = str(raw_voice.get("Locale") or short_name[:5])
    gender = str(raw_voice.get("Gender") or "Unknown")
    display_name = str(raw_voice.get("FriendlyName") or raw_voice.get("DisplayName") or short_name)
    return TtsVoice(short_name=short_name, locale=locale, gender=gender, display_name=display_name)


def sort_voices(voices: list[TtsVoice]) -> list[TtsVoice]:
    return sorted(
        voices,
        key=lambda voice: (
            locale_rank(voice.locale),
            0 if voice.gender.lower() == "female" else 1,
            voice.short_name,
        ),
    )


def diversify_voice_pool(voices: list[TtsVoice], size: int) -> list[TtsVoice]:
    by_locale: dict[str, list[TtsVoice]] = {}
    for voice in sort_voices(voices):
        by_locale.setdefault(voice.locale, []).append(voice)

    pool: list[TtsVoice] = []
    locale_order = sorted(by_locale, key=locale_rank)
    while len(pool) < size:
        added = False
        for locale in locale_order:
            locale_voices = by_locale[locale]
            if locale_voices:
                pool.append(locale_voices.pop(0))
                added = True
                if len(pool) == size:
                    break
        if not added:
            break
    return pool


async def load_voice_pool(size: int) -> list[TtsVoice]:
    raw_voices = await edge_tts.list_voices()
    english_neural_voices = [
        normalize_edge_voice(voice)
        for voice in raw_voices
        if str(voice.get("Locale") or "").startswith("en-")
        and str(voice.get("ShortName") or "").endswith("Neural")
    ]
    voices_by_short_name = {voice.short_name: voice for voice in english_neural_voices}
    voice_pool = [
        voices_by_short_name[short_name]
        for short_name in PINNED_ENGLISH_VOICE_POOL[:size]
        if short_name in voices_by_short_name
    ]
    if len(voice_pool) < size:
        pinned_names = {voice.short_name for voice in voice_pool}
        remaining_voices = [
            voice for voice in english_neural_voices
            if voice.short_name not in pinned_names
        ]
        voice_pool.extend(diversify_voice_pool(remaining_voices, size - len(voice_pool)))
    if len(voice_pool) < size:
        raise SystemExit(
            f"edge-tts returned only {len(voice_pool)} English neural voices; {size} are required. "
            "Try a smaller --voice-count value or check your edge-tts/network setup."
        )
    return voice_pool


def select_voice(voice_pool: list[TtsVoice], key: str, gender: str | None = None) -> str:
    candidates = [
        voice for voice in voice_pool
        if not gender or voice.gender.lower() == gender.lower()
    ]
    if not candidates:
        candidates = voice_pool
    return candidates[stable_index(key, len(candidates))].short_name


def print_voice_pool(voice_pool: list[TtsVoice]) -> None:
    print("Stable English edge-tts voice pool:")
    for index, voice in enumerate(voice_pool, start=1):
        print(f"  {index:02d}. {voice.short_name} ({voice.locale}, {voice.gender})")


def audio_path(part: str, question_no: int, group: str | None = None) -> Path:
    folder = REPO_ROOT / "audio" / "toeic" / YEAR / f"part{part}"
    if part in {"1", "2"}:
        return folder / f"question-{question_no:03d}.mp3"

    match = re.search(r"(\d+)-(\d+)", group or "")
    if match:
        return folder / f"questions-{int(match.group(1)):03d}-{int(match.group(2)):03d}.mp3"

    return folder / f"question-{question_no:03d}.mp3"


def build_part_1_or_2_job(item: dict, voice_pool: list[TtsVoice]) -> AudioJob:
    part = str(item["partNumber"])
    question_no = int(item["questionNo"])
    if part == "1":
        spoken = f"Question {question_no}. {label_options(item['options'])}"
    else:
        spoken = f"Question {question_no}. {item['question']} {label_options(item['options'])}"

    voice = select_voice(voice_pool, f"part-{part}:question-{question_no}:single-speaker")
    return AudioJob(
        part=part,
        output=audio_path(part, question_no),
        segments=((voice, normalize_tts_text(spoken)),),
    )


def group_intro(part: str, group: str, talk_type: str | None) -> str:
    readable_group = group.replace("-", " through ")
    if part == "3":
        return f"{readable_group} refer to the following conversation."
    descriptor = str(talk_type or "talk").replace("-", " ")
    article = "an" if descriptor[:1].lower() in {"a", "e", "i", "o", "u"} else "a"
    return f"{readable_group} refer to the following {article} {descriptor}."


def conversation_segments(
    passage: str,
    male_voice: str,
    female_voice: str,
    narrator_voice: str,
) -> list[tuple[str, str]]:
    segments: list[tuple[str, str]] = []
    for raw_line in passage.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("W:"):
            segments.append((female_voice, normalize_tts_text(line[2:].strip())))
        elif line.startswith("M:"):
            segments.append((male_voice, normalize_tts_text(line[2:].strip())))
        else:
            segments.append((narrator_voice, normalize_tts_text(line)))
    return segments


def build_grouped_jobs(items: list[dict], voice_pool: list[TtsVoice]) -> list[AudioJob]:
    jobs: list[AudioJob] = []
    seen: set[tuple[str, str, str]] = set()

    for item in items:
        part = str(item["partNumber"])
        if part not in {"3", "4"}:
            continue

        group = str(item.get("group") or f"Question {item['questionNo']}")
        passage = str(item.get("passage") or item.get("transcript") or "")
        key = (part, group, passage)
        if key in seen:
            continue
        seen.add(key)

        intro = group_intro(part, group, item.get("talkType"))
        base_key = f"part-{part}:group-{group}:question-{item['questionNo']}"
        narrator_voice = select_voice(voice_pool, f"{base_key}:narrator")
        if part == "3":
            male_voice = select_voice(voice_pool, f"{base_key}:male-speaker", gender="Male")
            female_voice = select_voice(voice_pool, f"{base_key}:female-speaker", gender="Female")
            segments = [
                (narrator_voice, normalize_tts_text(intro)),
                *conversation_segments(passage, male_voice, female_voice, narrator_voice),
            ]
        else:
            text = f"{intro} {passage}"
            segments = [(narrator_voice, normalize_tts_text(text))]

        jobs.append(
            AudioJob(
                part=part,
                output=audio_path(part, int(item["questionNo"]), group),
                segments=tuple(segments),
            )
        )

    return jobs


def build_jobs(questions: list[dict], selected_parts: set[str], voice_pool: list[TtsVoice]) -> list[AudioJob]:
    jobs: list[AudioJob] = []
    for item in questions:
        part = str(item["partNumber"])
        if part in {"1", "2"} and part in selected_parts:
            jobs.append(build_part_1_or_2_job(item, voice_pool))

    grouped_items = [item for item in questions if str(item["partNumber"]) in selected_parts]
    jobs.extend(build_grouped_jobs(grouped_items, voice_pool))
    return jobs


async def synthesize_segment(text: str, voice: str, output: Path, rate: str) -> None:
    communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate)
    await communicate.save(str(output))


async def synthesize_job(job: AudioJob, force: bool, rate: str) -> str:
    if job.output.exists() and not force:
        return f"skip {job.output.relative_to(REPO_ROOT)}"

    job.output.parent.mkdir(parents=True, exist_ok=True)

    if len(job.segments) == 1:
        voice, text = job.segments[0]
        await synthesize_segment(text, voice, job.output, rate)
        return f"write {job.output.relative_to(REPO_ROOT)}"

    with tempfile.TemporaryDirectory(prefix="toeic-tts-") as temp_dir:
        temp_path = Path(temp_dir)
        segment_files: list[Path] = []
        for index, (voice, text) in enumerate(job.segments):
            segment_output = temp_path / f"segment-{index:03d}.mp3"
            await synthesize_segment(text, voice, segment_output, rate)
            segment_files.append(segment_output)

        with job.output.open("wb") as destination:
            for segment_file in segment_files:
                destination.write(segment_file.read_bytes())

    return f"write {job.output.relative_to(REPO_ROOT)}"


def job_voice_summary(job: AudioJob) -> str:
    voices = []
    for voice, _text in job.segments:
        if voice not in voices:
            voices.append(voice)
    return ", ".join(voices)


async def generate(jobs: list[AudioJob], force: bool, rate: str, dry_run: bool) -> None:
    for job in jobs:
        relative = job.output.relative_to(REPO_ROOT)
        if dry_run:
            print(f"dry-run {relative} voices=[{job_voice_summary(job)}]")
            continue
        print(await synthesize_job(job, force, rate))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--parts", default="1,2,3,4", help="Comma-separated parts to generate.")
    parser.add_argument("--force", action="store_true", help="Overwrite existing MP3 files.")
    parser.add_argument("--dry-run", action="store_true", help="Print files without generating audio.")
    parser.add_argument("--rate", default=DEFAULT_RATE, help='edge-tts speaking rate, for example "+0%%" or "-10%%".')
    parser.add_argument("--voice-count", type=int, default=DEFAULT_VOICE_COUNT, help="Number of real English edge-tts voices to use.")
    parser.add_argument("--print-voice-pool", action="store_true", help="Print the selected stable voice pool before generating.")
    return parser.parse_args()


async def async_main() -> int:
    args = parse_args()
    selected_parts = {part.strip() for part in args.parts.split(",") if part.strip()}
    invalid_parts = selected_parts - {"1", "2", "3", "4"}
    if invalid_parts:
        raise SystemExit(f"Only Listening parts 1-4 are supported. Invalid: {', '.join(sorted(invalid_parts))}")
    if args.voice_count < 1:
        raise SystemExit("--voice-count must be at least 1.")

    voice_pool = await load_voice_pool(args.voice_count)
    if args.print_voice_pool:
        print_voice_pool(voice_pool)
    questions = load_questions()
    jobs = build_jobs(questions, selected_parts, voice_pool)
    print(f"TOEIC {YEAR} Listening audio jobs: {len(jobs)}")
    print(f"Using {len(voice_pool)} stable English edge-tts voices.")
    await generate(jobs, force=args.force, rate=args.rate, dry_run=args.dry_run)
    return 0


def main() -> int:
    return asyncio.run(async_main())


if __name__ == "__main__":
    sys.exit(main())
