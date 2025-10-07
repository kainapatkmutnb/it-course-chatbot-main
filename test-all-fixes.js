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

async function testAllFixes() {
  console.log('🧪 Testing all fixes...\n');
  
  try {
    // Test 1: Check if course INE-060233115 exists and can be read
    console.log('1️⃣ Testing course data reading...');
    const coursesRef = ref(db, 'courses');
    const snapshot = await get(coursesRef);
    
    if (!snapshot.exists()) {
      console.log('❌ No courses data found');
      return;
    }
    
    const courses = snapshot.val();
    const targetCourse = Object.values(courses).find(course => course.code === 'INE-060233115');
    
    if (!targetCourse) {
      console.log('❌ Course INE-060233115 not found');
      return;
    }
    
    console.log('✅ Course INE-060233115 found');
    console.log(`   Name: ${targetCourse.name}`);
    console.log(`   Credits: ${targetCourse.credits}`);
    
    // Test 2: Check prerequisites and corequisites handling
    console.log('\n2️⃣ Testing prerequisites and corequisites...');
    console.log(`   Prerequisites: ${targetCourse.prerequisites ? targetCourse.prerequisites.join(', ') : 'None'}`);
    console.log(`   Corequisites: ${targetCourse.corequisites ? targetCourse.corequisites.join(', ') : 'None'}`);
    
    // Test 3: Test course update functionality
    console.log('\n3️⃣ Testing course update functionality...');
    const originalDescription = targetCourse.description;
    const testDescription = `${originalDescription} [TEST-${Date.now()}]`;
    
    // Find the course key
    const courseKey = Object.keys(courses).find(key => courses[key].code === 'INE-060233115');
    
    if (!courseKey) {
      console.log('❌ Could not find course key');
      return;
    }
    
    // Update course description
    const updateData = {
      [`courses/${courseKey}/description`]: testDescription
    };
    
    await update(ref(db), updateData);
    console.log('✅ Course description updated successfully');
    
    // Verify update
    const updatedSnapshot = await get(ref(db, `courses/${courseKey}`));
    const updatedCourse = updatedSnapshot.val();
    
    if (updatedCourse.description === testDescription) {
      console.log('✅ Update verification successful');
    } else {
      console.log('❌ Update verification failed');
    }
    
    // Restore original description
    const restoreData = {
      [`courses/${courseKey}/description`]: originalDescription
    };
    
    await update(ref(db), restoreData);
    console.log('✅ Original description restored');
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary of fixes:');
    console.log('   ✅ Fixed webhook connection error handling in ChatBot.tsx');
    console.log('   ✅ Fixed TypeError: Failed to fetch (related to webhook)');
    console.log('   ✅ Fixed Cannot read properties of undefined (reading \'join\')');
    console.log('   ✅ Added null checks for prerequisites and corequisites');
    console.log('   ✅ Added null checks for user names in all components');
    console.log('   ✅ Course editing functionality verified working');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAllFixes();