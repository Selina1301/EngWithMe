# TOEIC TTS Platform Product Requirements

## Summary

The platform has two major systems:

- Content Production System: admin creates TOEIC listening content, generates and reviews audio, then publishes tests.
- Student Practice System: learners take TOEIC practice tests, receive scores, review transcript and explanation, and track progress.

The current codebase is a static/PHP learning site. The immediate product direction is to evolve the TOEIC test flow from Reading-only into a full TOEIC practice engine with Listening Part 1-4 and Reading Part 5-7.

## MVP Scope

The first complete MVP should include:

- Admin can create TOEIC Part 1-4 content records.
- Admin can attach or generate audio for listening content.
- Learners can select TOEIC parts and take a test.
- The system scores answers automatically.
- Review mode shows transcript, explanation, correct answer, and selected answer.
- Attempt history is saved.

Out of MVP:

- Adaptive practice.
- Speech scoring.
- Advanced AI explanation generation.
- Full background worker infrastructure.

## User Roles

### Admin

Admin workflow:

1. Create or import transcript/script.
2. Select TOEIC part.
3. Add answer choices, correct answers, explanations, vocabulary, and metadata.
4. Choose voice/accent/speed settings.
5. Generate audio through TTS or upload audio manually.
6. Preview and quality-check the audio.
7. Move content through Draft, Generated, Review, Approved, and Published states.

### Learner

Learner workflow:

1. Choose TOEIC year or practice set.
2. Choose Part and duration.
3. Listen to audio where available.
4. Select answers.
5. Submit.
6. Review score, mistakes, transcript, explanation, and vocabulary.
7. Continue recommended practice later.

## TOEIC Part Requirements

### Part 1: Photographs

Each item needs:

- Image.
- Four answer choices.
- Audio containing four statements.
- Correct answer.
- Transcript.
- Explanation.
- Vocabulary.
- Metadata: topic, difficulty, accent, speed, skill.

Learner UI:

- Large image.
- Audio player.
- Four choices.
- Transcript hidden during attempt.
- Transcript and explanation shown after submit.

### Part 2: Question-Response

Each item needs:

- Question script.
- Three response choices.
- Audio.
- Correct answer.
- Transcript.
- Explanation.
- Trap type.

Learner UI:

- No visible question text during attempt.
- Audio player.
- Three choices.
- Review shows full transcript and trap type.

Trap types:

- who, where, when, why, how.
- similar sound.
- wrong tense.
- indirect answer.
- yes/no question.
- repeated keyword.

### Part 3: Conversations

Each listening set needs:

- Conversation transcript.
- Speaker roles and voices.
- Audio conversation.
- Three questions.
- Four choices per question.
- Correct answers.
- Explanations.
- Skill focus.

Useful metadata:

- Topic.
- Relationship between speakers.
- Speaker intention.
- Next action.
- Location.
- Problem-solution.
- Paraphrase mapping.

### Part 4: Talks

Each listening set needs:

- Talk script.
- One narrator voice.
- Audio talk.
- Three questions.
- Four choices per question.
- Correct answers.
- Transcript.
- Explanation.
- Talk type.
- Key vocabulary.

Talk types:

- announcement.
- advertisement.
- telephone message.
- news report.
- meeting speech.
- tour guide speech.
- weather report.
- instruction.
- public notice.
- business presentation.

## Student Modes

### Practice Mode

- Learner works question by question.
- Immediate or near-immediate feedback can be enabled.
- Transcript, explanation, and vocabulary are available after answering.

### Test Mode

- Simulates real TOEIC behavior.
- Transcript hidden until submit.
- Time limit enabled.
- Score shown at the end.
- Review available after submission.

### Review Mode

- Shows wrong answers.
- Shows trap types.
- Shows transcript and highlighted answer evidence.
- Supports replaying audio.
- Later can recommend similar questions.

## Valuable Differentiators

Prioritize these after MVP:

- Smart transcript highlighting.
- Paraphrase training.
- Mistake analysis by part, trap type, topic, and skill.
- Adaptive practice recommendations.
- Shadowing mode.
- Speech-to-text and speech scoring.

## Current Implementation Notes

As of the current project state:

- TOEIC Reading 2017-2025 exists in `js/toeic/*.js`.
- TOEIC Listening 2017 Part 1-4 exists in `js/toeic/2017-listening.js`.
- TOEIC 2017 can expose Part 1-7 in the existing `quiz.html` to `exam-practice.html` flow.
- Audio fields currently support `audioUrl`, but audio generation and storage are not implemented yet.
