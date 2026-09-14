# Page-grounded concise chatbot implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the live n8n chatbot so each of its nine curriculum tools answers only the requested scope, stays concise by default, and cites the actual source PDF page returned by retrieval.

**Architecture:** Make the live n8n workflow the source of truth. Preserve page metadata by loading Google Drive PDF binary directly into each Pinecone insert path, then set each curriculum's source identity. Keep answer prose in the AI Agent and append citations deterministically in `Prepare Chat Log` from the Agent's actual tool observations. Re-index and validate curriculum files one at a time.

**Tech Stack:** n8n 1.x workflow editor, Google Drive, LangChain Default Data Loader and Recursive Character Text Splitter, Pinecone, OpenAI Chat Model, JavaScript Code node, Firebase chat log, `@n8n/chat` Markdown output.

## Global Constraints

- Ordinary answers: at most 2–4 short sentences or three bullets.
- Expand to a full course list/table only when the user explicitly asks for all courses, details, enumeration, or a table.
- Cite only document metadata returned by an invoked Pinecone tool; never infer or invent page numbers.
- Missing page metadata is shown as unavailable; no citation is added when no document was retrieved.
- Preserve curriculum guards, prerequisites, passed-course exclusion, academic-standing rules, webhook, memory, Firebase logging, credentials, namespaces, and chat output contract.
- Re-index one PDF at a time through its matching file-scoped deletion branch; never clear a whole shared index or unrelated namespace.
- Before each destructive Pinecone deletion action, request confirmation at the point of action.

---

### Task 1: Set the Agent's answer scope and retrieval tools

**Files:**
- Modify: live workflow `IT-Chatbot 4 copy` in the open n8n tab

**Interfaces:**
- Consumes: chat input, existing student metadata, and existing curriculum guardrails.
- Produces: concise answer text plus real Agent intermediate tool observations.

- [x] Update the AI Agent system message: preserve non-verbosity guardrails, remove the duplicated all-13-course catalog, set the confirmed short-answer policy, and replace the forced full-course breakdown instruction with explicit user-scope behavior.
- [x] Enable `Return Intermediate Steps` in the AI Agent options.
- [x] Set retrieval limit `topK` to `5` on each tool: `INE-62`, `INE-67`, `INET-62`, `INET-67`, `IT-62`, `IT-67`, `ITI-61`, `ITI-66`, `ITT-67`.
- [x] Give every Pinecone tool a description scoped to its own curriculum and request source metadata `file_name` and `loc.pageNumber` from retrieved matches.
- [x] Save the workflow draft and confirm all nine retrieval tools and Agent settings are visibly persisted.

### Task 2: Preserve page metadata in each curriculum ingestion branch

**Files:**
- Modify: nine Google Drive → Extract From File → Pinecone insertion branches in the live workflow.

**Interfaces:**
- Consumes: the PDF binary from the matching Google Drive Download node and its file name from the matching Edit Fields node.
- Produces: Pinecone chunks in the matching curriculum namespace with `file_name`, `curriculum`, and PDF `loc.pageNumber` metadata.

- [ ] For each curriculum row below, connect its Download node directly to its insertion-mode Pinecone Vector Store node and remove the Extract From File node from that path.
- [ ] Configure its Default Data Loader to load the input as binary PDF data, load all input data, and retain its existing custom Recursive Character Text Splitter connection and chunk settings.
- [ ] Keep the matching `file_name` expression and add the literal namespace as `curriculum` metadata.
- [ ] Fix the `ITI-61` file-update route to pass through `HTTP Request6` before `Download file6`, so it deletes only existing vectors for the same file before reinsertion.
- [ ] For every other curriculum, verify that its current file-scoped deletion node remains on the route before Download.

| Curriculum | Delete node | Download node | Bypassed PDF extractor | Insert store | Data loader | Splitter |
| --- | --- | --- | --- | --- | --- | --- |
| INE-62 | HTTP Request | Download file | Extract from File | Pinecone Vector Store | Default Data Loader | Recursive Character Text Splitter8 |
| INE-67 | HTTP Request1 | Download file1 | Extract from File1 | Pinecone Vector Store2 | Default Data Loader1 | Recursive Character Text Splitter7 |
| INET-62 | HTTP Request2 | Download file2 | Extract from File2 | Pinecone Vector Store3 | Default Data Loader2 | Recursive Character Text Splitter6 |
| INET-67 | HTTP Request3 | Download file3 | Extract from File3 | Pinecone Vector Store4 | Default Data Loader3 | Recursive Character Text Splitter5 |
| IT-62 | HTTP Request4 | Download file4 | Extract from File4 | Pinecone Vector Store5 | Default Data Loader4 | Recursive Character Text Splitter4 |
| IT-67 | HTTP Request5 | Download file5 | Extract from File5 | Pinecone Vector Store6 | Default Data Loader5 | Recursive Character Text Splitter3 |
| ITI-61 | HTTP Request6 | Download file6 | Extract from File6 | Pinecone Vector Store7 | Default Data Loader6 | Recursive Character Text Splitter2 |
| ITI-66 | HTTP Request7 | Download file7 | Extract from File7 | Pinecone Vector Store8 | Default Data Loader7 | Recursive Character Text Splitter1 |
| ITT-67 | HTTP Request8 | Download file8 | Extract from File8 | Pinecone Vector Store9 | Default Data Loader8 | Recursive Character Text Splitter |

### Task 3: Attach citations from actual retrieved metadata

**Files:**
- Modify: live workflow `Prepare Chat Log` Code node.
- Verify: live workflow `Return Output` Code node.

**Interfaces:**
- Consumes: AI Agent `output` and `intermediateSteps`.
- Produces: one Markdown `output` string shared by the chat response and the Firebase log.

- [x] Read observations from `$json.intermediateSteps` only; recursively handle objects, arrays, and JSON-encoded strings.
- [x] Extract `file_name` or `source` and `loc.pageNumber` (also accept top-level `pageNumber`/`page_number`), deduplicate by file and page, and ignore observations without a source identity.
- [x] Append `แหล่งข้อมูล: <file_name>, หน้า <page>` for each grounded source; if the page is absent, append `แหล่งข้อมูล: <file_name>`.
- [x] Append no citation for greetings, personal-metadata-only answers, or Agent runs with no retrieved document metadata.
- [x] Assign the grounded value to the existing `response` and `output` fields. Keep `Return Output` returning that output string.

### Task 4: Pilot, re-index, and verify all curricula

**Files:**
- Verify: all nine namespace paths and the live chatbot response.

**Interfaces:**
- Consumes: each source PDF from its existing Google Drive trigger/manual upload path.
- Produces: page-grounded retrieval evidence for every curriculum namespace.

- [x] Run INE-62 live pilot test: verified concise answer, direct scoping, and Pinecone source citation `• INE-62.pdf`.
- [ ] Run the `ITT-67` ingestion pilot only after confirming the file-specific Pinecone delete body targets namespace `ITT-67` and the selected PDF's exact `file_name`.
- [ ] At the delete request, pause for action-time confirmation. On confirmation, execute only this file-scoped deletion, then continue the matching upload branch.
- [ ] Inspect the Pinecone insert execution input/output and confirm chunks retain `file_name`, `curriculum: ITT-67`, and `loc.pageNumber` before proceeding.
- [ ] Repeat that exact file-scoped sequence for each remaining curriculum, one at a time, checking namespace and file name before each delete.
- [ ] Test a one-fact curriculum question, a one-course question, an explicit all-courses request, a greeting, and a personal-metadata-only question.
- [ ] Open the cited PDF page and verify that it supports the answer; verify that no source is shown when no retrieval tool ran.
- [ ] Run the existing workflow checks for prerequisite blocks, passed-course exclusion, duration/internship/co-op guardrails, Firebase logging, and chat Markdown display.

