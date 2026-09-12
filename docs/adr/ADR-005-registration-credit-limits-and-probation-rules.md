# ADR 005: Registration Credit Limits and Academic Probation Rules for Chatbot Advising

## Status
Accepted

## Date
2026-09-12

## Context
1. **Academic Credit Regulation Enforcement:**
   Students frequently inquire with the academic advising chatbot regarding the allowable credit registration boundaries per semester. University policies stipulate specific bounds:
   - **Regular Semester (Semester 1 & 2):** Minimum 9 credits, Maximum 22 credits.
   - **Graduation Term Exception:** Students in their expected final semester prior to graduation may register for fewer than 9 credits without special penalty.
   - **Academic Probation (ติดวิทยาทัณฑ์ / ติดโปร):** Triggered when cumulative GPA drops below 2.00. Registration is capped at a maximum of 16 credits. Overloading beyond 16 credits requires an exceptional petition approved by the advisor and department head/dean.
   - **Summer Session (ภาคเรียนฤดูร้อน):** Maximum 6 credits.
2. **Context Deficit in Conversational AI:**
   Without dynamic injection of registration policies and individual student standing into the chatbot session metadata, the AI agent in n8n either answers with generic, outdated numbers or fails to alert students who are on academic probation that their cap is restricted to 16 credits.

## Decision
1. **Dynamic Academic Standing Computation (`ChatBot.tsx`):**
   - In `src/components/chat/ChatBot.tsx`, extract the student's cumulative GPA from `useStudentGPAAndCredits`.
   - Calculate personalized probation flags:
     - `isProbation = userGpa > 0 && userGpa < 2.00`
     - `academicStanding = userGpa === 0 ? 'unknown' : (userGpa < 2.00 ? 'probation' : 'normal')`
     - `allowedMaxCredits = isProbation ? 16 : 22`
     - `allowedMinCredits = 9`
2. **Comprehensive Metadata Structure for n8n Webhook:**
   - Attach a standardized `registrationRules` payload to the n8n chat metadata:
     - `regularSemester`: `{ min: 9, max: 22, exception: "..." }`
     - `probation`: `{ max: 16, condition: "GPAX < 2.00", petitionRequirement: "..." }`
     - `summerSemester`: `{ max: 6 }`
     - `studentStanding`: Personal credit limit profile computed for the authenticated student.
3. **Proactive Academic Advising Guidelines:**
   - Formulate explicit system prompt instructions in `N8N_PREREQUISITES_GUIDE.md` directing the AI to:
     - Differentiate general policy answers from personalized student assessments.
     - Proactively alert probation students about their 16-credit ceiling and detail the petition procedure if an overload is necessary for graduation.
     - Clarify the graduating semester waiver when students ask about taking fewer than 9 credits.

## Consequences
- The chatbot possesses authoritative, up-to-date knowledge of credit limits for regular, probation, and summer sessions.
- Authenticated students receive immediate, personalized validation of their allowable credit load based on their live GPA from Firebase.
- Provides a clear architectural reference for extending credit limit validation to the frontend `StudyPlanManager` in subsequent iterations.
