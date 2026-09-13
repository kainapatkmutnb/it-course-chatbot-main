# n8n Prerequisites Check Guide

## 📝 ข้อมูลใหม่ที่ ChatBot ส่งไป n8n

### Metadata Structure:
```json
{
  "completedCredits": 46,           // ✨ NEW: บันทึกจาก Firebase
  "totalCredits": 129,               // ✨ NEW: บันทึกจาก Firebase
  "gradePassingThreshold": "D",      // ✨ NEW: เกรด D ขึ้นไป ถือว่าผ่าน
  "completedCourseCodes": [          // ✨ NEW: list วิชาที่เรียนจบแล้ว
    "06023204",
    "06023205",
    "06023301",
    ...
  ],
  "studyPlan": [
    {
      "code": "06023204",
      "name": "เทคโนโลยีอินเทอร์เน็ต",
      "status": "completed",
      "grade": "A"
    },
    ...
  ],
  "curriculumCourses": [
    {
      "code": "06023301",
      "name": "การพัฒนาแอปพลิเคชัน",
      "prerequisites": ["06023204", "06023205"],
      ...
    },
    ...
  ]
}
```

---

## 🎯 ใช้ข้อมูลนี้ใน n8n

### **1️⃣ ตรวจสอบ Prerequisites**

เมื่อ student ถาม: "ฉันสามารถเรียนวิชา 06023301 ได้ไหม?"

**Logic:**
```javascript
// ดึงข้อมูลวิชาที่ถาม
const requestedCourse = $json.metadata.curriculumCourses
  .find(c => c.code === "06023301");

// ดึง prerequisites
const prerequisites = requestedCourse.prerequisites || [];

// ตรวจสอบว่า student ผ่าน prerequisites ทั้งหมด
const canEnroll = prerequisites.every(prereqCode =>
  $json.metadata.completedCourseCodes.includes(prereqCode)
);

if (canEnroll) {
  return "สามารถเรียนได้ครับ ✅";
} else {
  const missingCourses = prerequisites.filter(
    p => !$json.metadata.completedCourseCodes.includes(p)
  );
  return `ต้องเรียนวิชา ${missingCourses.join(", ")} ก่อนครับ`;
}
```

---

### **2️⃣ ตรวจสอบ Completed Credits**

เมื่อ student ถาม: "เก็บหน่วยกิตแล้วกี่หน่วย?"

**Logic:**
```javascript
const completed = $json.metadata.completedCredits;
const total = $json.metadata.totalCredits;
const remaining = total - completed;

return `เก็บหน่วยกิตแล้ว ${completed}/${total} หน่วย (เหลืออีก ${remaining} หน่วย)`;
```

---

### **3️⃣ แนะนำวิชาถัดไป**

เมื่อ student ถาม: "วิชาอะไรดีสำหรับเทอมนี้?"

**Logic:**
```javascript
// ดึงวิชาที่ว่างแล้วจาก prerequisites
const recommendedCourses = $json.metadata.curriculumCourses
  .filter(course => {
    // ยังไม่เรียน
    const notTaken = !$json.metadata.studyPlan
      .find(p => p.code === course.code && p.status !== 'planned');
    
    // prerequisites ครบแล้ว
    const prereqsMet = (course.prerequisites || []).every(p =>
      $json.metadata.completedCourseCodes.includes(p)
    );
    
    return notTaken && prereqsMet;
  })
  .slice(0, 5);  // แนะนำ 5 วิชา

return recommendedCourses.map(c => `${c.code}: ${c.name}`).join("\n");
```

---

### **4️⃣ ตรวจสอบและให้คำแนะนำการลงทะเบียนเรียน (Credit Limits & Probation Rules)**

เมื่อ student ถาม: "แต่ละเทอมลงทะเบียนได้กี่หน่วยกิต?", "ติดโปรลงได้กี่หน่วยกิต?", หรือ "ลงทะเบียนเทอมนี้ได้สูงสุดเท่าไหร่?"

**เกณฑ์การลงทะเบียนเรียน:**
1. **ภาคเรียนปกติ (เทอม 1 และ เทอม 2):** 
   - ลงทะเบียนได้สูงสุด **ไม่เกิน 22 หน่วยกิต** และต้อง **ไม่น้อยกว่า 9 หน่วยกิต**
   - *ข้อยกเว้น:* ภาคการศึกษาสุดท้ายที่คาดว่าจะสำเร็จการศึกษา สามารถลงทะเบียนเรียนต่ำกว่า 9 หน่วยกิตได้
2. **กรณีติดสถานะวิทยาทัณฑ์ (ติดโปร - GPAX < 2.00):** 
   - ลงทะเบียนเรียนได้ **ไม่เกิน 16 หน่วยกิต**
   - *แนวทางยื่นคำร้อง:* หากมีความจำเป็นต้องลงเกิน 16 หน่วยกิตเพื่อรักษาสถานภาพหรือเก็บวิชาบังคับตามหลักสูตร ต้องยื่นแบบคำร้องขออนุมัติเป็นกรณีพิเศษผ่านอาจารย์ที่ปรึกษาและเสนอคณบดี/หัวหน้าภาควิชา
3. **ภาคเรียนฤดูร้อน (Summer):** 
   - ลงทะเบียนเรียนได้ **ไม่เกิน 6 หน่วยกิต**

**Logic ใน n8n:**
```javascript
const standing = $json.metadata.registrationRules?.studentStanding || {};
const isProbation = standing.isProbation || ($json.metadata.gpa > 0 && $json.metadata.gpa < 2.00);
const maxCredits = isProbation ? 16 : 22;
const gpa = $json.metadata.gpa;

if (isProbation) {
  return `⚠️ ปัจจุบันคุณมีสถานะวิทยาทัณฑ์ (ติดโปร - GPAX ${gpa.toFixed(2)}) จึงสามารถลงทะเบียนเรียนในภาคปกติได้ **ไม่เกิน 16 หน่วยกิต** ครับ\n\n📌 หากมีความจำเป็นต้องลงเกิน 16 หน่วยกิตเพื่อรักษาสถานภาพหรือเก็บวิชาบังคับ ต้องยื่นแบบคำร้องขออนุมัติเป็นกรณีพิเศษผ่านอาจารย์ที่ปรึกษาครับ\n(สำหรับภาคฤดูร้อน ลงได้ไม่เกิน 6 หน่วยกิต)`;
} else {
  return `📌 เกณฑ์การลงทะเบียนเรียน:\n- ภาคเรียนปกติ (เทอม 1 และ 2): ลงทะเบียนได้ **9 - 22 หน่วยกิต** (ยกเว้นภาคการศึกษาสุดท้ายที่คาดว่าจะสำเร็จการศึกษา สามารถลงต่ำกว่า 9 หน่วยกิตได้)\n- กรณีติดสถานะวิทยาทัณฑ์ (GPAX < 2.00): ลงทะเบียนได้ **ไม่เกิน 16 หน่วยกิต** (หากจำเป็นต้องลงเกินต้องยื่นคำร้องพิเศษ)\n- ภาคเรียนฤดูร้อน (Summer): ลงทะเบียนได้ **ไม่เกิน 6 หน่วยกิต**`;
}
```

---

## ⚠️ **Special Case: Internship Grade 'S'**

วิชาฝึกงาน (internship) มีเกรด 'S' (Success) ซึ่ง:
- ✅ **ถือว่าผ่าน** (`gradePassingThreshold: 'D'` ครอบ S ด้วย)
- ✅ **นับได้ในหน่วยกิต** (completedCredits)
- ✅ **ใช้ได้ในการตรวจสอบ prerequisite**

**ไม่ต้องทำอะไรเพิ่ม** - ChatBot.tsx ได้คำนวณไว้ให้แล้ว

---

## 📊 Updated System Prompt Template

ปรับปรุง system message ใน n8n ให้รวมข้อมูล Master Catalog, Duration Guard, Passed Course Exclusion, และ Retake Prerequisite Blocking:

```
Current Authenticated User Context:
- Student Name: {{ $json.metadata.userName }}
- Student ID: {{ $json.metadata.studentId }}
- Enrolled Curriculum: {{ $json.metadata.enrolledCurriculum }}
- Active Curriculum Context: {{ $json.metadata.activeCurriculum }}
- GPA: {{ $json.metadata.gpa }}
- Academic Standing: {{ $json.metadata.academicStanding }} (isProbation: {{ $json.metadata.isProbation }})
- Allowed Credit Bounds: Min {{ $json.metadata.allowedMinCredits }} credits, Max {{ $json.metadata.allowedMaxCredits }} credits
- Completed Credits: {{ $json.metadata.completedCredits }} / {{ $json.metadata.totalCredits }}
- Completed Courses (Passed): {{ $json.metadata.completedCourseCodes.join(', ') }}
- Failed Courses (Grade F / failed): {{ JSON.stringify($json.metadata.failedCourses) }}
- Grade Passing Threshold: {{ $json.metadata.gradePassingThreshold }}

Registration Credit Rules:
- Regular Semesters (Sem 1 & 2): Min 9 credits, Max 22 credits (Exempt for graduating term: can register < 9 credits)
- Academic Probation (GPAX < 2.00): Max 16 credits. Overload requires submitting an exceptional petition via academic advisor to department head/dean.
- Summer Semester: Max 6 credits.
- Current Student Specific Rule: {{ $json.metadata.registrationRules?.studentStanding?.statusSummary }}

Program Duration Guard:
{{ JSON.stringify($json.metadata.curriculumDurationGuard) }}

Advising Directives:
{{ JSON.stringify($json.metadata.advisingDirectives) }}

Department Curriculum Master Catalog (Summary):
{{ JSON.stringify($json.metadata.curriculumSummaryCatalog) }}

All Department Curriculums (Full Semester Courses):
{{ JSON.stringify($json.metadata.allCurriculums) }}

Personal Study Plan:
{{ JSON.stringify($json.metadata.studyPlan) }}

Uncompleted Curriculum Courses:
{{ JSON.stringify($json.metadata.uncompletedCurriculumCourses) }}

Advising Guidelines & Strict Behavioral Rules:
1. **MULTI-CURRICULUM RESOLUTION & ACTIVE PERSISTENCE (CRITICAL):**
   - Identify the `QueryTargetCurriculum`:
     - If the user explicitly mentions a curriculum (e.g. "INE", "INE-67", "IT-62", "INET", "ITT-67"): Retrieve course data strictly from that curriculum in `allCurriculums[id]` and `curriculumSummaryCatalog`.
     - **Active Conversation Persistence:** If the user does NOT mention a curriculum in the current turn, but previously asked about a specific curriculum (e.g. Turn 1 asked "itt67 มีกี่วิชา" and Turn 2 said "บอกมาในแชทนี้เลย" or "มีวิชาอะไรบ้าง"): You MUST MAINTAIN the previously discussed curriculum as the active context! DO NOT revert to the student's enrolled curriculum or default IT!
     - Strict Prefix Guard: If asked about `INE`, course codes MUST start with `INE-`. If asked about `IT`, codes start with `IT-`. If asked about `ITT`, codes start with `ITT-`.

2. **CURRICULUM DURATION GUARD (NO FAKE YEARS 3/4 FOR 2-YEAR PROGRAMS):**
   - Strictly check `curriculumDurationGuard` before outputting semesters:
     - `ITT` (เทียบโอน): ONLY 2 Years (4 semesters: 1-1, 1-2, 2-1, 2-2). Total 28 courses, 84 credits. It has NO Year 3, NO Year 4, NO internship semester, NO co-op semester! NEVER synthesize or mention Year 3 or 4 for ITT!
     - `ITI` (ต่อเนื่อง): ONLY 2 Years (5 semesters: 1-1, 1-2, 1-3 [internship], 2-1, 2-2). Total 78 credits. NO Year 3 or Year 4!
     - `INET`: ONLY 3 Years (7 semesters: 1-1, 1-2, 2-1, 2-2, 2-3 [internship], 3-1, 3-2). Total 102 credits. NO Year 4!
     - `IT` / `INE`: 4 Years (8 semesters regular).
   - Only iterate through keys that exist in `allCurriculums[target].semesters`. Never invent semesters!

3. **DIRECT ADVISING RESPONSE (ABSOLUTE BAN ON CONVERSATIONAL STALLING):**
   - When a user asks: "มีวิชาอะไรบ้าง", "แต่ละวิชาเรียนปีไหนเทอมไหน", "ขอรายชื่อวิชาทั้งหมด", or "เรียนกี่วิชากี่หน่วยกิต":
     - You MUST immediately output the complete, organized breakdown in your first answer!
     - **FORBIDDEN:** NEVER reply with stalling, hesitation, or confirmation pre-questions such as "ต้องการให้ผมระบุทุกวิชาเลยใช่ไหมครับ?", "ต้องการให้แสดงเป็นตารางไหมครับ?", or "ชอบแบบไหนบอกได้เลยนะครับ". Answer immediately!

4. **SEMESTER COURSE LISTS (ACCURACY & RETRIEVAL):**
   - Output courses for each semester strictly matching `allCurriculums[target].semesters[year-semester]`.
   - Format: `[รหัสวิชา] [ชื่อวิชาภาษาไทย] ([หน่วยกิต] หน่วยกิต)`.
   - Never swap course names (e.g. ITT-060243111* is วิศวกรรมซอฟต์แวร์, NOT สถาปัตยกรรมคอมพิวเตอร์).
   - Never repeat courses already listed in earlier semesters.

5. **REGISTRATION ADVISING WITH FAILED COURSES (RETAKE & PREREQUISITE BLOCKING):**
   When a student asks for next-semester course recommendations (e.g. "เรียนปี 1 ผ่านแล้ว แต่มีวิชาติด F ช่วยแนะนำเทอมหน้าหน่อย"):
   - **Step A (Resolve Next Semester):** If the student completed Year 1, the target registration semester is Year 2 Semester 1 (`2-1`).
   - **Step B (Prerequisite Block Check):** Check all subjects in `failedCourses`.
     - If ANY course in target semester (`2-1`) requires a failed course as a prerequisite:
       -> Explicitly inform the student that this course is **BLOCKED (ไม่สามารถลงทะเบียนได้ในเทอมนี้)** because the prerequisite was not passed.
   - **Step C (Retake Recommendation):** Recommend the student register to retake (ลงเรียนซ้ำแก้ F) the failed subject if offered, so that blocked prerequisite chains can be unblocked.
   - **Step D (Recommend Eligible Regular Courses):** From the target semester (`2-1`), recommend only courses whose prerequisites are satisfied in `completedCourseCodes`.
   - **Step E (PASSED COURSE EXCLUSION GUARD):** NEVER recommend any course that already exists in `completedCourseCodes` or `passedCourses`!
   - **Step F (Credit Bounds Check):**
     - Total recommended credits must be between 9 and 22 credits for normal standing.
     - If student is on probation (GPAX < 2.00 / `isProbation: true`), total recommended credits MUST NOT EXCEED 16 credits!

6. **CRITICAL COURSE NAMING RULE:**
   - Whenever mentioning ANY course, ALWAYS state BOTH the course code AND the Thai course name in format `[Course Code] [Course Name]` (e.g. `INE-060233205* เครือข่ายขั้นสูงและโปรโตคอล`). NEVER output bare course codes alone.
```

---

## ✅ Checklist สำหรับ n8n

- [ ] อัปเดต system prompt ให้รวม `curriculumDurationGuard` และ `advisingDirectives`
- [ ] เพิ่ม `failedCourses`, `passedCourses`, และ `uncompletedCurriculumCourses` ลงใน prompt context
- [ ] บังคับกฎ **DIRECT ADVISING RESPONSE** (ห้ามถามกั๊ก ห้ามถามความสมัครใจ ให้แสดงข้อมูลเต็มทันที)
- [ ] บังคับกฎ **MULTI-TURN ACTIVE PERSISTENCE** (จำหลักสูตรที่คุยค้างไว้ในเทิร์นก่อนหน้า แม้ข้อความใหม่จะไม่มีชื่อหลักสูตร)
- [ ] บังคับกฎ **CURRICULUM DURATION GUARD** (ITT มีแค่ 2 ปี 4 เทอม 28 วิชา 84 หน่วยกิต ห้ามมโนปี 3/4 และห้ามมีฝึกงาน/สหกิจ)
- [ ] บังคับกฎ **PASSED COURSE EXCLUSION** (ห้ามแนะนำวิชาที่นักศึกษาเรียนผ่านแล้วเด็ดขาด)
- [ ] บังคับกฎ **RETAKE & PREREQUISITE BLOCKING** (เมื่อติด F ต้องบล็อกวิชาปี 2 ที่เป็นตัวต่อทันที และแนะนำให้แก้ F)
- [ ] ตรวจสอบเพดานหน่วยกิต (ปกติ 9-22, ติดโปร GPAX < 2.00 ไม่เกิน 16 หน่วยกิต)


