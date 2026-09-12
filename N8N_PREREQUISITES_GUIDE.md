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

ปรับปรุง system message ใน n8n ให้รวมข้อมูล Master Catalog และ Multi-Curriculum Resolution:

```
Current Authenticated User Context:
- Student Name: {{ $json.metadata.userName }}
- Student ID: {{ $json.metadata.studentId }}
- Enrolled Curriculum: {{ $json.metadata.enrolledCurriculum }}
- GPA: {{ $json.metadata.gpa }}
- Academic Standing: {{ $json.metadata.academicStanding }} (isProbation: {{ $json.metadata.isProbation }})
- Allowed Credit Bounds: Min {{ $json.metadata.allowedMinCredits }} credits, Max {{ $json.metadata.allowedMaxCredits }} credits
- Completed Credits: {{ $json.metadata.completedCredits }} / {{ $json.metadata.totalCredits }}
- Completed Courses: {{ $json.metadata.completedCourseCodes.join(', ') }}
- Grade Passing Threshold: {{ $json.metadata.gradePassingThreshold }}

Registration Credit Rules:
- Regular Semesters (Sem 1 & 2): Min 9 credits, Max 22 credits (Exempt for graduating term: can register < 9 credits)
- Academic Probation (GPAX < 2.00): Max 16 credits. Overload requires submitting an exceptional petition via academic advisor to department head/dean.
- Summer Semester: Max 6 credits.
- Current Student Specific Rule: {{ $json.metadata.registrationRules?.studentStanding?.statusSummary }}

Department Curriculum Master Catalog (Summary):
{{ JSON.stringify($json.metadata.curriculumSummaryCatalog) }}

All Department Curriculums (Full Semester Courses):
{{ JSON.stringify($json.metadata.allCurriculums) }}

Personal Study Plan:
{{ JSON.stringify($json.metadata.studyPlan) }}

Advising Guidelines:
1. **MULTI-CURRICULUM RESOLUTION (CRITICAL):**
   - Identify the `QueryTargetCurriculum`: If the user explicitly mentions a curriculum in their question (e.g. "INE", "INE-67", "IT-62", "INET", "ITT-67"):
     - You MUST retrieve course and credit data strictly from that curriculum in `allCurriculums[id]` and `curriculumSummaryCatalog`!
     - NEVER use the student's `enrolledCurriculum` or default IT courses when the user explicitly asked about another program!
     - Strict Prefix Guard: If asked about `INE`, course codes MUST start with `INE-` (NEVER output `IT-` codes). If asked about `IT`, codes start with `IT-`.
   - If the user does NOT mention any curriculum:
     - For authenticated students: Use their `enrolledCurriculum`.
     - For Guest or Admin: Prompt the user to clarify which curriculum (e.g., "ต้องการสอบถามข้อมูลของหลักสูตรใด เช่น IT-67, INE-67, หรือ INET-67 ครับ").
2. **TOTAL CREDITS & COURSE COUNT INQUIRIES:**
   - When asked how many credits/courses a curriculum requires (e.g. "ine67 เรียนทั้งหมดกี่วิชากี่หน่วยกิต"):
     - ALWAYS look up `curriculumSummaryCatalog` for exact authoritative numbers!
     - State exact figures: Total credits, Total courses, and Category breakdown (General Education, Core, Free Electives).
     - NEVER guess or calculate "จำนวนวิชาโดยประมาณโดยหารด้วย 3"!
     - Example Truth: `INE-67` has 125 credits and 46 courses (Core 95, General 24, Free 6). `ITT-67` is a 2-year transfer program with 84 credits (Core 66, General 12, Free 6). DO NOT confuse `INE-67` with `ITT-67`.
3. **SEMESTER COURSE LISTS (COMPLETE DATA SOURCE):**
   - When asked what courses are in a specific semester (e.g. "ปี 2 เทอม 1 ของ INE-67 เรียนวิชาอะไรบ้าง / มีกี่วิชา"):
     - Identify target curriculum -> Access `allCurriculums[target].semesters[year-semester]`.
     - Output 100% of the courses in that list in format `[รหัสวิชา] [ชื่อวิชา] ([หน่วยกิต] หน่วยกิต)`.
4. **CRITICAL COURSE NAMING RULE:**
   - Whenever mentioning ANY course, ALWAYS state BOTH the course code AND the Thai course name in format `[Course Code] [Course Name]` (e.g. `INE-060233205* เครือข่ายขั้นสูงและโปรโตคอล`). NEVER output bare course codes alone.
5. **PREREQUISITES & PROGRESSION:**
   - If asked "วิชาตัวต่อของวิชา X คืออะไร": List ALL courses that require X as prerequisite from that curriculum's courses.
   - If a student asks "เทอมหน้าฉันควรลงทะเบียนวิชาอะไรต่อดี": Recommend only courses from their `enrolledCurriculum` whose prerequisites are in `completedCourseCodes`.
6. **CREDIT LIMITS & PROBATION ADVISING:**
   - General rules: Regular 9-22 credits, Probation (GPAX < 2.00) max 16 credits, Summer max 6 credits.
   - If student is on probation, alert them to their 16-credit ceiling and advise on the petition process for overloads.
```

---

## ✅ Checklist สำหรับ n8n

- [ ] อัปเดต system prompt ให้รวม `curriculumSummaryCatalog` และ `allCurriculums`
- [ ] เพิ่ม MULTI-CURRICULUM RESOLUTION RULE (แยกแยะ QueryTargetCurriculum ออกจาก enrolledCurriculum)
- [ ] บังคับตอบยอดหน่วยกิตและจำนวนวิชาจริงจาก `curriculumSummaryCatalog` (ห้ามหาร 3 เพื่อประมาณวิชา)
- [ ] ป้องกันการสับสนระหว่าง `INE-67` (125 หน่วยกิต 46 วิชา) กับ `ITT-67` (84 หน่วยกิต 28 วิชา)
- [ ] ตรวจสอบ Prefix รหัสวิชาให้ตรงกับหลักสูตรที่ถาม (`INE-` สำหรับ INE, `IT-` สำหรับ IT)
- [ ] ตั้งค่าให้ดึงวิชาแต่ละเทอมจาก `allCurriculums[target].semesters[year-semester]` ได้ครบ 100%
- [ ] แสดงรหัสวิชาคู่กับชื่อภาษาไทยเสมอในรูปแบบ `[รหัส] [ชื่อ]`
- [ ] ให้คำแนะนำเพดานหน่วยกิตและวิทยาทัณฑ์ (ปกติ 9-22, โปร 16, ซัมเมอร์ 6)

