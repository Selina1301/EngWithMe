# TOEIC Platform Database Design

## Summary

The current project stores most TOEIC content in JavaScript files. A production TOEIC TTS platform should eventually move TOEIC content, audio metadata, attempts, and mistake analytics into the database.

This design targets MySQL/MariaDB compatibility because the current project uses XAMPP/PHP. If the system is later migrated to a larger backend, the same model can be ported to PostgreSQL.

## Core Tables

### toeic_tests

Represents a full TOEIC test or practice set.

Columns:

- id
- slug
- title
- year
- level
- status: draft, review, approved, published, archived
- duration_minutes
- created_by
- created_at
- updated_at

### toeic_listening_sets

Represents one shared audio unit. Part 1 and Part 2 can still use this table with one question per set. Part 3 and Part 4 use it naturally because one audio supports three questions.

Columns:

- id
- test_id
- part
- question_start
- question_end
- title
- topic
- difficulty
- accent
- speed
- skill
- trap_type
- talk_type
- transcript
- normalized_script
- image_url
- audio_url
- audio_status: missing, pending, generated, reviewed, approved, failed
- voice_config_json
- metadata_json
- created_at
- updated_at

### toeic_questions

Represents each scored question.

Columns:

- id
- test_id
- listening_set_id nullable
- part
- question_no
- question_text
- correct_answer_label
- explanation
- evidence_text
- skill
- trap_type
- topic
- difficulty
- metadata_json
- created_at
- updated_at

### toeic_answers

Represents answer choices.

Columns:

- id
- question_id
- label
- answer_text
- is_correct
- explanation
- sort_order

### toeic_vocabulary_items

Stores vocabulary linked to a question or listening set.

Columns:

- id
- test_id
- question_id nullable
- listening_set_id nullable
- term
- meaning
- example
- audio_url nullable

### toeic_paraphrase_pairs

Stores TOEIC paraphrase mappings.

Columns:

- id
- source_phrase
- answer_phrase
- meaning
- topic
- difficulty
- created_at

Examples:

- postponed = delayed
- purchase = buy
- reserve = book
- attend = participate in
- approximately = about

## Attempt And Progress Tables

### toeic_attempts

One submitted test/practice session.

Columns:

- id
- user_id
- test_id
- mode: practice, test, review
- selected_parts
- score
- correct_count
- total_questions
- duration_seconds
- submitted_at

### toeic_attempt_answers

One row per answered question.

Columns:

- id
- attempt_id
- user_id
- question_id
- selected_answer_label
- is_correct
- time_spent_seconds
- listened_count
- created_at

### toeic_mistake_logs

Aggregated mistake notebook.

Columns:

- id
- user_id
- question_id
- part
- trap_type
- skill
- topic
- wrong_count
- last_selected_answer_label
- last_attempted_at

### toeic_user_progress

Aggregated progress by part/topic/skill.

Columns:

- id
- user_id
- scope_type: part, topic, skill, trap_type, test
- scope_key
- correct_count
- total_count
- accuracy
- updated_at

## Audio And TTS Tables

### toeic_audio_files

Stores generated or uploaded audio metadata.

Columns:

- id
- listening_set_id
- provider
- voice_id
- accent
- speed
- format
- file_url
- duration_seconds
- checksum
- status: pending, generated, reviewed, approved, failed
- created_at

### toeic_tts_jobs

Tracks background TTS generation.

Columns:

- id
- listening_set_id
- requested_by
- provider
- voice_config_json
- input_script
- normalized_script
- status: queued, running, succeeded, failed
- error_message
- created_at
- started_at
- finished_at

## Migration Strategy

Phase 1:

- Keep current JS data as the source of truth.
- Add database tables only for attempts and results.

Phase 2:

- Import TOEIC content from JS into database tables.
- Keep JS export generation as a fallback for the static frontend.

Phase 3:

- Admin creates and publishes content directly from database.
- Frontend loads TOEIC content through API.

Phase 4:

- Add TTS jobs, audio review workflow, analytics, and adaptive practice.
