export type ChatIntentType =
  | 'course_info'           // ถามข้อมูลรายวิชา
  | 'prerequisite_check'    // ตรวจสอบวิชาบังคับก่อน
  | 'registration_advice'   // คำแนะนำการลงทะเบียน
  | 'gpa_inquiry'           // ถามเกรดเฉลี่ย/ผลการเรียน
  | 'curriculum_compare'    // เปรียบเทียบหลักสูตร
  | 'study_plan'            // แผนการเรียน
  | 'general_question'      // คำถามทั่วไป
  | 'greeting'              // ทักทาย
  | 'unknown';              // ไม่สามารถจำแนกได้

export interface ChatLog {
  id: string;
  sessionId: string;
  userId: string;
  userRole: 'student' | 'instructor' | 'staff' | 'admin' | 'guest';
  studentId?: string;
  userName?: string;
  userEmail?: string;
  query: string;
  response: string;
  intent: ChatIntentType | string;
  isSuccess: boolean;
  responseTimeMs: number;
  channel: 'web' | 'line' | 'api';
  timestamp: string; // ISO 8601 string
}

export interface ChatSessionSummary {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  messageCount: number;
  successCount: number;
  failureCount: number;
  channel: 'web' | 'line' | 'api';
}

export interface ChatAnalytics {
  totalMessages: number;
  totalSessions: number;
  successRate: number;
  averageResponseTimeMs: number;
  topIntents: { intent: string; count: number }[];
  messagesByHour: { hour: number; count: number }[];
  messagesByDate: { date: string; count: number }[];
  failedQueries: ChatLog[];
}
