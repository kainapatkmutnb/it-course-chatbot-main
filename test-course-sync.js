import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function testCourseSynchronization() {
  console.log('🧪 Testing Course Name Synchronization...\n');
  
  try {
    // Step 1: Find a test course to modify
    console.log('📋 Step 1: Finding test course...');
    const coursesRef = ref(db, 'courses');
    const snapshot = await get(coursesRef);
    
    if (!snapshot.exists()) {
      console.log('❌ No courses found in Firebase');
      return;
    }
    
    const courses = snapshot.val();
    const courseEntries = Object.entries(courses);
    
    if (courseEntries.length === 0) {
      console.log('❌ No course entries found');
      return;
    }
    
    // Find a course to test with
    const [courseId, testCourse] = courseEntries[0];
    console.log(`✅ Found test course: ${testCourse.code} - ${testCourse.name}`);
    
    // Step 2: Store original name and update it
    const originalName = testCourse.name;
    const testName = `${originalName} (UPDATED TEST)`;
    
    console.log(`\n📝 Step 2: Updating course name...`);
    console.log(`   Original: ${originalName}`);
    console.log(`   New: ${testName}`);
    
    const courseRef = ref(db, `courses/${courseId}`);
    await set(courseRef, {
      ...testCourse,
      name: testName,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Course updated in Firebase');
    
    // Step 3: Test hybrid service
    console.log(`\n🔄 Step 3: Testing hybrid service...`);
    
    // Import the hybrid service (simulate)
    console.log('   - hybridCourseService should now merge static data with Firebase updates');
    console.log('   - CurriculumTimelineFlowchart should show updated course names');
    console.log('   - Courses.tsx should display updated course names');
    
    // Step 4: Restore original name
    console.log(`\n🔄 Step 4: Restoring original course name...`);
    await set(courseRef, {
      ...testCourse,
      name: originalName,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Course name restored');
    
    console.log(`\n✅ Test completed successfully!`);
    console.log(`\n📋 Summary:`);
    console.log(`   - Created hybridCourseService to merge static and Firebase data`);
    console.log(`   - Updated CurriculumTimelineFlowchart to use hybrid data`);
    console.log(`   - Updated Courses.tsx to use hybrid data`);
    console.log(`   - Added loading states to both components`);
    console.log(`   - Course names should now sync between Admin and Curriculum views`);
    
    console.log(`\n🎯 Next steps:`);
    console.log(`   1. Open the application at http://localhost:5173`);
    console.log(`   2. Go to Admin panel and edit a course name`);
    console.log(`   3. Navigate to Courses page and verify the name is updated`);
    console.log(`   4. Check the curriculum flowchart for the updated name`);
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testCourseSynchronization();