const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, push } = require('firebase/database');
require('dotenv').config();

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Sample data
const sampleDepartments = [
  {
    id: 'it',
    name: 'เทคโนโลยีสารสนเทศ',
    code: 'IT',
    description: 'สาขาวิชาเทคโนโลยีสารสนเทศ คณะเทคโนโลยีสารสนเทศ',
    curricula: [
      {
        id: 'it-62-coop',
        name: 'หลักสูตรเทคโนโลยีสารสนเทศ 2562 (สหกิจ)',
        year: 2562,
        totalCredits: 140,
        departmentId: 'it',
        isActive: true,
        semesters: []
      }
    ]
  }
];

const sampleCourses = [
  {
    code: 'IT-060243102',
    name: 'การโปรแกรมคอมพิวเตอร์',
    credits: 3,
    category: 'core',
    mainCategory: 'หมวดวิชาเฉพาะ',
    subCategory: 'กลุ่มวิชาแกน',
    description: 'ภาษาที่ใช้ในการพัฒนาโปรแกรมในเชิงโครงสร้าง คำสั่ง ประเภทข้อมูล ตัวแปร ตัวดำเนินการ โครงสร้างการตัดสินใจ โครงสร้างการวนรอบ ฟังก์ชันและฟังก์ชันแบบกำหนดเอง อาร์เรย์ แฟ้มข้อมูล และการฝึกปฏิบัติเขียนโปรแกรมคอมพิวเตอร์',
    isActive: true,
    semester: 1,
    year: 1,
    prerequisites: []
  },
  {
    code: 'IT-080103001',
    name: 'ภาษาอังกฤษ 1',
    credits: 3,
    category: 'general',
    mainCategory: 'หมวดวิชาศึกษาทั่วไป',
    subCategory: 'กลุ่มวิชาภาษา',
    description: 'การบูรณาการทักษะการฟัง การพูด การอ่าน และการเขียนในระดับพื้นฐาน เพื่อประยุกต์ใช้ในชีวิตประจำวันโดยคำนึงถึงความหลากหลายทางวัฒนธรรมของการใช้ภาษา',
    isActive: true,
    semester: 1,
    year: 1,
    prerequisites: []
  },
  {
    code: 'IT-060243103',
    name: 'การแก้ปัญหาทางด้านเทคโนโลยีสารสนเทศ',
    credits: 3,
    category: 'core',
    mainCategory: 'หมวดวิชาเฉพาะ',
    subCategory: 'กลุ่มวิชาแกน',
    description: 'กลยุทธ์และหลักการแก้ปัญหา การคิดแบบขั้นตอนวิธี ผังงาน การใช้เหตุผลและการแก้ปัญหาด้วยตรรกศาสตร์',
    isActive: true,
    semester: 1,
    year: 1,
    prerequisites: []
  },
  {
    code: 'IT-060243104',
    name: 'การเขียนโปรแกรมเชิงวัตถุ',
    credits: 3,
    category: 'core',
    mainCategory: 'หมวดวิชาเฉพาะ',
    subCategory: 'กลุ่มวิชาแกน',
    description: 'ภาษาที่ใช้ในการพัฒนาโปรแกรมในเชิงวัตถุ หลักการเบื้องต้นของแนวคิดเชิงวัตถุ',
    isActive: true,
    semester: 2,
    year: 1,
    prerequisites: ['IT-060243103']
  },
  {
    code: 'IT-060243106',
    name: 'โครงสร้างข้อมูลและขั้นตอนวิธี',
    credits: 3,
    category: 'core',
    mainCategory: 'หมวดวิชาเฉพาะ',
    subCategory: 'กลุ่มวิชาแกน',
    description: 'ข้อมูลแบบนามธรรม โครงสร้างข้อมูลเชิงวัตถุ ประสิทธิภาพการทำงานของโปรแกรม',
    isActive: true,
    semester: 1,
    year: 2,
    prerequisites: ['IT-060243102']
  }
];

const sampleStudyPlan = {
  studentId: 's6506022620052@email.kmutnb.ac.th',
  curriculum: 'หลักสูตรเทคโนโลยีสารสนเทศ 2562 (สหกิจ)',
  totalCredits: 140,
  completedCredits: 6,
  gpa: 3.25,
  courses: [
    {
      courseId: 'course1',
      code: 'IT-060243102',
      name: 'การโปรแกรมคอมพิวเตอร์',
      credits: 3,
      year: 1,
      semester: 1,
      status: 'completed',
      grade: 'A',
      type: 'required'
    },
    {
      courseId: 'course2',
      code: 'IT-080103001',
      name: 'ภาษาอังกฤษ 1',
      credits: 3,
      year: 1,
      semester: 1,
      status: 'completed',
      grade: 'B+',
      type: 'required'
    },
    {
      courseId: 'course3',
      code: 'IT-060243104',
      name: 'การเขียนโปรแกรมเชิงวัตถุ',
      credits: 3,
      year: 1,
      semester: 2,
      status: 'in_progress',
      type: 'required'
    },
    {
      courseId: 'course4',
      code: 'IT-060243106',
      name: 'โครงสร้างข้อมูลและขั้นตอนวิธี',
      credits: 3,
      year: 2,
      semester: 1,
      status: 'planned',
      type: 'required'
    }
  ]
};

async function initializeData() {
  try {
    console.log('Initializing Firebase data...');

    // Add departments
    console.log('Adding departments...');
    const departmentsRef = ref(database, 'departments');
    for (const dept of sampleDepartments) {
      const deptRef = push(departmentsRef);
      await set(deptRef, dept);
      console.log(`Added department: ${dept.name}`);
    }

    // Add courses
    console.log('Adding courses...');
    const coursesRef = ref(database, 'courses');
    for (const course of sampleCourses) {
      const courseRef = push(coursesRef);
      await set(courseRef, course);
      console.log(`Added course: ${course.name}`);
    }

    // Add study plan
    console.log('Adding study plan...');
    const studyPlansRef = ref(database, 'studyPlans');
    const studyPlanRef = push(studyPlansRef);
    const studyPlanWithTimestamp = {
      ...sampleStudyPlan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await set(studyPlanRef, studyPlanWithTimestamp);
    console.log(`Added study plan for student: ${sampleStudyPlan.studentId}`);

    // Add initial audit log
    console.log('Adding initial audit log...');
    const auditLogsRef = ref(database, 'auditLogs');
    const auditLogRef = push(auditLogsRef);
    await set(auditLogRef, {
      userId: 'system',
      action: 'System Initialization',
      details: 'Initial data setup completed',
      ipAddress: '127.0.0.1',
      category: 'system',
      timestamp: new Date().toISOString()
    });

    console.log('✅ Firebase data initialization completed successfully!');
    console.log('Data added:');
    console.log(`- ${sampleDepartments.length} departments`);
    console.log(`- ${sampleCourses.length} courses`);
    console.log('- 1 study plan');
    console.log('- 1 audit log');

  } catch (error) {
    console.error('❌ Error initializing Firebase data:', error);
  }
}

// Run the initialization
initializeData();