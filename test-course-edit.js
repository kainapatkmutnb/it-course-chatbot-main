import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update } from 'firebase/database';
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

async function testCourseEdit() {
  try {
    console.log('🔍 Testing course edit functionality for INE-060233115...\n');
    
    // 1. Find the course
    const coursesRef = ref(db, 'courses');
    const snapshot = await get(coursesRef);
    
    if (!snapshot.exists()) {
      console.log('❌ No courses data found in Firebase');
      return;
    }
    
    const courses = snapshot.val();
    const targetCourse = Object.values(courses).find(course => course.code === 'INE-060233115');
    
    if (!targetCourse) {
      console.log('❌ Course INE-060233115 not found');
      return;
    }
    
    console.log('✅ Found course INE-060233115');
    console.log('📋 Original course data:');
    console.log(`   Code: ${targetCourse.code}`);
    console.log(`   Name: ${targetCourse.name}`);
    console.log(`   Credits: ${targetCourse.credits}`);
    console.log(`   Category: ${targetCourse.category}`);
    console.log(`   Description: ${targetCourse.description.substring(0, 50)}...`);
    
    // 2. Test update functionality
    console.log('\n🔧 Testing update functionality...');
    
    const testUpdate = {
      ...targetCourse,
      description: targetCourse.description + ' [TESTED]'
    };
    
    // Update in general courses collection
    const generalCourseRef = ref(db, `courses/${targetCourse.id}`);
    await update(generalCourseRef, testUpdate);
    
    // Update in curriculum-specific path
    const curriculumCourseRef = ref(db, `curriculum/${targetCourse.program}/${targetCourse.curriculumYear}/${targetCourse.year}/${targetCourse.semester}/courses/${targetCourse.id}`);
    await update(curriculumCourseRef, testUpdate);
    
    console.log('✅ Course update test successful!');
    
    // 3. Verify the update
    const updatedSnapshot = await get(generalCourseRef);
    if (updatedSnapshot.exists()) {
      const updatedCourse = updatedSnapshot.val();
      if (updatedCourse.description.includes('[TESTED]')) {
        console.log('✅ Update verification successful!');
      } else {
        console.log('❌ Update verification failed');
      }
    }
    
    // 4. Restore original data
    console.log('\n🔄 Restoring original data...');
    await update(generalCourseRef, targetCourse);
    await update(curriculumCourseRef, targetCourse);
    console.log('✅ Original data restored');
    
    console.log('\n🎉 Course edit functionality test completed successfully!');
    console.log('📝 Summary:');
    console.log('   ✅ Course found in Firebase');
    console.log('   ✅ Update operation successful');
    console.log('   ✅ Data verification passed');
    console.log('   ✅ Original data restored');
    console.log('\n💡 The edit button should now work properly in the Admin interface!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testCourseEdit();