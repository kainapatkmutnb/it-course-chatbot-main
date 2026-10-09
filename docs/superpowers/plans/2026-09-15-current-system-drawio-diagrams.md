# Current-System Draw.io Diagrams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace four architecture diagrams and align README architecture documentation with the application's current runtime behavior.

**Architecture:** Generate four editable Draw.io XML documents from a shared visual vocabulary, export each to an opaque high-resolution PNG with embedded diagram source, and audit README terminology against source evidence. Keep the change documentation-only.

**Tech Stack:** Draw.io `mxGraphModel` XML, PNG with embedded `mxfile` metadata, PowerShell validation, Markdown, Mermaid.

## Global Constraints

- Output only under `diagrams/diagrams2` plus architecture edits in `README.md`.
- Preserve a solid white canvas, Thai-readable typography, and non-overlapping orthogonal connectors.
- Describe Firebase Authentication plus Realtime Database; do not present Firestore as the active store.
- Use exact RTDB paths: `users`, `courses`, `curriculum`, `studyPlans`, `auditLogs`, `chatLogs`, and `chatFeedback`.
- Document 13 rule-catalog variants separately from 9 Pinecone retrieval namespaces.
- Do not modify application code, Firebase rules, n8n workflow, or production data.

---

### Task 1: Build the source-audited Draw.io diagrams

**Files:**
- Modify: `diagrams/diagrams2/context-diagram.drawio`
- Modify: `diagrams/diagrams2/component-diagram.drawio`
- Modify: `diagrams/diagrams2/data-flow-diagram.drawio`
- Modify: `diagrams/diagrams2/sequence-diagram.drawio`

**Interfaces:**
- Consumes: architecture facts in `docs/superpowers/specs/2026-09-15-current-system-drawio-diagrams.md` and the current source files cited there.
- Produces: four valid, editable `mxGraphModel` documents with stable element IDs and shared color/connector conventions.

- [ ] **Step 1: Replace the context diagram XML**

Create a three-zone C4 layout with actors on the left, the browser SPA in the center, and Firebase/n8n/supporting AI services on the right. Route every connector through the whitespace between zones.

- [ ] **Step 2: Replace the component diagram XML**

Create four horizontal layers for shell/routing, features, domain/data access, and external runtime. Include the hybrid precedence `curriculum RTDB > courses RTDB > static master` as one explicit flow.

- [ ] **Step 3: Replace the DFD XML**

Create P1-P5 and D1-D5 exactly as defined in the spec. Show n8n writing `chatLogs` and the browser writing `chatFeedback`; annotate the checked-in rule mismatch without implying successful production writes.

- [ ] **Step 4: Replace the sequence diagram XML**

Create one student-session timeline with four shaded phases and dashed returns. Keep each message at a unique Y coordinate and each participant in a fixed vertical lane.

- [ ] **Step 5: Validate XML structure**

Run:

```powershell
Get-ChildItem diagrams/diagrams2/*.drawio | ForEach-Object { [xml](Get-Content -Raw $_.FullName) | Out-Null; $_.Name }
```

Expected: all four filenames are printed with no XML parse error.

### Task 2: Export embedded-source retina PNGs

**Files:**
- Modify: `diagrams/diagrams2/context-diagram.drawio.png`
- Modify: `diagrams/diagrams2/component-diagram.drawio.png`
- Modify: `diagrams/diagrams2/data-flow-diagram.drawio.png`
- Modify: `diagrams/diagrams2/sequence-diagram.drawio.png`

**Interfaces:**
- Consumes: the four Draw.io XML documents from Task 1.
- Produces: four 3200 px-wide opaque PNGs that Draw.io can reopen and edit.

- [ ] **Step 1: Export each diagram**

Use Draw.io export with PNG format, white background, 3200 px width, border padding, and embedded diagram data enabled.

- [ ] **Step 2: Verify PNG dimensions and embedded source**

Inspect each PNG for width, alpha/background, and the Draw.io `mxfile` metadata chunk. Expected: width 3200, non-transparent white corners, and recoverable embedded XML.

- [ ] **Step 3: Visually inspect all exports**

Open all four PNGs and check titles, Thai glyphs, clipping, node collisions, label collisions, connector crossings, and README-scale readability. Correct the XML and re-export any failed diagram.

### Task 3: Align README architecture documentation

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: final architecture model and the four PNG paths.
- Produces: a concise architecture section whose Mermaid views and prose agree with the Draw.io artifacts.

- [ ] **Step 1: Correct architecture terminology and paths**

Replace active-backend references to Firestore with Realtime Database. Use `studyPlans`, `chatLogs`, and `chatFeedback`; remove invented `study_plans`, `chat_analytics`, and `logFeedback` names.

- [ ] **Step 2: Correct data ownership and AI topology**

State that n8n writes chat logs before returning the answer, the frontend attempts feedback writes, and the checked-in rules currently omit `chatFeedback`. Distinguish 13 catalog variants from 9 Pinecone retrieval namespaces and describe the hybrid course-data precedence.

- [ ] **Step 3: Keep all four image embeds**

Confirm README embeds:

```markdown
![Context Diagram](diagrams/diagrams2/context-diagram.drawio.png)
![Data Flow Diagram](diagrams/diagrams2/data-flow-diagram.drawio.png)
![Component Diagram](diagrams/diagrams2/component-diagram.drawio.png)
![Sequence Diagram](diagrams/diagrams2/sequence-diagram.drawio.png)
```

### Task 4: Final documentation QA

**Files:**
- Verify: `README.md`
- Verify: `diagrams/diagrams2/*`

**Interfaces:**
- Consumes: outputs from Tasks 1-3.
- Produces: validation evidence and a clean documentation diff.

- [ ] **Step 1: Search for stale claims**

Run:

```powershell
rg -n "Firestore|study_plans|chat_analytics|logFeedback" README.md diagrams/diagrams2
```

Expected: no stale positive claim; any occurrence is an explicit correction/rule warning.

- [ ] **Step 2: Check the repository diff**

Run `git diff --check` and inspect `git diff --stat`. Expected: no whitespace error and only the plan, README, and eight requested diagram artifacts changed after the approved spec commit.

- [ ] **Step 3: Run build sanity check**

Run `npm run build`. Expected: Vite production build exits successfully; diagram documentation changes introduce no runtime regression.

- [ ] **Step 4: Commit the completed documentation**

```powershell
git add README.md diagrams/diagrams2 docs/superpowers/plans/2026-09-15-current-system-drawio-diagrams.md
git commit -m "docs: align diagrams with current runtime"
```
