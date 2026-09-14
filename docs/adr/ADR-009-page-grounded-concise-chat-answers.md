# Page-grounded concise chat answers

Status: accepted

The advising chatbot will answer within the user's explicit AnswerScope and will show RetrievalEvidence only for claims that used curriculum documents. Evidence will be derived deterministically from PageGroundedChunk metadata and appended after the answer; the model must not invent document names or page numbers. We chose page-preserving PDF ingestion plus retrieved-metadata extraction over prompt-only citations because prompt-only citations cannot prove which document page was actually retrieved, while a separate custom chat renderer would add unnecessary frontend surface.

## Consequences

- Existing PDF vectors must be replaced file by file so every new chunk retains its PDF page.
- Personal-data-only answers and greetings do not show document evidence.
- If retrieved content has a document name but no page, the chat states that the page is unavailable rather than fabricating one.
- Full course lists remain available only when the user explicitly requests a complete list, table, or detailed enumeration.
