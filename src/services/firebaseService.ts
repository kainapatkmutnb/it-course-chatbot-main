import { db as database, auth } from '@/config/firebase';
import { ref, get, set, push, update, remove, onValue, off } from 'firebase/database';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'staff' | 'admin';
  profilePicture?: string;
  department?: string;
  studentId?: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  description: string;
  category: 'general' | 'core' | 'elective' | 'major' | 'free';
  mainCategory: string;
  subCategory: string;
  prerequisites?: string[];
  corequisites?: string[];
  semester?: number;
  year?: number;
  isActive: boolean;
  instructor?: string;
  maxStudents?: number;
  currentStudents?: number;
}

export interface StudyPlan {
  id: string;
  studentId: string;
  curriculum: string;
  totalCredits: number;
  completedCredits: number;
  gpa: number;
  courses: StudyPlanCourse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyPlanCourse {
  id: string;
  courseId: string;
  code: string;
  name: string;
  credits: number;
  year: number;
  semester: number;
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
  grade?: string;
  type: 'required' | 'elective';
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: Date;
  category: 'user' | 'course' | 'system' | 'auth';
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  curricula: Curriculum[];
}

export interface Curriculum {
  id: string;
  name: string;
  year: number;
  totalCredits: number;
  departmentId: string;
  semesters: CurriculumSemester[];
  isActive: boolean;
}

export interface CurriculumSemester {
  year: number;
  semester: number;
  courses: Course[];
}

// Firebase Service Class
class FirebaseService {
  // Users
  async getUsers(): Promise<User[]> {
    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        return Object.keys(usersData).map(key => ({
          id: key,
          ...usersData[key],
          createdAt: new Date(usersData[key].createdAt),
          lastLogin: usersData[key].lastLogin ? new Date(usersData[key].lastLogin) : undefined
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const userRef = ref(database, `users/${userId}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        return {
          id: userId,
          ...userData,
          createdAt: new Date(userData.createdAt),
          lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : undefined
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      const usersRef = ref(database, 'users');
      const newUserRef = push(usersRef);
      
      const userWithTimestamp = {
        ...userData,
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      await set(newUserRef, userWithTimestamp);
      return newUserRef.key;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<boolean> {
    try {
      const userRef = ref(database, `users/${userId}`);
      await update(userRef, updates);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const userRef = ref(database, `users/${userId}`);
      await remove(userRef);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Courses
  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const courseRef = ref(database, `courses/${courseId}`);
      const snapshot = await get(courseRef);
      
      if (snapshot.exists()) {
        return {
          id: courseId,
          ...snapshot.val()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching course:', error);
      return null;
    }
  }

  async createCourse(courseData: Omit<Course, 'id'>): Promise<string | null> {
    try {
      const coursesRef = ref(database, 'courses');
      const newCourseRef = push(coursesRef);
      
      await set(newCourseRef, courseData);
      return newCourseRef.key;
    } catch (error) {
      console.error('Error creating course:', error);
      return null;
    }
  }

  // Curriculum-specific course management
  async getCourses(program?: string, curriculumYear?: string, year?: number, semester?: number): Promise<Course[]> {
    try {
      let coursesRef;
      
      if (program && curriculumYear && year && semester) {
        // Get courses for specific curriculum path
        coursesRef = ref(database, `curriculum/${program}/${curriculumYear}/${year}/${semester}/courses`);
      } else {
        // Get all courses
        coursesRef = ref(database, 'courses');
      }
      
      const snapshot = await get(coursesRef);
      
      if (snapshot.exists()) {
        const coursesData = snapshot.val();
        return Object.keys(coursesData).map(key => ({
          id: key,
          ...coursesData[key]
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  }

  async addCourse(program: string, curriculumYear: string, year: number, semester: number, course: Course): Promise<boolean> {
    try {
      // Add to curriculum-specific path
      const curriculumCourseRef = ref(database, `curriculum/${program}/${curriculumYear}/${year}/${semester}/courses/${course.id}`);
      await set(curriculumCourseRef, course);
      
      // Also add to general courses collection for global access
      const generalCourseRef = ref(database, `courses/${course.id}`);
      await set(generalCourseRef, {
        ...course,
        program,
        curriculumYear,
        year,
        semester
      });
      
      return true;
    } catch (error) {
      console.error('Error adding course:', error);
      return false;
    }
  }

  async updateCourse(program: string, curriculumYear: string, year: number, semester: number, course: Course): Promise<boolean> {
    try {
      // Update in curriculum-specific path
      const curriculumCourseRef = ref(database, `curriculum/${program}/${curriculumYear}/${year}/${semester}/courses/${course.id}`);
      await update(curriculumCourseRef, course);
      
      // Update in general courses collection
      const generalCourseRef = ref(database, `courses/${course.id}`);
      await update(generalCourseRef, {
        ...course,
        program,
        curriculumYear,
        year,
        semester
      });
      
      return true;
    } catch (error) {
      console.error('Error updating course:', error);
      return false;
    }
  }

  async deleteCourse(program: string, curriculumYear: string, year: number, semester: number, courseId: string): Promise<boolean> {
    try {
      // Remove from curriculum-specific path
      const curriculumCourseRef = ref(database, `curriculum/${program}/${curriculumYear}/${year}/${semester}/courses/${courseId}`);
      await remove(curriculumCourseRef);
      
      // Remove from general courses collection
      const generalCourseRef = ref(database, `courses/${courseId}`);
      await remove(generalCourseRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      return false;
    }
  }

  // Study Plans
  async getStudyPlanByStudentId(studentId: string): Promise<StudyPlan | null> {
    try {
      const studyPlansRef = ref(database, 'studyPlans');
      const snapshot = await get(studyPlansRef);
      
      if (snapshot.exists()) {
        const studyPlansData = snapshot.val();
        const studyPlanKey = Object.keys(studyPlansData).find(
          key => studyPlansData[key].studentId === studentId
        );
        
        if (studyPlanKey) {
          const studyPlan = studyPlansData[studyPlanKey];
          return {
            id: studyPlanKey,
            ...studyPlan,
            createdAt: new Date(studyPlan.createdAt),
            updatedAt: new Date(studyPlan.updatedAt)
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching study plan:', error);
      return null;
    }
  }

  async createStudyPlan(studyPlanData: Omit<StudyPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const studyPlansRef = ref(database, 'studyPlans');
      const newStudyPlanRef = push(studyPlansRef);
      
      const studyPlanWithTimestamp = {
        ...studyPlanData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(newStudyPlanRef, studyPlanWithTimestamp);
      return newStudyPlanRef.key;
    } catch (error) {
      console.error('Error creating study plan:', error);
      return null;
    }
  }

  async updateStudyPlan(studyPlanId: string, updates: Partial<StudyPlan>): Promise<boolean> {
    try {
      const studyPlanRef = ref(database, `studyPlans/${studyPlanId}`);
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await update(studyPlanRef, updatesWithTimestamp);
      return true;
    } catch (error) {
      console.error('Error updating study plan:', error);
      return false;
    }
  }

  // Departments and Curricula
  async getDepartments(): Promise<Department[]> {
    try {
      const departmentsRef = ref(database, 'departments');
      const snapshot = await get(departmentsRef);
      
      if (snapshot.exists()) {
        const departmentsData = snapshot.val();
        return Object.keys(departmentsData).map(key => ({
          id: key,
          ...departmentsData[key]
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  }

  async getCurriculumById(curriculumId: string): Promise<Curriculum | null> {
    try {
      const curriculumRef = ref(database, `curricula/${curriculumId}`);
      const snapshot = await get(curriculumRef);
      
      if (snapshot.exists()) {
        return {
          id: curriculumId,
          ...snapshot.val()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching curriculum:', error);
      return null;
    }
  }

  // Audit Logs
  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    try {
      const auditLogsRef = ref(database, 'auditLogs');
      const snapshot = await get(auditLogsRef);
      
      if (snapshot.exists()) {
        const auditLogsData = snapshot.val();
        const logs = Object.keys(auditLogsData)
          .map(key => ({
            id: key,
            ...auditLogsData[key],
            timestamp: new Date(auditLogsData[key].timestamp)
          }))
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, limit);
        
        return logs;
      }
      return [];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }

  async createAuditLog(logData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<string | null> {
    try {
      const auditLogsRef = ref(database, 'auditLogs');
      const newLogRef = push(auditLogsRef);
      
      const logWithTimestamp = {
        ...logData,
        timestamp: new Date().toISOString()
      };
      
      await set(newLogRef, logWithTimestamp);
      return newLogRef.key;
    } catch (error) {
      console.error('Error creating audit log:', error);
      return null;
    }
  }

  // Statistics
  async getSystemStats() {
    try {
      const [users, courses, studyPlans, auditLogs] = await Promise.all([
        this.getUsers(),
        this.getCourses(),
        this.getStudyPlans(),
        this.getAuditLogs(10)
      ]);

      const activeUsers = users.filter(user => user.isActive).length;
      const activeCourses = courses.filter(course => course.isActive).length;
      const totalStudents = users.filter(user => user.role === 'student').length;

      return {
        totalUsers: users.length,
        activeUsers,
        totalCourses: courses.length,
        activeCourses,
        totalStudents,
        totalStudyPlans: studyPlans.length,
        recentActivities: auditLogs.length
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalCourses: 0,
        activeCourses: 0,
        totalStudents: 0,
        totalStudyPlans: 0,
        recentActivities: 0
      };
    }
  }

  private async getStudyPlans(): Promise<StudyPlan[]> {
    try {
      const studyPlansRef = ref(database, 'studyPlans');
      const snapshot = await get(studyPlansRef);
      
      if (snapshot.exists()) {
        const studyPlansData = snapshot.val();
        return Object.keys(studyPlansData).map(key => ({
          id: key,
          ...studyPlansData[key],
          createdAt: new Date(studyPlansData[key].createdAt),
          updatedAt: new Date(studyPlansData[key].updatedAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching study plans:', error);
      return [];
    }
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
export default firebaseService;