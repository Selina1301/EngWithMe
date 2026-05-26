# TOEIC Content Guidelines

## Summary

High-value TOEIC content needs more than questions and answers. Each item should include metadata, transcript, explanation, vocabulary, and review evidence so learners understand why they were wrong.

## Required Metadata

Every question or listening set should include:

- part.
- topic.
- difficulty.
- accent.
- speed.
- skill.
- correct answer.
- transcript.
- explanation.

Recommended example:

```json
{
  "part": 2,
  "topic": "office",
  "difficulty": "easy",
  "accent": "US",
  "speed": "normal",
  "skill": "when question",
  "trap_type": "wrong question word",
  "answer": "B"
}
```

## Explanation Quality

A good explanation should:

- Refer to the exact audio phrase.
- Explain why the correct answer is correct.
- Explain the trap when useful.
- Avoid vague notes like "correct answer from the answer key."

Example:

Audio says:

`I'm waiting for the final numbers.`

Correct answer:

`The final numbers.`

Explanation:

`This is a direct detail question. The phrase "final numbers" directly answers what the woman is waiting for.`

## Transcript Highlighting

Each question should optionally store evidence text.

Example:

- transcript: `The event has been postponed.`
- answer: `The event was delayed.`
- evidence_text: `postponed`
- paraphrase: `postponed = delayed`

During review, highlight evidence text and show the paraphrase.

## Part 1 Guidelines

Each Part 1 item should include:

- clear image.
- four concise statements.
- only one statement that fully describes the picture.
- distractors that are plausible but visibly wrong.

Common distractor types:

- wrong object.
- wrong action.
- wrong location.
- wrong number of people.
- passive/active confusion.

## Part 2 Guidelines

Part 2 should not show question text during test mode.

Each item should include trap type:

- who.
- where.
- when.
- why.
- how.
- similar sound.
- wrong tense.
- indirect answer.
- yes/no question.
- repeated keyword.

Explanation should name the question type and the reason.

Example:

`The question asks about time, so "At nine thirty" is correct.`

## Part 3 Guidelines

Each conversation should include:

- topic.
- speaker roles.
- relationship between speakers when inferable.
- problem-solution if present.
- next action when asked.
- paraphrase mapping where relevant.

Good question mix:

- main topic.
- specific detail.
- speaker intention.
- next action.
- location.
- inference.

## Part 4 Guidelines

Each talk should include talk type:

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

Good question mix:

- main idea.
- speaker purpose.
- specific detail.
- next step.
- schedule/time/place.
- inference.

## Vocabulary

Vocabulary should be linked to the question or listening set.

Recommended fields:

- term.
- meaning.
- example.
- part.
- topic.
- difficulty.

## Review UX Requirements

After submit, show:

- score.
- correct answer.
- selected answer.
- transcript.
- explanation.
- evidence highlight.
- trap type.
- vocabulary.

Later enhancements:

- mistake notebook.
- repeated trap analysis.
- recommended practice.
- paraphrase drills.
