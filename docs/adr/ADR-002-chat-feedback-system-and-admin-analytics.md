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
2. **Standard 3-Level Rating Scale & Order:**
   - Standardize rating scale to 3 sequential levels: `dislike` (👎 ไม่ชอบ) ➔ `neutral` (😐 ปานกลาง) ➔ `like` (👍 ชอบ).
   - Maintain uniform sorting (Negative ➔ Neutral ➔ Positive) across user chatbot banners, filter selectors, summary badges, and exported reports.
3. **Database Schema & Service Layer:**
   - Feedback records are stored under `/chatFeedback` in Firebase Realtime Database.
   - Enhance `chatLogService` with `getFeedbacks()` to support pagination, filtering, and summary calculation (`dislikeCount`, `neutralCount`, `likeCount`, `satisfactionRate`).
4. **Admin Dashboard Integration & Dynamic Visual Hierarchy:**
   - Add a **Satisfaction Rate KPI Card** to the top metrics grid in `ChatAnalyticsDashboard.tsx`.
   - Apply dynamic color coding based on threshold:
     - $\ge 80\%$: Emerald Green (`text-emerald-600`)
     - $50\% - 79\%$: Amber Yellow (`text-amber-600`)
     - $< 50\%$: Rose Red (`text-rose-600`)
   - Add a dedicated **"ความพึงพอใจ (Feedback)" tab** with interactive search and role/sentiment filtering.
5. **Excel Export (.xlsx):**
   - Add a dedicated sheet named `ประเมินความพึงพอใจ` to the multi-sheet Excel export, including timestamps, users, ratings, and conversation lengths.

## Consequences
- Less disruption for students during chat interactions.
- Clear visual hierarchy where high satisfaction scores display in positive green rather than alarming red.
- Administrators gain direct insights into chatbot helpfulness and student satisfaction trends.
- Fully compatible with guest sessions and authenticated student accounts.
