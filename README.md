# IT Assistant - ระบบช่วยเหลือด้านเทคโนโลยีสารสนเทศ

ระบบช่วยเหลือและจัดการหลักสูตรสำหรับนักศึกษาและบุคลากรคณะเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ

## ✨ ฟีเจอร์หลัก

### 🔐 ระบบการยืนยันตัวตน
- เข้าสู่ระบบด้วย Google Account (@kmutnb.ac.th)
- เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
- ระบบจัดการบทบาทผู้ใช้ 4 ประเภท: นักศึกษา, อาจารย์, บุคลากร, ผู้ดูแลระบบ

### ✨ ฟีเจอร์หลัก

### 🔐 ระบบยืนยันตัวตนและการจัดการบทบาท
- **นักศึกษา**: ดูแผนการเรียน, จัดการรายวิชาส่วนตัว, บันทึกปีการศึกษา, ใช้ระบบแผนภูมิหลักสูตร
- **อาจารย์**: ดูข้อมูลนักศึกษา, จัดการรายวิชาที่สอน, ดูรายละเอียดนักศึกษา, แก้ไขข้อมูลนักศึกษา, ติดตามความก้าวหน้าของนักศึกษา
- **บุคลากร**: จัดการข้อมูลรายวิชา, กำหนดเงื่อนไขรายวิชา (Prerequisites และ Corequisites), จัดการหลักสูตร
- **ผู้ดูแลระบบ**: จัดการผู้ใช้, สถิติระบบ, ประวัติการใช้งาน (Audit Logs), จัดการข้อมูลรายวิชา, จัดการเงื่อนไขรายวิชา

### 📚 ระบบจัดการหลักสูตรและรายวิชา
- ข้อมูลรายวิชาครบถ้วน (รหัสวิชา, ชื่อวิชา, หน่วยกิต, คำอธิบาย, หมวดหมู่)
- การจัดหมวดหมู่รายวิชา (วิชาทั่วไป, วิชาเฉพาะ, วิชาเลือก, วิชาเสรี)
- ระบบเงื่อนไขรายวิชา (Prerequisites และ Corequisites) แบบ Real-time
- แผนการเรียนตามหลักสูตรหลายปีการศึกษา
- ระบบค้นหาและกรองรายวิชาขั้นสูง
- การจัดการรายวิชาแบบ CRUD (Create, Read, Update, Delete)

### 📊 ระบบแผนภูมิหลักสูตร (Curriculum Flowchart)
- **แผนภูมิแบบ Grid**: แสดงรายวิชาจัดเรียงตามปีและภาคการศึกษา
- **แผนภูมิแบบ Timeline**: แสดงความต่อเนื่องของหลักสูตรตามเวลา
- **เส้นเชื่อมโยงเงื่อนไขวิชา**: แสดงความสัมพันธ์ระหว่างรายวิชาแบบ Visual
- **การอัปเดตแบบ Real-time**: เมื่อมีการเปลี่ยนแปลงเงื่อนไขวิชาจะอัปเดตทันที
- **ระบบกรองตามหลักสูตร**: เลือกดูหลักสูตรและปีการศึกษาที่ต้องการ
- **สรุปข้อมูลหลักสูตร**: แสดงจำนวนหน่วยกิตรวม, จำนวนวิชา, และสถิติต่างๆ

### 🎯 ระบบแผนการเรียนส่วนบุคคล
- สร้างและจัดการแผนการเรียนส่วนบุคคล
- ติดตามความคืบหน้าการเรียนแบบ Real-time
- คำนวณ GPA และหน่วยกิตสะสมอัตโนมัติ
- สถานะรายวิชา (วางแผน, กำลังเรียน, ผ่านแล้ว, ไม่ผ่าน, ถอน)
- **ระบบกรองข้อมูล**: Dropdown filters สำหรับกรองรายวิชาตามปีและภาคการศึกษา
- **การบันทึกข้อมูล**: บันทึกปีการศึกษาของนักศึกษาแบบถาวร
- **การคำนวณเกรด**: ระบบคำนวณเกรดและ GPA ตามมาตรฐาน KMUTNB

### 👨‍🎓 ระบบจัดการนักศึกษา
- ดูรายละเอียดนักศึกษาแบบละเอียด (ข้อมูลส่วนตัว, แผนการเรียน, ผลการเรียน)
- แก้ไขและบันทึกปีการศึกษาของนักศึกษา
- ติดตามแผนการเรียนของนักศึกษาแบบ Real-time
- ระบบกรองและค้นหานักศึกษา
- การจัดการข้อมูลนักศึกษาแบบ Batch

### 🤖 ระบบ Chatbot AI (n8n AI Assistant & Firebase Integration)
- **การเชื่อมโยงฐานข้อมูลนักศึกษา**: แชทบอทสามารถระบุตัวตนและวิเคราะห์ประวัติส่วนตัว เกรดเฉลี่ยสะสม (GPA) หน่วยกิตเรียนผ่าน และวิชาเรียนจากแผนการเรียนจริงบน Firebase Realtime Database แบบ Real-time
- **การวิเคราะห์หลักสูตรกลาง**: ดึงข้อมูลโครงสร้างวิชาเรียนมาตรฐานทั้งหมดของรุ่นนั้นๆ (IT, INE) เพื่อนำมาเปรียบเทียบหาวิชาบังคับในหลักสูตรที่นักศึกษายังไม่ได้ลงทะเบียนเรียน
- **ระบบผู้เยี่ยมชม (Guest Mode)**: เปิดให้ผู้ใช้ทั่วไปที่ยังไม่ได้ล็อกอินสนทนากับแชทบอทได้ โดยจำกัดสิทธิ์ความปลอดภัยไม่ให้เข้าถึงประวัติและข้อมูลส่วนตัว พร้อมค้นหาคำถามทั่วไปผ่านระบบสืบค้นข้อมูล Pinecone RAG บน n8n
- **การตอบคำถามเงื่อนไขวิชาเรียน**: ค้นหารายวิชา แนะนำวิชาเรียนลำดับถัดไป และชี้แจงรายวิชาตัวต่อ (Prerequisites/Corequisites) ด้วยภาษาธรรมชาติ (Natural Language)

### 📈 ระบบรายงานและสถิติ
- สถิติผู้ใช้งานระบบแบบ Real-time
- รายงานการใช้งาน (Audit Logs) พร้อมระบบค้นหา
- ข้อมูลสถิติรายวิชาและนักศึกษา
- Dashboard แสดงข้อมูลสำคัญของระบบ
- ระบบ Export ข้อมูลเป็น CSV/Excel

## 🛠️ เทคโนโลยีที่ใช้

### Frontend
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool และ Development Server
- **Tailwind CSS** - Styling Framework
- **shadcn/ui** - UI Components Library (Radix UI)
- **React Router DOM** - Navigation และ Routing
- **Lucide React** - Icon Library
- **React Hook Form** - Form Management
- **Zod** - Schema Validation
- **Recharts** - Data Visualization และ Charts
- **html2canvas & jsPDF** - Export และ PDF Generation

### Backend & Database
- **Firebase** - Backend as a Service
  - **Firebase Authentication** - ระบบยืนยันตัวตน
  - **Firebase Realtime Database** - ฐานข้อมูลแบบ Real-time
  - **Firebase Hosting** - Web Hosting

### State Management & Data Fetching
- **TanStack React Query** - Data Fetching และ State Management
- **React Context API** - Global State Management

### UI/UX Libraries
- **Radix UI** - Headless UI Components
- **Class Variance Authority (CVA)** - Component Variants
- **Tailwind Merge** - CSS Class Merging
- **Sonner** - Toast Notifications
- **Next Themes** - Theme Management
- **Embla Carousel** - Carousel Components

### Development Tools
- **ESLint** - Code Linting
- **TypeScript ESLint** - TypeScript Linting
- **Autoprefixer** - CSS Prefixing
- **PostCSS** - CSS Processing

## 🚀 การติดตั้งและใช้งาน

### ข้อกำหนดเบื้องต้น
- **Node.js** (เวอร์ชัน 18 หรือใหม่กว่า)
- **npm** หรือ **yarn** Package Manager
- **Firebase Project** พร้อม Realtime Database และ Authentication

### ขั้นตอนการติดตั้ง

1. **Clone Repository**
```bash
git clone <repository-url>
cd it-course-chatbot-main
```

2. **ติดตั้ง Dependencies**
```bash
npm install
```

3. **ตั้งค่า Environment Variables**
สร้างไฟล์ `.env` ในโฟลเดอร์ root และเพิ่มข้อมูล Firebase Configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. **เริ่มต้นข้อมูลใน Firebase (ถ้าจำเป็น)**
```bash
node initialize-firebase-data.cjs
```

5. **เริ่มต้น Development Server**
```bash
npm run dev
```

6. **Build สำหรับ Production**
```bash
npm run build
```

7. **Preview Production Build**
```bash
npm run preview
```

แอปพลิเคชันจะทำงานที่ `http://localhost:5173`

## 👥 บทบาทผู้ใช้และสิทธิ์การเข้าถึง

### นักศึกษา (Student)
- อีเมล: `s[รหัสนักศึกษา]@email.kmutnb.ac.th`
- สิทธิ์: ดูแผนการเรียน, จัดการรายวิชาส่วนตัว, บันทึกปีการศึกษา

### อาจารย์ (Instructor)
- อีเมล: `instructor@kmutnb.ac.th`
- สิทธิ์: ดูข้อมูลนักศึกษา, จัดการรายวิชาที่สอน, ดูรายละเอียดนักศึกษา, แก้ไขข้อมูลนักศึกษา

### บุคลากร (Staff)
- อีเมล: `staff@kmutnb.ac.th`
- สิทธิ์: จัดการข้อมูลรายวิชา, กำหนดเงื่อนไข

### ผู้ดูแลระบบ (Admin)
- อีเมล: `admin@kmutnb.ac.th`
- สิทธิ์: จัดการผู้ใช้, ดูสถิติระบบ, ประวัติการใช้งาน, จัดการข้อมูลรายวิชา, จัดการเงื่อนไขรายวิชา

## 📁 โครงสร้างโปรเจกต์

```
src/
├── components/          # React Components
│   ├── ProtectedRoute.tsx       # Route Protection Component
│   ├── RoleBasedRoute.tsx       # Role-based Access Control
│   ├── chat/                    # Chatbot Components
│   │   └── ChatBot.tsx          # AI Chatbot Interface
│   ├── curriculum/              # Curriculum Components
│   │   ├── CurriculumFlowchart.tsx      # Grid-style Flowchart
│   │   └── CurriculumTimelineFlowchart.tsx  # Timeline-style Flowchart
│   ├── dashboard/               # Dashboard Components สำหรับแต่ละบทบาท
│   │   ├── StudentDashboard.tsx         # Dashboard นักศึกษา
│   │   ├── InstructorDashboard.tsx      # Dashboard อาจารย์
│   │   ├── StaffDashboard.tsx           # Dashboard บุคลากร
│   │   ├── AdminDashboard.tsx           # Dashboard ผู้ดูแลระบบ
│   │   ├── StudentDetailView.tsx        # รายละเอียดนักศึกษา
│   │   └── CourseManagement.tsx         # จัดการรายวิชา
│   ├── study-plan/              # Study Plan Management Components
│   │   └── StudyPlanManager.tsx         # จัดการแผนการเรียน
│   ├── layout/                  # Layout Components
│   │   ├── Header.tsx           # Header Component
│   │   └── Footer.tsx           # Footer Component
│   └── ui/                      # UI Components (shadcn/ui)
├── pages/                       # Page Components
│   ├── Home.tsx                 # หน้าแรก
│   ├── Login.tsx                # หน้าเข้าสู่ระบบ
│   ├── Register.tsx             # หน้าสมัครสมาชิก
│   ├── Courses.tsx              # หน้ารายวิชา
│   ├── CurriculumDashboard.tsx  # หน้าแผนภูมิหลักสูตร
│   ├── DashboardRouter.tsx      # Router สำหรับ Dashboard
│   ├── Index.tsx                # หน้าหลัก
│   └── NotFound.tsx             # หน้า 404
├── contexts/                    # React Contexts
│   └── AuthContext.tsx          # Authentication Context
├── hooks/                       # Custom Hooks
│   ├── useFirebaseData.ts       # Firebase Data Hooks
│   ├── use-toast.ts             # Toast Hook
│   └── use-mobile.tsx           # Mobile Detection Hook
├── services/                    # API Services
│   ├── firebaseService.ts       # Firebase Service
│   ├── courseService.ts         # Course Service
│   ├── departmentService.ts     # Department Service
│   ├── hybridCourseService.ts   # Hybrid Course Service
│   └── completeCurriculumData.ts # Complete Curriculum Data
├── types/                       # TypeScript Types
│   ├── auth.ts                  # Authentication Types
│   ├── course.ts                # Course Types
│   └── chat.ts                  # Chat Types
├── utils/                       # Utility Functions
│   ├── gradeUtils.ts            # Grade Calculation Utils
│   ├── pdfExport.ts             # PDF Export Utils
│   └── firestoreUtils.ts        # Firestore Utils
├── config/                      # Configuration Files
│   └── firebase.ts              # Firebase Configuration
└── lib/                         # Library Functions
    └── utils.ts                 # General Utilities
```

## 🔧 คำสั่งที่สำคัญ

```bash
# Development
npm run dev              # เริ่ม development server
npm run build           # Build สำหรับ production
npm run preview         # Preview production build
npm run lint            # ตรวจสอบ code quality

# Firebase
node initialize-firebase-data.cjs  # เริ่มต้นข้อมูลใน Firebase
```

## 🌐 การ Deploy

### Firebase Hosting
1. ติดตั้ง Firebase CLI
```bash
npm install -g firebase-tools
```

2. Login และเลือก Project
```bash
firebase login
firebase use --add
```

3. Build และ Deploy
```bash
npm run build
firebase deploy
```

## 🔒 ความปลอดภัย

- ระบบจำกัดการเข้าถึงเฉพาะอีเมล @kmutnb.ac.th และ @email.kmutnb.ac.th
- การยืนยันตัวตนผ่าน Firebase Authentication
- ระบบ Role-based Access Control
- บันทึกประวัติการใช้งาน (Audit Logs)

## 📞 การสนับสนุน

สำหรับข้อสงสัยหรือปัญหาการใช้งาน กรุณาติดต่อ:
- คณะเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ

## 📄 License

โปรเจกต์นี้พัฒนาขึ้นเพื่อใช้ภายในคณะเทคโนโลยีสารสนเทศ KMUTNB
# it-course-chatbot-main