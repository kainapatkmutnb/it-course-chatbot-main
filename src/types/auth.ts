export type UserRole = 'student' | 'instructor' | 'staff' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profilePicture?: string;
  studentId?: string; // For students
  employeeId?: string; // For staff/instructors
  department?: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  studentId?: string;
  employeeId?: string;
  department?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Role permissions
export const ROLE_PERMISSIONS = {
  student: [
    'view_courses',
    'view_curriculum',
    'manage_study_plan',
    'use_chatbot',
    'view_profile',
    'edit_profile'
  ],
  instructor: [
    'view_courses',
    'view_curriculum',
    'view_students',
    'view_student_progress',
    'use_chatbot',
    'view_profile',
    'edit_profile'
  ],
  staff: [
    'view_courses',
    'view_curriculum',
    'manage_course_prerequisites',
    'view_students',
    'view_student_progress',
    'use_chatbot',
    'view_profile',
    'edit_profile'
  ],
  admin: [
    'view_courses',
    'view_curriculum',
    'manage_courses',
    'manage_curriculum',
    'manage_users',
    'manage_roles',
    'view_audit_logs',
    'system_settings',
    'use_chatbot',
    'view_profile',
    'edit_profile'
  ]
} as const;

// Helper function to check permissions
export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  return ROLE_PERMISSIONS[userRole].includes(permission as any);
};

// Helper function to determine role from email domain
export const getRoleFromEmail = (email: string): UserRole => {
  if (!email.endsWith('@kmutnb.ac.th') && !email.endsWith('@email.kmutnb.ac.th')) {
    throw new Error('Only @kmutnb.ac.th or @email.kmutnb.ac.th email addresses are allowed');
  }

  // Specific admin users
  const adminEmails = [
    'admin@kmutnb.ac.th'
  ];
  
  if (adminEmails.includes(email.toLowerCase())) {
    return 'admin';
  }

  // Specific student users
  const studentEmails = [
    's6506022620052@email.kmutnb.ac.th'
  ];
  
  if (studentEmails.includes(email.toLowerCase())) {
    return 'student';
  }

  // Extract the part before @ to determine role
  const localPart = email.split('@')[0];
  
  // Simple role determination logic - can be customized
  if (localPart.startsWith('admin') || localPart.includes('admin')) {
    return 'admin';
  } else if (localPart.startsWith('staff') || localPart.includes('staff')) {
    return 'staff';
  } else if (localPart.startsWith('teacher') || localPart.startsWith('instructor') || localPart.includes('teacher')) {
    return 'instructor';
  } else {
    // Default to student for other email patterns
    return 'student';
  }
};