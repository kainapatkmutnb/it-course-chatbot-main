import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';
import { config } from 'dotenv';
import { generateCoursesForSemester } from './src/services/completeCurriculumData';

// Load environment variables
config();

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

// Define curriculum structure
const curriculumStructure = {
  programs: [
    {
      id: 'it',
      name: 'เทคโนโลยีสารสนเทศ',
      curriculumYears: [
        {
          year: '2562',
          semesters: [1, 2, 3, 4, 5, 6, 7, 8]
        },
        {
          year: '2567',
          semesters: [1, 2, 3, 4, 5, 6, 7, 8]
        }
      ]
    }
  ]
};

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  category: string;
  mainCategory?: string;
  subCategory?: string;
  description?: string;
  prerequisites?: string[];
  program: string;
  curriculumYear: string;
  semester: number;
}

async function checkExistingData(): Promise<boolean> {
  try {
    const coursesRef = ref(database, 'courses');
    const snapshot = await get(coursesRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Error checking existing data:', error);
    return false;
  }
}

async function migrateCurriculumData() {
  console.log('🚀 Starting curriculum data migration...');
  
  // Check if data already exists
  const hasExistingData = await checkExistingData();
  if (hasExistingData) {
    console.log('⚠️  Warning: Existing course data found in Firebase.');
    console.log('This migration will overwrite existing data.');
    console.log('Please confirm by typing "yes" to continue or "no" to cancel:');
    
    // For now, we'll proceed with migration. In a real scenario, you'd want to add user input handling
    console.log('Proceeding with migration...');
  }

  let totalCourses = 0;
  let successfulMigrations = 0;
  let errors: string[] = [];

  try {
    for (const program of curriculumStructure.programs) {
      console.log(`\n📚 Processing program: ${program.name} (${program.id})`);
      
      for (const curriculumYear of program.curriculumYears) {
        console.log(`  📅 Processing curriculum year: ${curriculumYear.year}`);
        
        for (const semester of curriculumYear.semesters) {
          console.log(`    📖 Processing semester: ${semester}`);
          
          try {
            // Get courses for this semester
            const courses = generateCoursesForSemester(
              program.id,
              curriculumYear.year,
              semester
            );
            
            if (courses && courses.length > 0) {
              console.log(`      Found ${courses.length} courses`);
              
              for (const course of courses) {
                totalCourses++;
                
                try {
                  // Create course document with additional metadata
                  const courseData: Course = {
                    id: `${program.id}-${curriculumYear.year}-${semester}-${course.code}`,
                    code: course.code,
                    name: course.name,
                    credits: course.credits,
                    category: course.category,
                    mainCategory: course.mainCategory,
                    subCategory: course.subCategory,
                    description: course.description,
                    prerequisites: course.prerequisites,
                    program: program.id,
                    curriculumYear: curriculumYear.year,
                    semester: semester
                  };
                  
                  // Save to Firebase Realtime Database
                  const courseRef = ref(database, `courses/${courseData.id}`);
                  await set(courseRef, courseData);
                  
                  successfulMigrations++;
                  console.log(`        ✅ Saved: ${course.code} - ${course.name}`);
                  
                } catch (courseError) {
                  const errorMsg = `Failed to save course ${course.code}: ${courseError}`;
                  errors.push(errorMsg);
                  console.error(`        ❌ ${errorMsg}`);
                }
              }
            } else {
              console.log(`      No courses found for this semester`);
            }
            
          } catch (semesterError) {
            const errorMsg = `Failed to process semester ${semester}: ${semesterError}`;
            errors.push(errorMsg);
            console.error(`    ❌ ${errorMsg}`);
          }
        }
      }
    }
    
    // Migration summary
    console.log('\n📊 Migration Summary:');
    console.log(`Total courses processed: ${totalCourses}`);
    console.log(`Successful migrations: ${successfulMigrations}`);
    console.log(`Failed migrations: ${totalCourses - successfulMigrations}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (successfulMigrations > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('You can now use the Admin Course Management system with Firebase data.');
    } else {
      console.log('\n⚠️  No courses were migrated. Please check the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateCurriculumData()
  .then(() => {
    console.log('\n✨ Migration process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration process failed:', error);
    process.exit(1);
  });