# ICNDY backup format

ICNDY exports a UTF-8 JSON object with `schemaVersion: 1`. The object contains:

- `exportedAt`: ISO-8601 export timestamp.
- `sessions`: all locally persisted workout sessions, including an in-progress session when one exists.
- `settings`: persisted app preferences. Older version-1 files may omit preferences added later; those fields receive the current safe defaults.
- `schedules`: all persisted training schedule periods.

The restore flow parses and validates the complete object before opening a write transaction. It checks identifiers, dates, enum values, numeric ranges, movement structures, score consistency, duplicate identifiers, and schedule weekdays. An unknown schema version is rejected. Restore replaces the local sessions, preferences, and schedules only after validation; SQLite rolls back the transaction if a write fails. No secrets, notification tokens, or device metadata are included.
