# Page-grounded concise chatbot answers

## Goal

Make the n8n advising chatbot answer only the question asked, keep ordinary answers short, and show the source document and PDF page in the chat whenever a Pinecone curriculum document contributed to the answer.

## Confirmed behavior

- Ordinary answers contain at most 2–4 short sentences or three bullets.
- The chatbot does not repeat the question, add unrelated background, or end with an offer for more help.
- A complete course list or table is allowed only when the user explicitly asks for all courses, every course, details, an enumeration, or a table.
- Evidence appears at the end of an answer only when a Pinecone retrieval tool was used.
- Evidence uses retrieved metadata. Missing page metadata is reported as unavailable; it is never guessed.
- The same rules apply to all nine curriculum namespaces: `INE-62`, `INE-67`, `INET-62`, `INET-67`, `IT-62`, `IT-67`, `ITI-61`, `ITI-66`, and `ITT-67`.

## Chosen approach

Use page-preserving binary PDF ingestion, narrowly described Pinecone tools, a compact response policy in the AI Agent, and deterministic evidence assembly from the Agent's intermediate tool results. The existing `@n8n/chat` frontend will continue to receive one Markdown `output` string, so no custom renderer is required.

Rejected alternatives:

1. Prompt-only citations are smaller but allow the model to invent a file or page and therefore do not meet the grounding requirement.
2. A structured `answer`/`sources` response with a custom React source panel is more flexible but adds frontend work without improving the initial evidence contract.

## Workflow changes

### Page-preserving ingestion

For each curriculum branch, bypass the `Extract from File` node and pass the Google Drive PDF binary directly to its insertion-mode Pinecone node. Configure the connected Default Data Loader for binary PDF input, load all input data, and retain custom text splitting. Preserve `file_name`, add `curriculum`, and retain the PDF loader's page metadata (`loc.pageNumber`) on every resulting chunk.

| Curriculum | Download | Bypass | Insert store | Data loader | Text splitter |
| --- | --- | --- | --- | --- | --- |
| INE-62 | Download file | Extract from File | Pinecone Vector Store | Default Data Loader | Recursive Character Text Splitter8 |
| INE-67 | Download file1 | Extract from File1 | Pinecone Vector Store2 | Default Data Loader1 | Recursive Character Text Splitter7 |
| INET-62 | Download file2 | Extract from File2 | Pinecone Vector Store3 | Default Data Loader2 | Recursive Character Text Splitter6 |
| INET-67 | Download file3 | Extract from File3 | Pinecone Vector Store4 | Default Data Loader3 | Recursive Character Text Splitter5 |
| IT-62 | Download file4 | Extract from File4 | Pinecone Vector Store5 | Default Data Loader4 | Recursive Character Text Splitter4 |
| IT-67 | Download file5 | Extract from File5 | Pinecone Vector Store6 | Default Data Loader5 | Recursive Character Text Splitter3 |
| ITI-61 | Download file6 | Extract from File6 | Pinecone Vector Store7 | Default Data Loader6 | Recursive Character Text Splitter2 |
| ITI-66 | Download file7 | Extract from File7 | Pinecone Vector Store8 | Default Data Loader7 | Recursive Character Text Splitter1 |
| ITT-67 | Download file8 | Extract from File8 | Pinecone Vector Store9 | Default Data Loader8 | Recursive Character Text Splitter |

The `ITI-61` update branch must also reconnect `Switch6 → HTTP Request6 → Download file6`; its file-scoped Pinecone deletion node currently exists but is bypassed. Every other curriculum already deletes vectors matching the incoming `file_name` before reinsertion.

Re-indexing is file-scoped and sequential: process one existing PDF through its matching branch, verify the new metadata, then continue. Do not clear an entire index or unrelated namespace.

### Retrieval tools

Set all nine retrieval-mode Pinecone nodes to `topK: 5`. Replace the shared “use this database for all questions” description with a namespace-specific description that permits the tool only for its named curriculum and states that retrieved metadata contains `file_name` and `loc.pageNumber`.

### AI Agent

Keep curriculum duration, internship, co-op, prerequisite, passed-course, and academic-standing guards. Remove the duplicated full 13-curriculum course catalog from the system message and add the confirmed AnswerScope rules near the top. Replace “Output the course breakdown immediately” with “Answer immediately at the scope explicitly requested by the user.”

Enable `Return Intermediate Steps`. The model produces only the answer; it does not generate the displayed evidence block.

### Deterministic evidence assembly

Update `Prepare Chat Log` to inspect only the AI Agent's actual intermediate tool observations. Recursively parse structured observations, collect and deduplicate `file_name` plus `loc.pageNumber`, and append a compact Markdown block:

```text
---
แหล่งข้อมูล:
- <file_name>, หน้า <loc.pageNumber>
```

If the tool observation contains a file name without a page, append `(ไม่พบเลขหน้าใน metadata)`. If no Pinecone tool produced document metadata, append nothing. Store and return the same grounded output so the chat transcript and Firebase chat log remain consistent.

`Return Output` continues returning the `Prepare Chat Log` output string. The web client requires no change.

## Error handling and safety

- Never derive a page number from chunk order.
- Never treat a model-written citation as evidence.
- Preserve a source-less answer when no retrieval metadata exists.
- If binary PDF loading fails, stop that curriculum's re-index, leave other namespaces untouched, and restore the saved workflow version before trying a page-aware extraction fallback.
- Existing credentials, index names, namespaces, webhook paths, memory, Firebase logging, and frontend metadata contracts remain unchanged.

## Validation

1. Static workflow audit: nine binary PDF loaders, nine namespace-specific retrieval descriptions, all retrieval limits equal five, Agent intermediate steps enabled, and evidence extraction present.
2. Ingestion pilot with `ITT-67`: verify Pinecone results include `file_name`, `curriculum`, and `loc.pageNumber` before processing another curriculum.
3. Repeat the metadata check for all remaining curricula one at a time.
4. Short-answer test: a single-fact curriculum question returns no more than four sentences and one evidence block.
5. Scope test: a one-course question does not list other courses; an explicit “all courses” question may return the full list.
6. No-source test: a greeting and a personal-data-only question contain no document evidence.
7. Grounding test: open each cited PDF page and confirm it supports the answer.
8. Regression test: passed-course exclusion, failed-prerequisite blocking, curriculum duration, internship/co-op guards, chat logging, and Markdown display still work.

## Out of scope

- OCR for image-only PDFs.
- A custom expandable citation component in React.
- Changing Pinecone credentials, the shared index, Google Drive folders, or Firebase schema.
