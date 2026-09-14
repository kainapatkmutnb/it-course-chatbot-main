<div align="center">

# 🎓 IT Assistant
### ผู้ช่วยวางแผนการเรียนและสืบค้นข้อมูลหลักสูตรอัจฉริยะ
**ภาควิชาเทคโนโลยีสารสนเทศ · คณะเทคโนโลยีและการจัดการอุตสาหกรรม**  
**มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (KMUTNB)**

<br />

[![React](https://img.shields.io/badge/React_18.3-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite_5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_3.4-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)](https://tailwindcss.com)
[![Firebase](https://img.shields.io/badge/Firebase_RTDB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![n8n](https://img.shields.io/badge/n8n_Workflow-EA4B71?style=for-the-badge&logo=n8n&logoColor=white)](https://n8n.io)
[![Quality](https://img.shields.io/badge/Audit_Pass_Rate-100%25-059669?style=for-the-badge&logo=checkmarx&logoColor=white)](docs/audits/firebase-crud-credit-audit.md)

<br />

| 🏛️ **5 สาขาวิชาที่รองรับ** | 📚 **13 ฉบับหลักสูตรรับรอง** | 🎯 **100% Deterministic RAG** |
| :---: | :---: | :---: |
| **IT • INE • INET • ITI • ITT**<br />ครอบคลุมทั้งภาควิชาไอที มจพ. | **4 ปี • สหกิจ • ต่อเนื่อง • เทียบโอน**<br />ฐานข้อมูล `CurriculumMasterCatalog` | **Zero Hallucination**<br />ผสาน Pinecone Vector + GPT-5 nano |

<br />

[`📖 ภาพรวม`](#ภาพรวมระบบ) • [`🏗️ สถาปัตยกรรม`](#สถาปัตยกรรมระบบ) • [`🗺️ ขอบเขตหลักสูตร`](#ขอบเขตหลักสูตรที่รองรับ) • [`✨ ฟีเจอร์เด่น`](#ฟีเจอร์เด่น-bento-grid) • [`👥 บทบาทผู้ใช้`](#บทบาทและสิทธิ์ผู้ใช้งาน) • [`⚡ การติดตั้ง`](#การติดตั้งและเริ่มใช้งาน) • [`📜 วิศวกรรม & ADR`](#มาตรฐานวิศวกรรมและการตัดสินใจ-adr) • [`🛡️ ความปลอดภัย`](#ความปลอดภัยและการปกป้องข้อมูล)

</div>

---

## ภาพรวมระบบ

**IT Assistant** เป็นเว็บแพลตฟอร์มสำหรับบริหารจัดการการศึกษา วางแผนการเรียน 4 ปี และตรวจสอบเงื่อนไขหลักสูตรแบบเรียลไทม์ ออกแบบเฉพาะสำหรับนักศึกษา อาจารย์ที่ปรึกษา และบุคลากร ภาควิชาเทคโนโลยีสารสนเทศ มจพ. ปราศจากปัญหาข้อความกำกวมด้วยการผสานเทคโนโลยี **AI Advising Assistant** ผ่าน n8n Workflow และ Pinecone Vector Database เพื่อให้คำปรึกษาหลักสูตรที่ถูกต้อง แม่นยำ และสอดคล้องกับระเบียบมหาวิทยาลัย 100%

ตัวระบบถูกสร้างขึ้นบนรากฐานภาษาโมเดลโดเมน [CONTEXT.md](CONTEXT.md) ตามมาตรฐานวิศวกรรมซอฟต์แวร์ ควบคุมการทำงานด้วยระเบียบหน่วยกิตและภาวะวิทยาทัณฑ์ (Academic Standing Rules) พร้อมอินเทอร์เฟซระดับพรีเมียมโทนสีกรมท่า น้ำเงิน และขาว (KMUTNB Institutional Palette) ใช้งานได้อย่างลื่นไหลบนทุกขนาดหน้าจอ

<div align="center">

<img src="public/images/academic-course-preview.webp" alt="ตัวอย่างหน้าจอสำรวจและค้นหาข้อมูลหลักสูตร IT Assistant" width="90%" style="border-radius: 12px; border: 1px solid rgba(11, 22, 55, 0.12); box-shadow: 0 8px 24px rgba(11, 22, 55, 0.12);" />

*ตัวอย่างหน้าจอสำรวจและค้นหารายวิชาในหลักสูตร (Curriculum Catalog) แสดงผลข้อมูลจริงพร้อมฟอนต์ภาษาไทยคมชัด*

</div>

---

## สถาปัตยกรรมระบบ

ระบบใช้สถาปัตยกรรมแบบแยกส่วน (Decoupled Architecture) และนำเสนอแผนภาพตามข้อกำหนด **[ADR-007](docs/adr/ADR-007-theme-adaptive-architectural-diagram-standards.md)** รองรับการแสดงผลทั้ง **GitHub Dark Mode** และ **Light Mode** อย่างสมบูรณ์ คมชัดระดับ Vector

### แผนภาพบริบทภาพรวมระบบ (System Context Diagram)

แผนภาพแสดงสถาปัตยกรรม 3 ระดับ (Structured Tiered Flow) แบ่งแยกความรับผิดชอบชัดเจนระหว่างกลุ่มผู้ใช้งาน, แอปพลิเคชันหลัก และบริการภายนอก:

```mermaid
flowchart LR
    %% High-Contrast Theme Palette
    classDef actor fill:#0C4A6E,stroke:#38BDF8,stroke-width:2px,color:#F0F9FF;
    classDef system fill:#0F172A,stroke:#0284C7,stroke-width:2.5px,color:#F8FAFC;
    classDef external fill:#78350F,stroke:#FBBF24,stroke-width:2px,color:#FEF3C7;

    subgraph Actors ["👥 ผู้ใช้งานระบบ (Stakeholders)"]
        direction TB
        Student(["🎓 นักศึกษา (Students)<br/>• แผนการเรียน & ผลการเรียน<br/>• ปรึกษาแชทบอทหลักสูตร"]):::actor
        Instructor(["👨‍🏫 อาจารย์ที่ปรึกษา (Instructors)<br/>• ติดตามแผนการเรียนนักศึกษา<br/>• ให้คำปรึกษาการลงทะเบียน"]):::actor
        Staff(["🏢 บุคลากร (Staff)<br/>• จัดการข้อมูลหลักสูตร & วิชา<br/>• กำหนดเงื่อนไขหลักสูตร"]):::actor
        Admin(["⚙️ ผู้ดูแลระบบ (Admins)<br/>• บริหารจัดการผู้ใช้และสิทธิ์<br/>• สถิติแชทบอท Analytics"]):::actor
    end

    subgraph Core ["💻 ระบบหลัก (Core Application)"]
        WebApp["🌐 IT Assistant Web Platform<br/>(React 18 + TypeScript + Vite)<br/>━━━━━━━━━━━━━━━━━━━━━<br/>• Academic Rules & Validation Engine<br/>• 4-Year Study Plan Manager<br/>• Modern Academic Chat Surface"]:::system
    end

    subgraph Services ["☁️ บริการภายนอก (External Services)"]
        direction TB
        Firebase(["🔥 Firebase Cloud Infrastructure<br/>• Firebase Authentication (ยืนยันตัวตน)<br/>• Realtime Database (จัดเก็บข้อมูล)"]):::external
        N8N(["🤖 n8n AI Orchestrator<br/>• Pinecone Vector Search (RAG)<br/>• OpenAI GPT-5 nano Reasoning Engine"]):::external
    end

    Student <-->|"ลงทะเบียน / ดูแผนการเรียน / ปรึกษาบอท"| WebApp
    Instructor <-->|"ตรวจสอบแผน / รายงานผลนักศึกษา"| WebApp
    Staff <-->|"จัดการรายวิชา / ซิงค์ข้อมูลหลักสูตร"| WebApp
    Admin <-->|"จัดการผู้ใช้ / วิเคราะห์สถิติระบบ"| WebApp

    WebApp <-->|"ยืนยันตัวตน & ซิงค์ข้อมูล Realtime"| Firebase
    WebApp <-->|"ส่งคำถาม & รับคำตอบ RAG สรุปข้อมูลหลักสูตร"| N8N
```

<details>
<summary>🖼️ <strong>ดูแผนภาพบริบทต้นฉบับ (Draw.io White-Canvas Export)</strong></summary>

<br />

![Context Diagram](diagrams/diagrams2/context-diagram.drawio.png)

</details>

<details>
<summary>🔍 <strong>ดูรายละเอียด Data Flow Diagram (DFD Level-0 / Level-1)</strong></summary>

<br />

แผนภาพแสดงกระบวนการประมวลผล (Processes 1.0 – 5.0) การไหลของข้อมูล และแหล่งจัดเก็บข้อมูล (Data Stores D1 – D5):

```mermaid
flowchart TD
    classDef entity fill:#0C4A6E,stroke:#38BDF8,stroke-width:2px,color:#F0F9FF;
    classDef process fill:#581C87,stroke:#C084FC,stroke-width:2px,color:#FAF5FF;
    classDef store fill:#881337,stroke:#FB7185,stroke-width:2px,color:#FFF1F2;
    classDef external fill:#78350F,stroke:#FBBF24,stroke-width:2px,color:#FEF3C7;

    User(["👤 ผู้ใช้งาน (User)<br/>Student / Advisor / Staff / Admin"]):::entity

    P1(["1.0 การยืนยันตัวตน & จัดการสิทธิ์<br/>(Authentication & RBAC)"]):::process
    P2(["2.0 การจัดการผู้ใช้ & โปรไฟล์<br/>(User & Profile Management)"]):::process
    P3(["3.0 จัดการข้อมูลหลักสูตร & วิชา<br/>(Curriculum & Course Management)"]):::process
    P4(["4.0 แผนการเรียน & ประมวลผลความคืบหน้า<br/>(Dual-View Plan & Progress Engine)"]):::process
    P5(["5.0 การสนทนาแชทบอท & สถิติ<br/>(AI Advising Chatbot & Analytics)"]):::process

    D1[("D1 | ข้อมูลผู้ใช้<br/>users/")]:::store
    D2[("D2 | ข้อมูลรายวิชา<br/>courses/")]:::store
    D3[("D3 | ข้อมูลหลักสูตร<br/>curriculum/")]:::store
    D4[("D4 | แผนการเรียน<br/>study_plans/")]:::store
    D5[("D5 | บันทึกสถิติ & Feedback<br/>chat_analytics/")]:::store

    ExtAuth(["🔥 Firebase Auth"]):::external
    ExtDB(["💾 Firebase RTDB / Firestore"]):::external
    ExtN8N(["🤖 n8n AI Chatbot (Pinecone + GPT-5 nano)"]):::external

    User -->|"กรอกข้อมูลเข้าสู่ระบบ"| P1
    P1 -->|"ตรวจสอบสิทธิ์"| ExtAuth
    ExtAuth -->|"ผลยืนยันตัวตน & Token"| P1
    P1 -->|"บันทึกสถานะผู้ใช้"| D1

    User -->|"จัดการผู้ใช้และสิทธิ์"| P2
    P2 <-->|"อ่าน/บันทึกโปรไฟล์"| D1
    D1 <--> ExtDB

    User -->|"จัดการรายวิชา/เงื่อนไข"| P3
    P3 <-->|"ปรับปรุงรายวิชา"| D2
    P3 <-->|"โครงสร้างหลักสูตร (Hybrid Sync)"| D3
    D2 <--> ExtDB
    D3 <--> ExtDB

    D2 -->|"อ่านรายวิชา"| P4
    D3 -->|"อ่านโครงสร้าง 13 หลักสูตร"| P4
    D4 <-->|"อ่าน/บันทึกแผนเรียน & เกรด (*)"| P4
    P4 -->|"แสดงผลผัง 2 มุมมอง (แผนของฉัน + โครงสร้าง)"| User
    D4 <--> ExtDB

    User -->|"ส่งคำถามหลักสูตร"| P5
    D3 -.->|"บริบทหลักสูตรที่ศึกษา"| P5
    P5 <-->|"ส่ง Prompt / รับคำตอบ RAG"| ExtN8N
    P5 -->|"บันทึกคะแนนความพึงพอใจ Feedback"| D5
    P5 -->|"คำตอบหลักสูตรพร้อมหน้าอ้างอิง มคอ.2"| User
    D5 <--> ExtDB
```

<br />

![Data Flow Diagram](diagrams/diagrams2/data-flow-diagram.drawio.png)

</details>

<details>
<summary>🔍 <strong>ดูรายละเอียด Component Diagram (Modular Architecture)</strong></summary>

<br />

แผนภาพแสดงการแบ่งสัดส่วนโมดูล การแยกหน้าที่ของคอมโพเนนต์ (Separation of Concerns) และการเชื่อมต่อบริการข้อมูล:

```mermaid
flowchart TB
    classDef client fill:#0C4A6E,stroke:#38BDF8,stroke-width:2px,color:#F0F9FF;
    classDef service fill:#78350F,stroke:#FBBF24,stroke-width:2px,color:#FEF3C7;
    classDef ext fill:#581C87,stroke:#C084FC,stroke-width:2px,color:#FAF5FF;

    subgraph ClientLayer ["🖥️ Client Layer (React 18 + TypeScript + Vite)"]
        direction TB
        App["App.tsx<br/>(Router & Institutional Theme)"]:::client
        AuthContext["AuthContext.tsx<br/>(Authentication & RBAC Session)"]:::client
        ProtRoute["ProtectedRoute.tsx / RoleBasedRoute.tsx<br/>(Route Guards)"]:::client

        subgraph ViewSection ["Presentation & Dashboards"]
            Pages["Pages<br/>(Home, Courses, Curriculum, Login)"]:::client
            Dashboards["Role Dashboards<br/>(Student, Instructor, Staff, Admin)"]:::client
            CourseMgmt["CourseManagement.tsx<br/>(Course CRUD & Data Sync)"]:::client
        end

        subgraph FeatureSection ["Interactive Core Features"]
            Flowchart["CurriculumFlowchart.tsx<br/>CurriculumTimelineFlowchart.tsx"]:::client
            ChatBot["ChatBot.tsx + FeedbackBanner.tsx<br/>(#n8n-chat Modern Academic Surface)"]:::client
            StudyPlan["StudyPlanProgress.tsx (Dual-View Container)<br/>StudentPlanTimeline.tsx (Personal Plan)<br/>StudyPlanManager.tsx (Plan Builder & Cascade)"]:::client
        end
    end

    subgraph ServiceLayer ["⚙️ Service & Business Logic Layer"]
        FirebaseService["firebaseService.ts<br/>(Data Operations & RTDB Sync)"]:::service
        CourseService["completeCurriculumData.ts & hybridCourseService.ts<br/>(13 Curricula Master & Data Sanitizer)"]:::service
        DeptService["departmentService.ts<br/>(Department & Curricula Catalog)"]:::service
        IdentityService["studyPlanIdentity.ts & studyPlanViewModel.ts<br/>(normalizeCodeForMatching & KPI Engine)"]:::service
    end

    subgraph ExternalLayer ["☁️ External Infrastructure"]
        FirebaseBackend["Firebase Auth & Realtime Database / Firestore"]:::ext
        N8NBackend["n8n Webhook Service + Pinecone + GPT-5 nano"]:::ext
    end

    App --> AuthContext
    AuthContext --> ProtRoute
    ProtRoute --> Pages
    Pages --> Dashboards
    Dashboards --> CourseMgmt
    Dashboards --> ViewSection
    ViewSection --> FeatureSection

    CourseMgmt --> CourseService
    CourseMgmt --> FirebaseService
    Flowchart --> DeptService
    StudyPlan --> FirebaseService
    StudyPlan --> IdentityService
    ChatBot --> N8NBackend

    FirebaseService <--> FirebaseBackend
    CourseService --> FirebaseService
```

<br />

![Component Diagram](diagrams/diagrams2/component-diagram.drawio.png)

</details>

<details>
<summary>🔍 <strong>ดูรายละเอียด Sequence Diagram (Runtime Lifecycle)</strong></summary>

<br />

แผนภาพแสดงลำดับเวลาและปฏิสัมพันธ์ของระบบใน 4 สเต็ปหลัก ตั้งแต่ Login, โหลดหลักสูตร 2 มุมมอง, บันทึกเกรด และถาม-ตอบแชทบอท:

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 ผู้ใช้ (User)
    participant UI as 💻 Frontend (React App)
    participant Auth as 🔐 Auth Service (AuthContext)
    participant Svc as ⚙️ Business Service (StudyPlan/Hybrid)
    participant FB as 🔥 Firebase Cloud (Auth/Firestore)
    participant N8N as 🤖 n8n AI Engine (Pinecone + GPT-5)

    %% Step 1: Login
    Note over User,FB: 1. การยืนยันตัวตน (Authentication & RBAC Session)
    User->>UI: 1.1 กรอกข้อมูลเข้าสู่ระบบ (Email/Password)
    UI->>Auth: 1.2 เรียก login(email, password)
    Auth->>FB: 1.3 verifyCredentials() ส่งไปยัง Firebase Auth
    FB-->>Auth: 1.4 ยืนยันตัวตนสำเร็จ ส่ง Token & User Profile
    Auth->>Auth: 1.5 เซ็ต Session State และ Role สิทธิ์ผู้ใช้
    Auth-->>UI: 1.6 Route Guard นำทางไปยัง Dashboard ตามสิทธิ์

    %% Step 2: Curriculum Display & Dual-View Flowchart
    Note over User,FB: 2. โหลดข้อมูลหลักสูตรและเรนเดอร์ผัง 2 มุมมอง (Dual-View Flowchart)
    User->>UI: 2.1 เปิดหน้า /dashboard/student
    UI->>Svc: 2.2 getStudyPlanByStudentId(studentId)
    Svc->>FB: 2.3 อ่านข้อมูล studyPlans/ (เช่น INE 62 หรือ 62 สหกิจ)
    FB-->>Svc: 2.4 ส่งคืนข้อมูลแผนและผลการเรียนที่บันทึก
    Svc->>UI: 2.5 Auto-detect แผนปกติ vs สหกิจ และดึง Hybrid Curriculum
    UI-->>User: 2.6 แสดงแท็บ 📋 แผนของฉัน (Timeline) และ 🗺️ โครงสร้างหลักสูตร (14 ลูกศร Prereq)

    %% Step 3: Grade Recording & Prerequisite Resolution
    Note over User,FB: 3. การบันทึกเกรดและประมวลผลความคืบหน้า (Grade Recording & Cascade)
    User->>UI: 3.1 กรอกเกรดรายวิชา หรือย้ายภาคการศึกษา
    UI->>Svc: 3.2 serializeStudentCourse() รักษา Origin & ตรวจสอบเงื่อนไข Prereq
    Svc->>FB: 3.3 updateStudyPlan() บันทึกลง Firestore studyPlans/
    FB-->>Svc: 3.4 ยืนยันการบันทึกสำเร็จ (Sync Realtime)
    Svc->>UI: 3.5 buildStudyPlanView() คำนวณ KPI หน่วยกิตที่ผ่านใหม่
    UI-->>User: 3.6 อัปเดตแถบความคืบหน้าและไฮไลท์สถานะวิชาผ่านสีเขียว (✓ เกรด [X])

    %% Step 4: Chatbot Interaction & Feedback Loop
    Note over User,N8N: 4. การสนทนาแชทบอทให้คำปรึกษาหลักสูตร (AI RAG Advising & Feedback)
    User->>UI: 4.1 พิมพ์คำถามเกี่ยวกับหลักสูตรใน #n8n-chat
    UI->>N8N: 4.2 POST Webhook ส่งคำถาม + บริบทหลักสูตรที่ศึกษา
    N8N->>N8N: 4.3 Pinecone Vector Search (มคอ.2 62.pdf) + GPT-5 nano Reasoning
    N8N-->>UI: 4.4 ส่งคำตอบที่แม่นยำ พร้อมระบุเอกสารอ้างอิงและเลขหน้า
    UI-->>User: 4.5 แสดงผลข้อความแนะนำ และแสดง FeedbackBanner
    User->>UI: 4.6 คลิกประเมินความพึงพอใจ (Like / Dislike / Rate)
    UI->>FB: 4.7 chatLogService.logFeedback() บันทึกสถิติลง chat_analytics/
```

<br />

![Sequence Diagram](diagrams/diagrams2/sequence-diagram.drawio.png)

</details>

---

## ขอบเขตหลักสูตรที่รองรับ

ระบบบรรจุฐานข้อมูล **CurriculumMasterCatalog** ครบถ้วนทั้ง 5 สาขาวิชา รวม 13 ฉบับหลักสูตรของภาควิชาเทคโนโลยีสารสนเทศ ขจัดปัญหาการตอบผิดพลาดของ AI (Hallucination) ด้วยการอ้างอิงโครงสร้างหลักสูตรและจำนวนหน่วยกิตที่รับรองอย่างเป็นทางการ:

| สาขาวิชา (Program) | รหัส | ฉบับหลักสูตรที่รองรับ (Curricula) | ระยะเวลาศึกษา | หน่วยกิตรวม |
| :--- | :---: | :--- | :---: | :---: |
| **เทคโนโลยีสารสนเทศ**<br />_Information Technology_ | `IT` | • หลักสูตร พ.ศ. 2562 (`IT-62`)<br />• หลักสูตร พ.ศ. 2562 สหกิจศึกษา (`IT-62-COOP`)<br />• หลักสูตร พ.ศ. 2567 (`IT-67`)<br />• หลักสูตร พ.ศ. 2567 สหกิจศึกษา (`IT-67-COOP`) | 4 ปี | 120 – 127 |
| **วิศวกรรมสารสนเทศและเครือข่าย**<br />_Information and Network Engineering_ | `INE` | • หลักสูตร พ.ศ. 2562 (`INE-62`)<br />• หลักสูตร พ.ศ. 2562 สหกิจศึกษา (`INE-62-COOP`)<br />• หลักสูตร พ.ศ. 2567 (`INE-67`)<br />• หลักสูตร พ.ศ. 2567 สหกิจศึกษา (`INE-67-COOP`) | 4 ปี | 125 – 135 |
| **เทคโนโลยีสารสนเทศและเครือข่าย**<br />_Information and Network Engineering_ | `INET` | • หลักสูตร พ.ศ. 2562 (`INET-62`)<br />• หลักสูตร พ.ศ. 2567 (`INET-67`) | 3 ปี | 102 – 103 |
| **เทคโนโลยีสารสนเทศ (ต่อเนื่อง)**<br />_Information Technology (Continuing)_ | `ITI` | • หลักสูตร พ.ศ. 2561 (`ITI-61`)<br />• หลักสูตร พ.ศ. 2566 (`ITI-66`) | 2 ปี | 78 – 81 |
| **เทคโนโลยีสารสนเทศ (เทียบโอน)**<br />_Information Technology (Transfer)_ | `ITT` | • หลักสูตร พ.ศ. 2567 (`ITT-67`) | 2 ปี | 84 |

---

## ฟีเจอร์เด่น (Bento Grid)

ระบบถูกออกแบบโดยแยกฟังก์ชันการทำงานหลักออกเป็น 4 ขุมพลังสำคัญ เพื่อประสบการณ์การใช้งานที่ราบรื่น:

### 🧭 1. จัดทำแผนการเรียนและผังวิชาอัจฉริยะ (Curriculum & Study Plan Engine)
> `Interactive Flowchart` · `Dual-View Progress` · `Anti-Collision Multi-Lane Routing` · `Prerequisites Path Tracing` · `GPAX Calculator` · `S/U Internship Evaluation`

- **Visual Course Flowchart**: แสดงผังรายวิชาพร้อมเส้นเชื่อมโยงวิชาบังคับก่อน (Prerequisites) และวิชาบังคับร่วม (Corequisites) ด้วยสีสันที่แยกแยะสถานะชัดเจน
- **แผนการเรียน 4 ปี (Study Plan)**: จัดการรายวิชาตามชั้นปีและภาคการศึกษา พร้อมระบบจำลองเกรดเพื่อคำนวณ GPA รายภาคและ GPAX สะสม
- **มุมมองความคืบหน้าสองรูปแบบ (Dual-View Student Progress & Personal Timeline)**: รองรับการสลับมุมมองระหว่าง "แผนของฉัน (Personal Plan Timeline)" ที่ประมวลผลตำแหน่ง ชื่อ รหัส เกรด และหน่วยกิตจากข้อมูลที่นักศึกษาบันทึกไว้จริงตามรายภาคเรียนโดยตรง ร่วมกับ "โครงสร้างหลักสูตร (Curriculum Flowchart)" พร้อมระบบคำนวณ KPI และความคืบหน้าหน่วยกิตที่แม่นยำตรงตามรายงานผลการเรียน
- **ระบบผังเส้นทางวิชาต่อเนื่องแบบลดการทับซ้อน (Anti-Collision Multi-Lane Flowchart Routing & Smooth Rounded Corners)**:
  - **Multi-Lane Track Allocator**: จัดสรรเลนย่อย (Offset $\pm 5\text{px}$ ถึง $\pm 6\text{px}$) สำหรับเส้นที่วิ่งขนานกันในร่องเดียวกันทั้งแนวนอนและแนวตั้ง ป้องกันเส้นทับซ้อนกันเป็นเส้นเดียวในหลักสูตรที่มีความซับซ้อนสูง (เช่น INE 62, INE 67, IT 62, INET 62)
  - **Multi-Port Spreading**: สำหรับวิชาที่มีวิชาตัวต่อหลายตัว (เช่น `060233108` มีวิชาต่อ 5 ตัว) จุดส่งออกของลูกศรบนขอบขวาของการ์ดจะกระจายตัวในแนวตั้งตามจำนวนเส้น ไม่กระจุกตัวที่จุดกึ่งกลาง
  - **Bottom Bus Channel (ทางด่วนข้ามเทอมระยะไกล $\ge 3$ เทอม)**: เส้นทางที่ข้ามภาคเรียนไกลๆ จะถูกนำทางอ้อมผ่านช่องทางรอบนอกด้านล่างตาราง ทำให้ไม่วิ่งผ่าตัดผ่านกลางแถววิชาของเทอมตรงกลาง ตารางวิชาจึงสะอาดและอ่านง่าย
  - **Smooth Rounded Corners**: แปลงมุมเลี้ยวหักฉาก 90 องศาเป็นมุมโค้งมน (Quadratic Bezier Fillet Arc Radius 7px) ช่วยให้อ่านและติดตามสายวิชาได้อย่างลื่นไหล
  - **Interactive Tracing & Focus Mode**: เลื่อนเมาส์ชี้ที่เส้น (Hover Tooltip) เพื่อดูคู่ความต่อเนื่อง คลิกเลือกวิชาเพื่อไฮไลต์สายวิชาบังคับก่อน (สีน้ำเงิน) และวิชาเรียนต่อได้ (สีม่วง) พร้อมปุ่มเปิด/ปิด "โหมดโฟกัส" (Focus Mode)
  - **Master Catalog Fallback**: รองรับและผ่านการตรวจสอบความถูกต้อง 100% ครอบคลุมครบทั้ง 13 ฉบับหลักสูตร
- **ระบบคงความถูกต้องของข้อมูลรายวิชา (Identity & Origin Preservation)**: ป้องกันการเขียนทับรหัสวิชาตั้งต้นด้วย `customCode` และป้องกันข้อมูลสูญหายเมื่อมีการแก้ไขชื่อหรือย้ายภาคเรียน ผ่าน `serializeStudentCourse`
- **ระบบประเมินผลฝึกงาน/สหกิจศึกษา (S/U Evaluation System)**: รองรับการประเมินผลรายวิชาฝึกงานและสหกิจศึกษาด้วยเกรด `S` (Satisfactory - ผ่าน) และ `U` (Unsatisfactory - ไม่ผ่าน) โดยไม่นำมาถ่วงน้ำหนักแต้มระดับคะแนน (Non-graded credits) ตามข้อบังคับมหาวิทยาลัย
- **ระบบค้นหาความเร็วสูง**: กรองวิชาตามกลุ่มวิชาศึกษาทั่วไป วิชาเฉพาะ และวิชาเลือกเสรี พร้อมค้นหาได้ทั้งรหัสวิชาและชื่อภาษาไทย/อังกฤษ

### ⚖️ 2. ควบคุมกฎระเบียบวิชาการอัตโนมัติ (Academic Rules & Validation Engine)
> `Credit Limits Enforcement` · `Probation Guard` · `Graduation Exemption`

- **ขอบเขตหน่วยกิตภาคปกติ**: ควบคุมการลงทะเบียนให้อยู่ระหว่าง 9 ถึง 22 หน่วยกิต ตามข้อบังคับมหาวิทยาลัย
- **ระบบเฝ้าระวังภาวะวิทยาทัณฑ์ (Probation Rule)**: นักศึกษาที่มีสถานะวิทยาทัณฑ์จะถูกจำกัดการลงทะเบียนสูงสุดไม่เกิน 16 หน่วยกิต (ต้องผ่านคำร้อง Probation Petition หากมีเหตุจำเป็น)
- **ภาคฤดูร้อนและภาคจบการศึกษา**: จำกัดการลงทะเบียนภาคฤดูร้อนไม่เกิน 6 หน่วยกิต และเปิดระบบยกเว้น (Graduation Term Exemption) ให้ลงต่ำกว่า 9 หน่วยกิตได้ในภาคเรียนสุดท้าย

### 🤖 3. แชทบอทให้คำปรึกษาหลักสูตร (Modern Academic Chat Surface)
> `n8n Orchestration` · `Pinecone Vector RAG` · `Curriculum Duration Guard` · `Sentiment Feedback` · `Native Caret Navigation`

- **การนำทางเคอร์เซอร์ด้วยปุ่มลูกศร (Native Caret & Arrow Key Navigation)**: แก้ไขปัญหาช่องพิมพ์ของ `@n8n/chat` ดักจับคีย์บอร์ดที่ Container แม่แล้วเรียก `preventDefault()` อัตโนมัติ โดยทำการตัดการกระจายอีเวนต์ (Stop Propagation) ในระดับ Textarea ทำให้ผู้ใช้สามารถใช้งานปุ่มลูกศร (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`), `Home`, `End`, `PageUp`, `PageDown`, การเลื่อนเคอร์เซอร์ข้ามบรรทัด และการคลุมเลือกข้อความ (`Shift + Arrow` / `Ctrl + Arrow`) ในช่องพิมพ์ได้อย่างสมบูรณ์ 100%
- **ฐานข้อมูลหลักสูตรแม่บท 13 ฉบับ (Authoritative 13 Curricula Master Catalog & Whitelist)**: รวบรวมข้อมูลหลักสูตรครบถ้วนทั้ง 13 ฉบับใน [MASTER_CURRICULUM_CATALOG.md](MASTER_CURRICULUM_CATALOG.md) และ [N8N_PREREQUISITES_GUIDE.md](N8N_PREREQUISITES_GUIDE.md) พร้อมรหัสวิชา 8 หลัก และชื่อวิชาภาษาไทยทางการ ควบคุมเงื่อนไขสหกิจศึกษาและฝึกงานภาคฤดูร้อนตามข้อเท็จจริง ป้องกัน AI แนะนำวิชาหรือเทอมที่ไม่มีอยู่จริง (เช่น ป้องกันการแนะนำ Co-op หรือ ซัมเมอร์ ใน ITT-67)
- **การคงบริบทหลักสูตรต่อเนื่อง (Multi-Turn Curriculum Persistence)**: ระบบจดจำหลักสูตรที่กำลังสนทนา (`ActiveConversationCurriculum`) ข้ามเทิร์นคำถาม แม้ผู้ใช้จะไม่ได้พิมพ์ชื่อหลักสูตรซ้ำในข้อความถัดไป
- **ระบบควบคุมระยะเวลาศึกษา (CurriculumDurationGuard)**: ป้องกันความผิดพลาดของ AI ในการสร้างข้อมูลปี 3 และปี 4 สำหรับหลักสูตรต่อเนื่อง/เทียบโอน 2 ปี (เช่น `ITT-67` มี 28 วิชา 84 หน่วยกิต เรียนเฉพาะปี 1 และปี 2)
- **กฎการแนะนำลงทะเบียนกรณีติด F (RetakePrerequisiteBlock & PassedCourseExclusion)**: คัดแยกวิชาที่สอบผ่านแล้วออกจากแผนลงทะเบียนใหม่อัตโนมัติ พร้อมตรวจจับและบล็อกการลงวิชาต่อเนื่องที่ยังติดวิชาบังคับก่อน (Prerequisite) จนกว่าจะลงทะเบียนเรียนซ้ำวิชาที่ติด F
- **นโยบายให้คำแนะนำทันที (Direct Advising Response Policy)**: บังคับให้บอทแสดงข้อมูล ตารางรายวิชา และคำแนะนำการลงทะเบียนที่สมบูรณ์ทันทีโดยไม่ถามย้อนเพื่อขออนุญาตแสดงผล
- **การป้อนบริบทอัตโนมัติ (Context Injection)**: ส่งรหัสหลักสูตรที่นักศึกษาศึกษาอยู่ (`EnrolledCurriculum`) และแคตตาล็อกรวม 13 ฉบับ เข้าสู่ Prompt แชทบอท เพื่อให้ได้คำตอบที่ถูกต้องตรงกับโครงสร้างจริง 100%
- **มาตรฐานชื่อวิชา (CoursePresentationFormat)**: คำตอบจากบอทจะประกอบด้วย `[รหัสวิชา] [ชื่อวิชาภาษาไทย]` เสมอ ไม่ปล่อยรหัสวิชาลอยๆ ให้นักศึกษาสับสน
- **ระบบสำรวจความพึงพอใจ 3 ระดับ (FeedbackScale)**: แสดงป้ายประเมินความพึงพอใจ (👎 ไม่ชอบ, 😐 ปานกลาง, 👍 ชอบ) ทุกๆ 5 ข้อความ พร้อมบันทึกสถิติเข้าสู่ Realtime Database
- **แถบเวลาการแจ้งเตือน (Alert Timeout Progress)**: Toast, inline error และข้อความขอบคุณหลังส่ง feedback ที่ปิดอัตโนมัติจะแสดงแถบบางที่ขอบล่างเพื่อบอกเวลาคงเหลือ โดยแถบและการปิดใช้ตัวจับเวลาเดียวกัน

### 📑 4. รายงานและการบริหารจัดการระดับองค์กร (Reporting & Admin Controls)
> `PDF/Excel Exporters` · `Dual-Layer Persistence` · `Analytics Dashboard`

- **ส่งออกเอกสารคุณภาพสูง**: พิมพ์หรือดาวน์โหลดแผนการเรียนและใบสรุปหน่วยกิตเป็นไฟล์ PDF (jsPDF + html2canvas) และตาราง Excel (SheetJS)
- **สถาปัตยกรรมข้อมูล 2 ชั้น**: จัดเก็บแยกส่วนระหว่าง `curriculum/` (โครงสร้างตามแผน) และ `courses/` (ดัชนีสืบค้นข้ามสาย) เพื่อป้องกันข้อมูลสูญหาย
- **แดชบอร์ดสถิติแชทบอท (Chat Analytics)**: ผู้ดูแลระบบสามารถตรวจสอบคำถามยอดนิยม อัตราความพึงพอใจ และความถี่ในการใช้งานระบบได้แบบเรียลไทม์

---

## บทบาทและสิทธิ์ผู้ใช้งาน

| บทบาท (Role) | สิทธิ์และการใช้งานหลัก |
| :--- | :--- |
| **🎓 นักศึกษา (Student)** | • วางแผนการเรียน บันทึกผลการเรียน และตรวจสอบสถานะหน่วยกิตของตนเอง<br />• ใช้งานแชทบอทเพื่อสอบถามข้อมูลหลักสูตรและการลงทะเบียน<br />• ส่งออกเอกสารแผนการเรียนในรูปแบบ PDF และ Excel |
| **👨‍🏫 อาจารย์ที่ปรึกษา (Instructor)** | • เรียกดูรายชื่อและค้นหาข้อมูลนักศึกษาในความดูแล<br />• ตรวจสอบแผนการเรียนและประวัติการลงทะเบียนของนักศึกษาเพื่อให้คำปรึกษา |
| **🏢 เจ้าหน้าที่ภาควิชา (Staff)** | • จัดการฐานข้อมูลรายวิชา เงื่อนไขวิชา และหลักสูตรในระบบ<br />• ตรวจสอบภาพรวมข้อมูลหลักสูตรและการลงทะเบียน |
| **⚙️ ผู้ดูแลระบบ (Admin)** | • จัดการบัญชีผู้ใช้งานและกำหนดสิทธิ์ (Role Assignment)<br />• ตรวจสอบภาพรวมระบบและวิเคราะห์ผลตอบรับของแชทบอท (Chat Analytics) |

---

## เทคโนโลยีและเครื่องมือ

- **Frontend Core:** React 18.3, TypeScript 5.8 (Strict Mode & TS 7.0 Ready: Modern Bundler Resolution), Vite 5.4
- **UI & Styling:** Tailwind CSS 3.4, shadcn/ui, Radix UI Primitives, Lucide Icons
- **State & Data Synchronization:** TanStack React Query 5.83, React Router 6.30
- **Database & Authentication:** Firebase Authentication, Firebase Realtime Database
- **AI & Automation Workflow:** n8n Workflow Orchestration, Pinecone Vector Database, OpenAI GPT-5 nano
- **Document & Export Services:** jsPDF 3.0, html2canvas 1.4, SheetJS (xlsx) 0.18
- **Data Validation & Forms:** Zod 3.25, React Hook Form 7.61

---

## การติดตั้งและเริ่มใช้งาน

### 1. ความต้องการของระบบ (Prerequisites)

- **Node.js**: เวอร์ชัน 18.x หรือสูงกว่า
- **npm** หรือ **bun**: ตัวจัดการแพ็กเกจ
- **Firebase Project**: ที่เปิดใช้งาน Authentication (Email/Password) และ Realtime Database
- **n8n Instance / Webhook URL**: สำหรับรองรับการประมวลผลของแชทบอท

### 2. การติดตั้งโปรเจกต์ (Installation)

```bash
# โคลนคลังข้อมูล
git clone https://github.com/kainapatkmutnb/it-course-chatbot-main.git
cd it-course-chatbot-main

# ติดตั้งแพ็กเกจและ dependencies
npm ci
```

### 3. การตั้งค่าตัวแปรสภาพแวดล้อม (Environment Configuration)

สร้างไฟล์ `.env` จากตัวอย่าง `.env.example`:

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

#### ตารางแจกแจงตัวแปรใน `.env`

| ตัวแปร | ความจำเป็น | คำอธิบาย |
| :--- | :---: | :--- |
| `VITE_FIREBASE_API_KEY` | **จำเป็น** | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | **จำเป็น** | Firebase Authentication Domain (เช่น `<project>.firebaseapp.com`) |
| `VITE_FIREBASE_DATABASE_URL` | **จำเป็น** | Firebase Realtime Database URL (เช่น `https://<project>-default-rtdb.asia-southeast1.firebasedatabase.app/`) |
| `VITE_FIREBASE_PROJECT_ID` | **จำเป็น** | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | **จำเป็น** | Firebase Storage Bucket URL |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`| **จำเป็น** | Firebase Cloud Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | **จำเป็น** | Firebase Web App ID |
| `VITE_N8N_WEBHOOK_URL` | **จำเป็น** | Production Webhook URL ของ n8n สำหรับรับ-ส่งข้อความแชทบอท |
| `VITE_N8N_SUMMARY_WEBHOOK_URL` | ทางเลือก | Webhook URL สำหรับ workflow สรุปข้อมูลการสนทนา |

> [!WARNING]
> ห้าม Commit ไฟล์ `.env` หรือส่งต่อ Private Key เข้าสู่ Git Repository โดยเด็ดขาด ตรวจสอบ URL ของฐานข้อมูลและ Project ID ให้ตรงกับ Environment ก่อนทำการบันทึกข้อมูลเสมอ

### 4. การรันระบบในเครื่อง (Local Development)

```bash
# เริ่มต้น Development Server
npm run dev
```

เปิดเว็บเบราว์เซอร์ที่ [http://localhost:8080](http://localhost:8080) (หรือตาม Port ที่ Vite ระบุใน Terminal)

### 5. การทดสอบด้วย Firebase Emulator

โปรเจกต์มีระบบจำลอง Firebase ในเครื่องเพื่อความปลอดภัยในการทดสอบ CRUD:

```bash
# Terminal 1: เริ่มต้น Firebase Local Emulator (Auth + Database)
npm run firebase:emulators

# Terminal 2: รันเว็บแอปใน Test Mode ที่เชื่อมกับ Emulator
npm run dev:emulator
```

> [!NOTE]
> การรันในโหมด Emulator ต้องใช้ `.env.test` ที่มี Project ID ในรูปแบบ `demo-*` (เช่น `demo-it-course-chatbot`) ระบบจะปฏิเสธการเชื่อมต่อไปยังฐานข้อมูลจริงเพื่อป้องกันข้อมูลเสียหาย

### 6. การนำเข้าข้อมูลหลักสูตร (Curriculum Data Migration)

หากต้องการตั้งค่าข้อมูลรายวิชาและโครงสร้างหลักสูตรเริ่มต้นเข้าสู่ Realtime Database:

```bash
npm run migrate:curriculum
```

### 7. การตรวจสอบโค้ดและการทดสอบ (Testing & Production Build)

ชุดทดสอบด้านล่างตรวจตรรกะในเครื่อง ผลผ่านไม่ได้ยืนยันผลตอบกลับจริงจาก n8n หรือการแสดงผลในเบราว์เซอร์ ซึ่งต้องตรวจแยกเมื่อแก้ส่วนที่เกี่ยวข้อง

```bash
# ตรวจข้อมูลความคืบหน้าและตัวตนรายวิชาของนักศึกษา
npx tsx --test tests/study-plan/progress.test.ts

# ตรวจเงื่อนไขระยะเวลาเรียน ฝึกงาน และสหกิจของ 13 หลักสูตร
npx tsx --test tests/curriculum/curriculumGuard.test.ts

# ตรวจสอบ Linting
npm run lint

# สร้าง Production Bundle
npm run build

# ทดสอบรัน Production Bundle ในเครื่อง
npm run preview
```

---

## โครงสร้างไดเรกทอรี

```text
it-course-chatbot-main/
├── diagrams/                # แผนภาพสถาปัตยกรรม (Context, DFD, Component, Sequence)
├── docs/
│   ├── adr/                 # Architecture Decision Records (ADR-001 ถึง ADR-008)
│   ├── audits/              # รายงานผลการตรวจสอบระบบ (CRUD Audit, Navigation QA)
│   └── superpowers/         # บันทึกแผนการพัฒนาและแบบร่างระบบ
├── public/                  # Static Assets และฟอนต์ภาษาไทย
├── src/
│   ├── components/          # UI Components
│   │   ├── chat/            # โมดูลแชทบอทและแบนเนอร์ Feedback
│   │   ├── curriculum/      # ผังหลักสูตรและ Flowchart รายวิชา
│   │   ├── dashboard/       # แดชบอร์ดตามสิทธิ์ (Admin, Staff, Instructor, Student)
│   │   ├── layout/          # โครงหน้าเว็บ Header, Footer และ Navigation
│   │   ├── study-plan/      # ตัวจัดการแผนการเรียนและระบบคำนวณหน่วยกิต
│   │   └── ui/              # shadcn / Radix UI Design System Primitives
│   ├── contexts/            # Context Providers (Auth, System State)
│   ├── hooks/               # Custom React Hooks
│   ├── pages/               # Routing Page Components
│   ├── services/            # บริการเชื่อมต่อ Firebase, n8n และหลักสูตร
│   ├── types/               # TypeScript Interfaces และ Type Definitions
│   └── utils/               # ฟังก์ชันคำนวณหน่วยกิตและโมดูล Export PDF/Excel
├── tests/
│   └── study-plan/          # ชุดทดสอบ Regression สำหรับ Study Plan View Model & Identity
├── CONTEXT.md               # Ubiquitous Language & Domain Model ของระบบ
├── database.rules.json      # กฎความปลอดภัย Firebase Realtime Database Rules
├── MASTER_CURRICULUM_CATALOG.md # คลังหลักสูตรฉบับสมบูรณ์ 13 ฉบับ (Single Source of Truth สำหรับ AI ChatBot)
├── N8N_PREREQUISITES_GUIDE.md # คู่มือการตั้งค่า n8n Webhook และ Vector Database
└── package.json             # โปรเจกต์สคริปต์และรายการ Dependencies
```

---

## มาตรฐานวิศวกรรมและการตัดสินใจ (ADR)

### เงื่อนไขหลักสูตรที่ส่งให้แชทบอท

[`CURRICULUM_RULES_CATALOG`](src/services/curriculumCatalogService.ts) เก็บเงื่อนไขแยกตามหลักสูตร 13 ฉบับ พร้อมข้อมูลสำรองระดับสาขา 5 กลุ่ม ได้แก่ ระยะเวลาเรียน ภาคการศึกษาที่รองรับ หน่วยกิต และรายละเอียดฝึกงาน/สหกิจ โดย [`ChatBot.tsx`](src/components/chat/ChatBot.tsx) ส่ง `curriculumDurationGuard` และข้อมูลหลักสูตรที่เลือกไปกับบริบทของคำถาม เพื่อกำหนดให้ใช้ metadata นี้เมื่อข้อมูลจาก RAG ขัดแย้งกัน

เงื่อนไขดังกล่าวเป็นข้อมูลอ้างอิงของหลักสูตร ส่วนตำแหน่งวิชาใน **แผนของฉัน** ใช้ปีและเทอมที่นักศึกษาบันทึกไว้ การย้ายวิชาของนักศึกษาจึงไม่ใช่การเปลี่ยนโครงสร้างหลักสูตรกลาง และสัดส่วนหน่วยกิตที่ผ่านไม่ใช่ผลรับรองว่าครบเงื่อนไขสำเร็จการศึกษา

ดูกรณีทดสอบใน [`curriculumGuard.test.ts`](tests/curriculum/curriculumGuard.test.ts) และรายละเอียดการส่งบริบทใน [คู่มือ prerequisite สำหรับ n8n](N8N_PREREQUISITES_GUIDE.md)

### บันทึกการตัดสินใจ

ระบบนี้พัฒนาโดยยึดหลักการออกแบบเชิงสถาปัตยกรรมและบันทึกการตัดสินใจที่สำคัญผ่าน **Architecture Decision Records (ADR)**:

| รหัสเอกสาร | หัวข้อการตัดสินใจ (Architectural Decision) | สถานะ |
| :---: | :--- | :---: |
| [ADR-001](docs/adr/ADR-001-custom-course-code-and-dynamic-years.md) | รองรับรหัสวิชาแบบกำหนดเองและปีหลักสูตรแบบไดนามิก | **Accepted** |
| [ADR-002](docs/adr/ADR-002-chat-feedback-system-and-admin-analytics.md) | ระบบสำรวจความพึงพอใจการสนทนาและแดชบอร์ดวิเคราะห์ผล | **Accepted** |
| [ADR-003](docs/adr/ADR-003-chatbot-toggle-ux-and-branding.md) | มาตรฐานปุ่มเปิด-ปิดแชทบอทและการนำเสนอแบรนด์ภาควิชา | **Accepted** |
| [ADR-004](docs/adr/ADR-004-toast-alert-redesign-and-positioning.md) | การออกแบบการแจ้งเตือน Toast แจ้งเตือนสถานะและตำแหน่งแสดงผล | **Accepted** |
| [ADR-005](docs/adr/ADR-005-registration-credit-limits-and-probation-rules.md) | ขอบเขตหน่วยกิตการลงทะเบียนและเกณฑ์การควบคุมภาวะวิทยาทัณฑ์ | **Accepted** |
| [ADR-006](docs/adr/ADR-006-multi-curriculum-context-resolution-and-catalog-injection.md) | กลไกชี้ขาดบริบทหลักสูตรและการป้อนข้อมูลแคตตาล็อกสู่ n8n | **Accepted** |
| [ADR-007](docs/adr/ADR-007-theme-adaptive-architectural-diagram-standards.md) | มาตรฐานไดอะแกรมสถาปัตยกรรมแบบปรับตามธีม (Dark/Light Mode) และการใช้ Native Mermaid | **Accepted** |
| [ADR-008](docs/adr/ADR-008-multi-turn-curriculum-persistence-and-advising-prerequisite-guard.md) | การคงบริบทหลักสูตรข้ามข้อความ (Multi-Turn Persistence) และระบบป้องกันเงื่อนไขการแนะนำลงทะเบียนวิชาติด F | **Accepted** |

### รายงานการตรวจสอบคุณภาพและมาตรฐานการออกแบบ (Quality Assurance & Architecture Specs)

- [Student Progress Consistency Implementation Plan](docs/superpowers/plans/2026-09-13-student-progress-consistency.md) — แผนปฏิบัติการและผลการปรับปรุงความสอดคล้องของภาพรวมความคืบหน้านักศึกษา (Dual-View Progress, Pure ViewModel Projection, Identity Preservation)
- [Modern Academic Web Redesign QA Audit](docs/audits/modern-academic-web-redesign-qa.md) — รายงานการตรวจรับส่วนติดต่อผู้ใช้สไตล์วิชาการร่วมสมัย ครอบคลุม 13 มิติการทดสอบและผลการตรวจรับ Protected Files 100%
- [Modern Academic Web Redesign Specification](docs/superpowers/specs/2026-09-13-modern-academic-web-redesign.md) — ข้อกำหนดรายละเอียดการออกแบบระบบวิชาการร่วมสมัย (Opt-in Architecture, Color Tokens, Typography, Accessibility)
- [Modern Academic Web Redesign Implementation Plan](docs/superpowers/plans/2026-09-13-modern-academic-web-redesign.md) — แผนปฏิบัติการ 9 ระยะสำหรับการยกระดับ UI และการควบคุมความเสี่ยง
- [Alert Timeout Progress QA](docs/audits/alert-timeout-progress-qa.md) — รายงานการตรวจสอบแถบเวลาคงเหลือสำหรับ toast, inline error และ feedback confirmation ที่ปิดอัตโนมัติ
- [Firebase CRUD & Credit Validation Audit](docs/audits/firebase-crud-credit-audit.md) — ผลการตรวจสอบความถูกต้องของการบันทึกข้อมูลและคำนวณหน่วยกิต (อัตราผ่าน 100%, 8/8 การทดสอบ)
- [Responsive Navigation & Student Flow QA](docs/audits/mobile-navigation-student-qa.md) — ผลการทดสอบการใช้งานบนอุปกรณ์พกพาและการนำทางของผู้ใช้นักศึกษา

---

## ความปลอดภัยและการปกป้องข้อมูล

1. **การยืนยันตัวตนและการจำกัดสิทธิ์**: ตรวจสอบบัญชีผู้ใช้ผ่าน Firebase Authentication และจำกัดอีเมลเฉพาะโดเมนที่กำหนดของมหาวิทยาลัย
2. **การควบคุมการเข้าถึงฐานข้อมูล**: ใช้ Firebase Realtime Database Security Rules (`database.rules.json`) ป้องกันการเขียนข้อมูลข้ามสิทธิ์ โดยมีเฉพาะ Admin และ Staff เท่านั้นที่แก้ไขโครงสร้างรายวิชาได้
3. **การแยกสิ่งแวดล้อมการพัฒนา**: ป้องกันข้อมูลสูญหายด้วยการบังคับให้โหมดทดสอบรันเฉพาะบน Local Firebase Emulator (`demo-*`)
4. **ความปลอดภัยของ AI Webhook**: ส่งข้อมูลเฉพาะบริบทที่จำเป็นในการตอบคำถาม และไม่จัดเก็บข้อมูลส่วนตัวที่ไม่เกี่ยวข้องใน Vector Database

---

<div align="center">

**ภาควิชาเทคโนโลยีสารสนเทศ**  
คณะเทคโนโลยีและการจัดการอุตสาหกรรม · มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ  
*Department of Information Technology, Faculty of Industrial Technology and Management, KMUTNB*

</div>
