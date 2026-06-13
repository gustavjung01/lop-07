# Grade 7 enriched data

Raw data lives in `src/data/grade7/raw/` and should stay unchanged.

Add lesson enrichment here in small reviewed batches. Recommended batch size: 5-10 lessons.

Suggested files:

- `math.batch01.lessons.json`
- `math.batch02.lessons.json`
- `khtn.batch01.lessons.json`
- `english.batch01.lessons.json`

Each record should follow `EnrichedLesson` from `types.ts`:

```json
{
  "lessonId": "g7_math_001",
  "subjectKey": "math",
  "learningObjectives": [],
  "easyExplanation": "",
  "workedExamples": [],
  "steps": [],
  "commonMistakes": [],
  "quickMemory": "",
  "warmupQuestions": [],
  "applicationQuestions": [],
  "mediaHints": [],
  "textbookMap": {
    "status": "unmapped",
    "bookSeries": null,
    "bookLessonTitle": null,
    "bookPage": null
  },
  "updatedAt": "2026-06-09"
}
```

Do not paste textbook content verbatim. Use this layer for original explanations, examples, mistakes, practice prompts, and safe textbook mapping metadata.
