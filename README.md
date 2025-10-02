# IT Assistant - ระบบช่วยเหลือด้านเทคโนโลยีสารสนเทศ

ระบบช่วยเหลือและจัดการหลักสูตรสำหรับนักศึกษาและบุคลากรคณะเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ

## ✨ ฟีเจอร์หลัก

### 🔐 ระบบการยืนยันตัวตน
- เข้าสู่ระบบด้วย Google Account (@kmutnb.ac.th)
- เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
- ระบบจัดการบทบาทผู้ใช้ 4 ประเภท: นักศึกษา, อาจารย์, บุคลากร, ผู้ดูแลระบบ

### 📊 Dashboard ตามบทบาท
- **นักศึกษา**: ดูแผนการเรียน, ติดตามผลการเรียน, จัดการรายวิชา
- **อาจารย์**: จัดการนักศึกษาในความดูแล, ดูข้อมูลรายวิชาที่สอน
- **บุคลากร**: จัดการข้อมูลรายวิชา, กำหนดเงื่อนไขรายวิชา
- **ผู้ดูแลระบบ**: จัดการผู้ใช้, สถิติระบบ, ประวัติการใช้งาน

### 📚 ระบบจัดการหลักสูตร
- ข้อมูลรายวิชาครบถ้วน (รหัสวิชา, หน่วยกิต, คำอธิบาย)
- การจัดหมวดหมู่รายวิชา (วิชาทั่วไป, วิชาเฉพาะ, วิชาเลือก)
- ระบบเงื่อนไขรายวิชา (Prerequisites)
- แผนการเรียนตามหลักสูตร

### 🎯 ระบบแผนการเรียน
- สร้างและจัดการแผนการเรียนส่วนบุคคล
- ติดตามความคืบหน้าการเรียน
- คำนวณหน่วยกิตสะสม
- สถานะรายวิชา (วางแผน, กำลังเรียน, ผ่านแล้ว, ไม่ผ่าน)

### 📈 ระบบรายงานและสถิติ
- สถิติผู้ใช้งานระบบ
- รายงานการใช้งาน (Audit Logs)
- ข้อมูลสถิติรายวิชาและนักศึกษา

## 🛠️ เทคโนโลยีที่ใช้

### Frontend
- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI Components
- **React Router** - Navigation
- **React Hook Form** - Form Management

### Backend & Database
- **Firebase Authentication** - การยืนยันตัวตน
- **Firebase Realtime Database** - ฐานข้อมูลแบบ Real-time
- **Firebase Hosting** - การ Deploy

### State Management
- **React Context** - Global State
- **Custom Hooks** - Data Fetching

## 🚀 การติดตั้งและใช้งาน

### ข้อกำหนดเบื้องต้น
- Node.js (เวอร์ชัน 18 หรือใหม่กว่า)
- npm หรือ yarn
- Firebase Project

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
สร้างไฟล์ `.env` และเพิ่มข้อมูล Firebase:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. **เริ่มต้นข้อมูลใน Firebase**
```bash
node initialize-firebase-data.cjs
```

5. **เริ่มต้น Development Server**
```bash
npm run dev
```

แอปพลิเคชันจะทำงานที่ `http://localhost:5173`

## 👥 บทบาทผู้ใช้และสิทธิ์การเข้าถึง

### นักศึกษา (Student)
- อีเมล: `s[รหัสนักศึกษา]@email.kmutnb.ac.th`
- สิทธิ์: ดูแผนการเรียน, จัดการรายวิชาส่วนตัว

### อาจารย์ (Instructor)
- อีเมล: `instructor@kmutnb.ac.th`
- สิทธิ์: ดูข้อมูลนักศึกษา, จัดการรายวิชาที่สอน

### บุคลากร (Staff)
- อีเมล: `staff@kmutnb.ac.th`
- สิทธิ์: จัดการข้อมูลรายวิชา, กำหนดเงื่อนไข

### ผู้ดูแลระบบ (Admin)
- อีเมล: `admin@kmutnb.ac.th`
- สิทธิ์: จัดการผู้ใช้, ดูสถิติระบบ, ประวัติการใช้งาน

## 📁 โครงสร้างโปรเจกต์

```
src/
├── components/          # React Components
│   ├── dashboard/      # Dashboard Components สำหรับแต่ละบทบาท
│   ├── layout/         # Layout Components
│   └── ui/             # UI Components (shadcn/ui)
├── contexts/           # React Contexts
├── hooks/              # Custom Hooks
├── pages/              # Page Components
├── services/           # API Services
├── types/              # TypeScript Types
└── utils/              # Utility Functions
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
# it-course-chatbot-main
