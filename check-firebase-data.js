// สคริปต์สำหรับตรวจสอบข้อมูลใน Firebase Database
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import dotenv from 'dotenv';

// โหลด environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || "https://it-chatbot-f663e-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ฟังก์ชันสำหรับตรวจสอบข้อมูลใน Firebase
async function checkFirebaseData() {
  try {
    console.log('🔍 กำลังตรวจสอบข้อมูลใน Firebase Database...\n');
    
    // ตรวจสอบข้อมูลผู้ใช้ (users)
    console.log('👥 ข้อมูลผู้ใช้ (Users):');
    console.log('=' .repeat(50));
    
    const usersRef = ref(database, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      const usersData = usersSnapshot.val();
      const userCount = Object.keys(usersData).length;
      console.log(`📊 จำนวนผู้ใช้ทั้งหมด: ${userCount} คน\n`);
      
      // แยกตามบทบาท
      const roleStats = {};
      const instructors = [];
      const students = [];
      
      Object.entries(usersData).forEach(([userId, userData]) => {
        const role = userData.role || 'unknown';
        roleStats[role] = (roleStats[role] || 0) + 1;
        
        if (role === 'instructor') {
          instructors.push({ id: userId, ...userData });
        } else if (role === 'student') {
          students.push({ id: userId, ...userData });
        }
      });
      
      console.log('📈 สถิติตามบทบาท:');
      Object.entries(roleStats).forEach(([role, count]) => {
        console.log(`   - ${role}: ${count} คน`);
      });
      
      console.log('\n👨‍🏫 รายชื่ออาจารย์:');
      instructors.forEach((instructor, index) => {
        console.log(`   ${index + 1}. ${instructor.name} (${instructor.email})`);
        console.log(`      ID: ${instructor.id}`);
        console.log(`      แผนก: ${instructor.department || 'ไม่ระบุ'}`);
      });
      
      console.log('\n👨‍🎓 รายชื่อนักศึกษา:');
      students.forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.name} (${student.email})`);
        console.log(`      ID: ${student.id}`);
        console.log(`      รหัสนักศึกษา: ${student.studentId || 'ไม่ระบุ'}`);
        console.log(`      แผนก: ${student.department || 'ไม่ระบุ'}`);
        console.log(`      อาจารย์ที่ปรึกษา: ${student.advisorId || 'ไม่ได้กำหนด'}`);
      });
      
    } else {
      console.log('❌ ไม่พบข้อมูลผู้ใช้ในระบบ');
    }
    
    console.log('\n' + '=' .repeat(50));
    
    // ตรวจสอบข้อมูลแผนการเรียน (studyPlans)
    console.log('📚 ข้อมูลแผนการเรียน (Study Plans):');
    console.log('=' .repeat(50));
    
    const studyPlansRef = ref(database, 'studyPlans');
    const studyPlansSnapshot = await get(studyPlansRef);
    
    if (studyPlansSnapshot.exists()) {
      const studyPlansData = studyPlansSnapshot.val();
      const planCount = Object.keys(studyPlansData).length;
      console.log(`📊 จำนวนแผนการเรียนทั้งหมด: ${planCount} แผน\n`);
      
      Object.entries(studyPlansData).forEach(([planId, planData], index) => {
        console.log(`   ${index + 1}. แผนการเรียน ID: ${planId}`);
        console.log(`      นักศึกษา ID: ${planData.studentId}`);
        console.log(`      หลักสูตร: ${planData.curriculum || 'ไม่ระบุ'}`);
        console.log(`      หน่วยกิตรวม: ${planData.totalCredits || 0}`);
        console.log(`      หน่วยกิตที่เรียนแล้ว: ${planData.completedCredits || 0}`);
        console.log(`      เกรดเฉลี่ย: ${planData.gpa || 0}`);
        console.log(`      จำนวนรายวิชา: ${planData.courses ? planData.courses.length : 0}`);
        console.log('');
      });
    } else {
      console.log('❌ ไม่พบข้อมูลแผนการเรียนในระบบ');
    }
    
    console.log('=' .repeat(50));
    
    // ตรวจสอบข้อมูลรายวิชา (courses)
    console.log('📖 ข้อมูลรายวิชา (Courses):');
    console.log('=' .repeat(50));
    
    const coursesRef = ref(database, 'courses');
    const coursesSnapshot = await get(coursesRef);
    
    if (coursesSnapshot.exists()) {
      const coursesData = coursesSnapshot.val();
      let courseCount = 0;
      
      // นับจำนวนรายวิชาทั้งหมด
      Object.values(coursesData).forEach(program => {
        if (typeof program === 'object') {
          Object.values(program).forEach(curriculum => {
            if (typeof curriculum === 'object') {
              Object.values(curriculum).forEach(year => {
                if (typeof year === 'object') {
                  Object.values(year).forEach(semester => {
                    if (typeof semester === 'object') {
                      courseCount += Object.keys(semester).length;
                    }
                  });
                }
              });
            }
          });
        }
      });
      
      console.log(`📊 จำนวนรายวิชาทั้งหมด: ${courseCount} วิชา`);
      console.log('📁 โครงสร้างข้อมูลรายวิชา:');
      
      Object.entries(coursesData).forEach(([program, programData]) => {
        console.log(`   📂 หลักสูตร: ${program}`);
        if (typeof programData === 'object') {
          Object.entries(programData).forEach(([curriculum, curriculumData]) => {
            console.log(`      📂 ปีหลักสูตร: ${curriculum}`);
            if (typeof curriculumData === 'object') {
              Object.entries(curriculumData).forEach(([year, yearData]) => {
                console.log(`         📂 ปีที่: ${year}`);
                if (typeof yearData === 'object') {
                  Object.entries(yearData).forEach(([semester, semesterData]) => {
                    const semesterCourseCount = typeof semesterData === 'object' ? Object.keys(semesterData).length : 0;
                    console.log(`            📂 เทอม: ${semester} (${semesterCourseCount} วิชา)`);
                  });
                }
              });
            }
          });
        }
      });
    } else {
      console.log('❌ ไม่พบข้อมูลรายวิชาในระบบ');
    }
    
    console.log('\n' + '=' .repeat(50));
    
    // ตรวจสอบข้อมูลแผนก (departments)
    console.log('🏢 ข้อมูลแผนก (Departments):');
    console.log('=' .repeat(50));
    
    const departmentsRef = ref(database, 'departments');
    const departmentsSnapshot = await get(departmentsRef);
    
    if (departmentsSnapshot.exists()) {
      const departmentsData = departmentsSnapshot.val();
      const deptCount = Object.keys(departmentsData).length;
      console.log(`📊 จำนวนแผนกทั้งหมด: ${deptCount} แผนก\n`);
      
      Object.entries(departmentsData).forEach(([deptId, deptData], index) => {
        console.log(`   ${index + 1}. ${deptData.name} (${deptData.code})`);
        console.log(`      ID: ${deptId}`);
        console.log(`      คำอธิบาย: ${deptData.description || 'ไม่มี'}`);
      });
    } else {
      console.log('❌ ไม่พบข้อมูลแผนกในระบบ');
    }
    
    console.log('\n' + '=' .repeat(50));
    
    // ตรวจสอบข้อมูล audit logs
    console.log('📋 ข้อมูลประวัติการใช้งาน (Audit Logs):');
    console.log('=' .repeat(50));
    
    const auditLogsRef = ref(database, 'auditLogs');
    const auditLogsSnapshot = await get(auditLogsRef);
    
    if (auditLogsSnapshot.exists()) {
      const auditLogsData = auditLogsSnapshot.val();
      const logCount = Object.keys(auditLogsData).length;
      console.log(`📊 จำนวนประวัติการใช้งาน: ${logCount} รายการ`);
      
      // แสดง 5 รายการล่าสุด
      const recentLogs = Object.entries(auditLogsData)
        .sort(([,a], [,b]) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
      
      console.log('\n🕒 ประวัติล่าสุด 5 รายการ:');
      recentLogs.forEach(([logId, logData], index) => {
        console.log(`   ${index + 1}. ${logData.action}`);
        console.log(`      ผู้ใช้: ${logData.userId}`);
        console.log(`      เวลา: ${new Date(logData.timestamp).toLocaleString('th-TH')}`);
        console.log(`      หมวดหมู่: ${logData.category}`);
      });
    } else {
      console.log('❌ ไม่พบข้อมูลประวัติการใช้งานในระบบ');
    }
    
    console.log('\n✅ การตรวจสอบข้อมูลเสร็จสิ้น!');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการตรวจสอบข้อมูล:', error);
  }
}

// เรียกใช้ฟังก์ชัน
checkFirebaseData();