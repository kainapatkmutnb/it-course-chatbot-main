import { useState, useEffect } from 'react';
import { firebaseService, User, Course, StudyPlan, AuditLog, Department } from '@/services/firebaseService';

// Hook for users data
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersData = await firebaseService.getUsers();
        setUsers(usersData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const refreshUsers = async () => {
    try {
      const usersData = await firebaseService.getUsers();
      setUsers(usersData);
    } catch (err) {
      setError('Failed to refresh users');
      console.error('Error refreshing users:', err);
    }
  };

  return { users, loading, error, refreshUsers };
};

// Hook for courses data
export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const coursesData = await firebaseService.getCourses();
        setCourses(coursesData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch courses');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const refreshCourses = async () => {
    try {
      const coursesData = await firebaseService.getCourses();
      setCourses(coursesData);
    } catch (err) {
      setError('Failed to refresh courses');
      console.error('Error refreshing courses:', err);
    }
  };

  return { courses, loading, error, refreshCourses };
};

// Hook for study plan data
export const useStudyPlan = (studentId: string) => {
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    const fetchStudyPlan = async () => {
      try {
        setLoading(true);
        const studyPlanData = await firebaseService.getStudyPlanByStudentId(studentId);
        setStudyPlan(studyPlanData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch study plan');
        console.error('Error fetching study plan:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudyPlan();
  }, [studentId]);

  const refreshStudyPlan = async () => {
    if (!studentId) return;
    
    try {
      const studyPlanData = await firebaseService.getStudyPlanByStudentId(studentId);
      setStudyPlan(studyPlanData);
    } catch (err) {
      setError('Failed to refresh study plan');
      console.error('Error refreshing study plan:', err);
    }
  };

  return { studyPlan, loading, error, refreshStudyPlan };
};

// Hook for student's GPA and credits data from Firebase
export const useStudentGPAAndCredits = (studentId: string) => {
  const [data, setData] = useState<{ gpa: number; totalCredits: number; completedCredits: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    const fetchGPAAndCredits = async () => {
      try {
        setLoading(true);
        const gpaAndCreditsData = await firebaseService.getStudentGPAAndCredits(studentId);
        setData(gpaAndCreditsData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch GPA and credits');
        console.error('Error fetching GPA and credits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGPAAndCredits();
  }, [studentId]);

  const refreshGPAAndCredits = async () => {
    if (!studentId) return;
    
    try {
      const gpaAndCreditsData = await firebaseService.getStudentGPAAndCredits(studentId);
      setData(gpaAndCreditsData);
    } catch (err) {
      setError('Failed to refresh GPA and credits');
      console.error('Error refreshing GPA and credits:', err);
    }
  };

  const updateGPAAndCredits = async (gpa: number, completedCredits: number) => {
    if (!studentId) return false;
    
    try {
      const success = await firebaseService.updateStudentGPAAndCredits(studentId, gpa, completedCredits);
      if (success) {
        // Refresh data after successful update
        await refreshGPAAndCredits();
      }
      return success;
    } catch (err) {
      setError('Failed to update GPA and credits');
      console.error('Error updating GPA and credits:', err);
      return false;
    }
  };

  return { 
    data, 
    loading, 
    error, 
    refreshGPAAndCredits, 
    updateGPAAndCredits,
    gpa: data?.gpa || 0,
    totalCredits: data?.totalCredits || 0,
    completedCredits: data?.completedCredits || 0
  };
};

// Hook for departments data
export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const departmentsData = await firebaseService.getDepartments();
        setDepartments(departmentsData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch departments');
        console.error('Error fetching departments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const refreshDepartments = async () => {
    try {
      const departmentsData = await firebaseService.getDepartments();
      setDepartments(departmentsData);
    } catch (err) {
      setError('Failed to refresh departments');
      console.error('Error refreshing departments:', err);
    }
  };

  return { departments, loading, error, refreshDepartments };
};

// Hook for audit logs data
export const useAuditLogs = (limit: number = 50) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        const auditLogsData = await firebaseService.getAuditLogs(limit);
        setAuditLogs(auditLogsData.logs);
        setError(null);
      } catch (err) {
        setError('Failed to fetch audit logs');
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [limit]);

  const refreshAuditLogs = async () => {
    try {
      const auditLogsData = await firebaseService.getAuditLogs(limit);
      setAuditLogs(auditLogsData.logs);
    } catch (err) {
      setError('Failed to refresh audit logs');
      console.error('Error refreshing audit logs:', err);
    }
  };

  return { auditLogs, loading, error, refreshAuditLogs };
};

// Hook for system statistics
export const useSystemStats = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0,
    totalStudyPlans: 0,
    recentActivities: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const statsData = await firebaseService.getSystemStats();
        setStats(statsData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch system stats');
        console.error('Error fetching system stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const refreshStats = async () => {
    try {
      const statsData = await firebaseService.getSystemStats();
      setStats(statsData);
    } catch (err) {
      setError('Failed to refresh system stats');
      console.error('Error refreshing system stats:', err);
    }
  };

  return { stats, loading, error, refreshStats };
};

// Hook for all study plans
export const useStudyPlans = () => {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudyPlans = async () => {
      try {
        setLoading(true);
        const studyPlansData = await firebaseService.getStudyPlans();
        setStudyPlans(studyPlansData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch study plans');
        console.error('Error fetching study plans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudyPlans();
  }, []);

  const refreshStudyPlans = async () => {
    try {
      const studyPlansData = await firebaseService.getStudyPlans();
      setStudyPlans(studyPlansData);
    } catch (err) {
      setError('Failed to refresh study plans');
      console.error('Error refreshing study plans:', err);
    }
  };

  return { studyPlans, loading, error, refreshStudyPlans };
};

// Hook for user by ID
export const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await firebaseService.getUserById(userId);
        setUser(userData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch user');
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const refreshUser = async () => {
    if (!userId) return;
    
    try {
      const userData = await firebaseService.getUserById(userId);
      setUser(userData);
    } catch (err) {
      setError('Failed to refresh user');
      console.error('Error refreshing user:', err);
    }
  };

  return { user, loading, error, refreshUser };
};

// Hook for course by ID
export const useCourse = (courseId: string) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const courseData = await firebaseService.getCourseById(courseId);
        setCourse(courseData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch course');
        console.error('Error fetching course:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const refreshCourse = async () => {
    if (!courseId) return;
    
    try {
      const courseData = await firebaseService.getCourseById(courseId);
      setCourse(courseData);
    } catch (err) {
      setError('Failed to refresh course');
      console.error('Error refreshing course:', err);
    }
  };

  return { course, loading, error, refreshCourse };
};