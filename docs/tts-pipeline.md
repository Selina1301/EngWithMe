# TOEIC TTS Pipeline

## Summary

Audio should be generated before learners open a test. The learner-facing UI should play stored audio files instead of calling TTS in real time.

Pipeline:

1. Script input.
2. Text normalization.
3. Voice assignment.
4. TTS generation.
5. Audio post-processing.
6. Quality check.
7. Store audio.
8. Publish content.

## Admin Workflow

1. Admin imports or writes script/transcript.
2. Admin selects TOEIC part.
3. Admin sets voice, accent, speed, pause length, style, and volume.
4. Admin clicks Generate Audio.
5. Backend creates a TTS job.
6. Worker calls TTS provider.
7. Worker stores generated audio.
8. Admin previews audio.
9. Admin approves or regenerates.
10. Approved audio becomes visible to learners.

## Text Normalization

The goal is to make TTS read business English naturally.

Examples:

- `Mr. Kim` -> `Mister Kim`
- `8:30 a.m.` -> `eight thirty A M`
- `$250` -> `two hundred fifty dollars`
- `555-0186` -> `five five five, zero one eight six`
- `Room 204` -> `Room two oh four`
- `12%` -> `twelve percent`

Normalization should preserve the learner-facing transcript separately from the TTS input. The transcript shown in review should stay natural and readable.

## Voice Assignment

### Part 1

- One narrator voice.
- Reads four statements.

### Part 2

- One question voice.
- One response voice or same voice for all choices.
- Optional different voice for realistic TOEIC style.

### Part 3

- At least two voices.
- Speaker roles should map to stable voice IDs.

Example:

```json
{
  "speaker_1": {
    "name": "Man",
    "gender": "male",
    "accent": "US",
    "voice_id": "us_male_01"
  },
  "speaker_2": {
    "name": "Woman",
    "gender": "female",
    "accent": "US",
    "voice_id": "us_female_01"
  }
}
```

### Part 4

- One narrator voice.
- Voice should match talk type where possible.

## Audio Post-Processing

Minimum processing:

- Normalize volume.
- Add short pauses between choices or speaker turns.
- Combine speaker turns for Part 3.
- Export MP3 for web playback.
- Keep source WAV if higher quality editing is needed later.

Optional later processing:

- Noise reduction.
- Loudness normalization by LUFS.
- Silence trimming.
- Fade in/out.

## Playback Speed

Recommended approach:

- Generate audio at normal TOEIC speed.
- Let the frontend provide playback controls:
  - 0.8x
  - 1.0x
  - 1.2x

Avoid generating separate files for slow/fast unless analytics show a real need.

## Quality Check

Before publishing, admin should verify:

- Names, numbers, dates, prices, and times are pronounced correctly.
- Pauses are natural.
- Part 3 speaker turns are clear.
- Volume is consistent.
- No clipped audio.
- Correct file is attached to correct question/set.

Content status should follow:

Draft -> Generate Audio -> Review -> Approved -> Published

## File Storage

Recommended local MVP paths:

- `storage/audio/toeic/{year}/part{part}/...`
- `images/toeic/{year}/part{part}/...`

Recommended production storage:

- S3-compatible object storage.
- Store public URLs or signed URLs in database.
- Store checksum and duration for validation.

## Failure Handling

TTS jobs should record:

- status.
- provider response.
- error message.
- retry count.
- normalized input script.

If generation fails, learner UI should not break. It should show an audio missing state and still allow review/testing when appropriate.

## Current Local Generator

The current project includes a local generator for TOEIC Listening 2017:

```powershell
python tools\generate_toeic_2017_audio.py --force
```

To verify the stable 30-voice pool without writing MP3 files:

```powershell
python tools\generate_toeic_2017_audio.py --dry-run --print-voice-pool
```

It reads `js/toeic/2017-listening.js` and writes MP3 files to:

- `audio/toeic/2017/part1/`
- `audio/toeic/2017/part2/`
- `audio/toeic/2017/part3/`
- `audio/toeic/2017/part4/`

Generation details:

- The generator queries `edge-tts` for real English neural voices and selects a deterministic 30-voice pool by default.
- Each question or listening set gets a stable voice assignment based on a hash of its part/question/group key, so rerunning the script keeps the same voice for the same item.
- Part 1 and Part 2 use one MP3 per question.
- Part 3 and Part 4 use one MP3 per listening set.
- Part 3 uses separate male and female neural voices by speaker line when matching voices are available in the 30-voice pool.
- The frontend reads `audioUrl` directly from the listening data file.
