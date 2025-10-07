# Migration Script สำหรับข้อมูลหลักสูตร

## วัตถุประสงค์
Script นี้ใช้สำหรับย้ายข้อมูลหลักสูตรจาก `completeCurriculumData.ts` (ข้อมูลแบบ static) ไปยัง Firebase Realtime Database เพื่อให้ระบบ Admin Course Management สามารถใช้ข้อมูลจาก Firebase ได้

## การติดตั้ง

### 1. ติดตั้ง dependencies ที่จำเป็น
```bash
npm install --save-dev tsx
```

### 2. ตรวจสอบ Environment Variables
ตรวจสอบให้แน่ใจว่าไฟล์ `.env` มีการตั้งค่า Firebase configuration ที่ถูกต้อง:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## การใช้งาน

### รัน Migration Script
```bash
npm run migrate:curriculum
```

## ฟังก์ชันการทำงาน

### หลักสูตรที่รองรับ
- **โปรแกรม**: เทคโนโลยีสารสนเทศ (IT)
- **ปีหลักสูตร**: 2566, 2567
- **เทอม**: 1-8

### โครงสร้างข้อมูล
ข้อมูลแต่ละวิชาจะถูกบันทึกใน Firebase ด้วยโครงสร้าง:
```typescript
{
  id: string,              // รหัสเฉพาะ: {program}-{curriculumYear}-{semester}-{courseCode}
  code: string,            // รหัสวิชา
  name: string,            // ชื่อวิชา
  credits: number,         // หน่วยกิต
  category: string,        // หมวดหมู่วิชา
  mainCategory?: string,   // หมวดหมู่หลัก
  subCategory?: string,    // หมวดหมู่ย่อย
  description?: string,    // คำอธิบายวิชา
  prerequisites?: string[], // วิชาที่ต้องเรียนก่อน
  program: string,         // โปรแกรม
  curriculumYear: string,  // ปีหลักสูตร
  semester: number         // เทอม
}
```

### การตรวจสอบข้อมูลที่มีอยู่
- Script จะตรวจสอบว่ามีข้อมูลใน Firebase อยู่แล้วหรือไม่
- หากมีข้อมูลอยู่แล้ว จะแสดงคำเตือนและดำเนินการต่อ (overwrite)

### สถิติการ Migration
เมื่อเสร็จสิ้น Script จะแสดง:
- จำนวนวิชาทั้งหมดที่ประมวลผล
- จำนวนวิชาที่ migrate สำเร็จ
- จำนวนวิชาที่ migrate ไม่สำเร็จ
- รายการ error (หากมี)

## การใช้งานหลัง Migration

### ระบบ Admin Course Management
หลังจาก migration เสร็จสิ้น:
1. ระบบ Admin สามารถดู แก้ไข เพิ่ม และลบข้อมูลวิชาใน Firebase ได้
2. ข้อมูลจะถูกเก็บใน Firebase Realtime Database ภายใต้ path `/courses`
3. การเปลี่ยนแปลงจะมีผลทันทีในระบบ

### หน้าหลักสูตร (Curriculum Page)
- หน้าหลักสูตรยังคงใช้ข้อมูลจาก `completeCurriculumData.ts` เหมือนเดิม
- ไม่มีผลกระทบต่อการแสดงผลหลักสูตรสำหรับนักศึกษา

## การตรวจสอบข้อมูลใน Firebase

### ใช้ Script ตรวจสอบ
```bash
node check-firebase-data.js
```

### ตรวจสอบผ่าน Firebase Console
1. เข้า Firebase Console
2. ไปที่ Realtime Database
3. ดูข้อมูลใน path `/courses`

## Troubleshooting

### ปัญหาการเชื่อมต่อ Firebase
- ตรวจสอบ environment variables
- ตรวจสอบ Firebase project configuration
- ตรวจสอบ network connectivity

### ปัญหา Permission
- ตรวจสอบ Firebase security rules
- ตรวจสอบสิทธิ์การเข้าถึง database

### ข้อมูลไม่ถูกต้อง
- ตรวจสอบ `completeCurriculumData.ts`
- ตรวจสอบ function `generateCoursesForSemester`

## หมายเหตุ
- Script นี้ใช้ Firebase Realtime Database ไม่ใช่ Firestore
- การ migrate จะ overwrite ข้อมูลที่มีอยู่
- ควรสำรองข้อมูลก่อนรัน migration ในระบบ production