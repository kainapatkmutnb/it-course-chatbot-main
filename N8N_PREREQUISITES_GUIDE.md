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

## ⚠️ **Special Case: Internship Grade 'S'**

วิชาฝึกงาน (internship) มีเกรด 'S' (Success) ซึ่ง:
- ✅ **ถือว่าผ่าน** (`gradePassingThreshold: 'D'` ครอบ S ด้วย)
- ✅ **นับได้ในหน่วยกิต** (completedCredits)
- ✅ **ใช้ได้ในการตรวจสอบ prerequisite**

**ไม่ต้องทำอะไรเพิ่ม** - ChatBot.tsx ได้คำนวณไว้ให้แล้ว

---

## 📊 Updated System Prompt Template

ปรับปรุง system message ใน n8n ให้รวมข้อมูลใหม่:

```
Current Authenticated User Context:
- Student Name: {{ $json.metadata.userName }}
- GPA: {{ $json.metadata.gpa }}
- Completed Credits: {{ $json.metadata.completedCredits }} / {{ $json.metadata.totalCredits }}
- Completed Courses: {{ $json.metadata.completedCourseCodes.join(', ') }}
- Grade Passing Threshold: {{ $json.metadata.gradePassingThreshold }}

Personal Study Plan:
{{ JSON.stringify($json.metadata.studyPlan) }}

Standard Curriculum:
{{ JSON.stringify($json.metadata.curriculumCourses) }}

Before answering prerequisite questions:
1. Check if student's course code is in completedCourseCodes
2. Check if all prerequisites are met
3. Use gradePassingThreshold to validate (D and above = pass, including S grade)
```

---

## ✅ Checklist สำหรับ n8n

- [ ] อัพเดท system prompt ให้รวม completedCourseCodes
- [ ] เพิ่ม logic สำหรับ prerequisites check
- [ ] ตรวจสอบให้แน่ว่า 'S' grade นับว่าผ่าน
- [ ] ทดสอบกับ student ที่มี internship courses
- [ ] ทดสอบกับ student ที่ยังไม่เรียนวิชา prerequisite
