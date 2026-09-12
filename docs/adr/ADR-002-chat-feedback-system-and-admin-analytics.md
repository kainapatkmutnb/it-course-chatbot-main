# ADR 002: Smart Chat Feedback System and Admin Analytics Integration

## Status
Accepted

## Date
2026-09-12

## Context
1. **Chatbot Feedback Frequency & User Experience:**
   In the initial prototype, the chatbot displayed a feedback banner every 3 messages. During real-world testing, users reported that a 3-message interval was too frequent and intrusive during natural multi-step inquiry sessions (e.g. greeting, asking about prerequisite, asking about syllabus, checking GPA requirements). A 5-message interval was selected to better match natural conversation flows while consistently collecting sentiment metrics.
2. **Administrative Visibility & Analytics:**
   Course administrators and instructors require visibility into user satisfaction trends, detailed logs of student feedback, and the ability to export satisfaction data alongside query logs for academic reporting and RAG system refinement.

## Decision
1. **Periodic Message Threshold:**
   - Increase the feedback trigger interval from 3 to 5 messages (`chatFeedbackMsgCount - chatLastFeedbackCount >= 5`).
   - Counter persists per session in `sessionStorage` and triggers only when the chat window is active.
2. **Database Schema & Service Layer:**
   - Feedback records are stored under `/chatFeedback` in Firebase Realtime Database.
   - Enhance `chatLogService` with `getFeedbacks()` to support pagination, filtering, and summary calculation.
3. **Admin Dashboard Integration:**
   - Add a **Satisfaction Rate KPI Card** to the top metrics grid in `ChatAnalyticsDashboard.tsx`, presenting overall positive percentage (👍 + ✨) and total response count.
   - Add a dedicated **"ความพึงพอใจ (Feedback)" tab** with interactive search and role/sentiment filtering.
4. **Excel Export (.xlsx):**
   - Add a dedicated sheet named `ประเมินความพึงพอใจ` to the multi-sheet Excel export, including timestamps, users, ratings, and conversation lengths.

## Consequences
- Less disruption for students during chat interactions.
- Administrators gain direct insights into chatbot helpfulness and student satisfaction trends.
- Fully compatible with guest sessions and authenticated student accounts.
