function cleanString(val: any): string {
  if (typeof val !== 'string') return val !== undefined && val !== null ? String(val) : '';
  return val.startsWith('=') ? val.substring(1).trim() : val.trim();
}

function normalizeLog(id: string, raw: any): ChatLog {
  const rawTimestamp = cleanString(raw?.timestamp);
  let timestamp = rawTimestamp;
  const d = new Date(rawTimestamp);
  if (isNaN(d.getTime())) {
    timestamp = new Date().toISOString();
  }

  const rawSuccess = typeof raw?.isSuccess === 'string' ? cleanString(raw.isSuccess) : raw?.isSuccess;
  const isSuccess = rawSuccess !== false && rawSuccess !== 'false' && rawSuccess !== '0';

  const rawResponseTime = cleanString(raw?.responseTimeMs);
  const responseTimeMs = Number(rawResponseTime) || 850;

  return {
    id,
    sessionId: cleanString(raw?.sessionId),
    userId: cleanString(raw?.userId),
    userName: cleanString(raw?.userName),
    userRole: (cleanString(raw?.userRole) as any) || 'guest',
    studentId: cleanString(raw?.studentId),
    query: cleanString(raw?.query),
    response: cleanString(raw?.response),
    intent: cleanString(raw?.intent) || 'unknown',
    isSuccess,
    responseTimeMs,
    channel: (cleanString(raw?.channel) as any) || 'web',
    timestamp
  };
}

class ChatLogService {
  /**
   * บันทึก Log การสนทนาลง Firebase Realtime Database ที่ /chatLogs
   */
  async createChatLog(logData: Omit<ChatLog, 'id' | 'timestamp'> & { timestamp?: string }): Promise<string | null> {
    try {
      const logsRef = ref(database, 'chatLogs');
      const newLogRef = push(logsRef);

      const record: Omit<ChatLog, 'id'> = {
        ...logData,
        timestamp: logData.timestamp || new Date().toISOString()
      };

      await set(newLogRef, record);
      return newLogRef.key;
    } catch (error) {
      console.error('Error creating chat log:', error);
      return null;
    }
  }

  /**
   * ดึงรายการ Chat Logs ทั้งหมด หรือกรองตามเงื่อนไข
   */
  async getChatLogs(options: {
    limit?: number;
    page?: number;
    userId?: string;
    intent?: string;
    isSuccess?: boolean;
  } = {}): Promise<{ logs: ChatLog[]; totalCount: number; totalPages: number }> {
    try {
      const { limit = 50, page = 1, userId, intent, isSuccess } = options;
      const logsRef = ref(database, 'chatLogs');
      const snapshot = await get(logsRef);

      if (!snapshot.exists()) {
        return { logs: [], totalCount: 0, totalPages: 0 };
      }

      const rawData = snapshot.val();
      let allLogs: ChatLog[] = Object.keys(rawData).map(key => normalizeLog(key, rawData[key]));

      // Filter by userId
      if (userId) {
        allLogs = allLogs.filter(l => l.userId === userId);
      }

      // Filter by intent
      if (intent && intent !== 'all') {
        allLogs = allLogs.filter(l => l.intent === intent);
      }

      // Filter by isSuccess
      if (typeof isSuccess === 'boolean') {
        allLogs = allLogs.filter(l => l.isSuccess === isSuccess);
      }

      // Sort newest first
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const totalCount = allLogs.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const paginatedLogs = allLogs.slice(startIndex, startIndex + limit);

      return { logs: paginatedLogs, totalCount, totalPages };
    } catch (error) {
      console.error('Error fetching chat logs:', error);
      return { logs: [], totalCount: 0, totalPages: 0 };
    }
  }

  /**
   * คำนวณข้อมูลสถิติภาพรวมสำหรับการแสดงผลบน Dashboard (Analytics)
   */
  async getAnalytics(days: number = 30): Promise<ChatAnalytics> {
    try {
      const logsRef = ref(database, 'chatLogs');
      const snapshot = await get(logsRef);

      const emptyAnalytics: ChatAnalytics = {
        totalMessages: 0,
        totalSessions: 0,
        successRate: 100,
        averageResponseTimeMs: 0,
        topIntents: [],
        messagesByHour: Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 })),
        messagesByDate: [],
        failedQueries: []
      };

      if (!snapshot.exists()) {
        return emptyAnalytics;
      }

      const rawData = snapshot.val();
      const allLogs: ChatLog[] = Object.keys(rawData).map(key => normalizeLog(key, rawData[key]));

      // Filter by time window if specified
      const cutoffTime = days > 0 ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;
      const filteredLogs = allLogs.filter(l => new Date(l.timestamp).getTime() >= cutoffTime);

      if (filteredLogs.length === 0) {
        return emptyAnalytics;
      }

      // 1. KPI Calculations
      const totalMessages = filteredLogs.length;
      const successCount = filteredLogs.filter(l => l.isSuccess).length;
      const successRate = totalMessages > 0 ? (successCount / totalMessages) * 100 : 0;
      
      const totalResponseTime = filteredLogs.reduce((acc, l) => acc + (l.responseTimeMs || 0), 0);
      const averageResponseTimeMs = totalMessages > 0 ? Math.round(totalResponseTime / totalMessages) : 0;

      // Unique sessions
      const sessionSet = new Set(filteredLogs.map(l => l.sessionId).filter(Boolean));
      const totalSessions = sessionSet.size || totalMessages;

      // 2. Top Intents
      const intentCountMap: Record<string, number> = {};
      filteredLogs.forEach(l => {
        const intent = l.intent || 'unknown';
        intentCountMap[intent] = (intentCountMap[intent] || 0) + 1;
      });

      const topIntents = Object.entries(intentCountMap)
        .map(([intent, count]) => ({ intent, count }))
        .sort((a, b) => b.count - a.count);

      // 3. Messages by Hour (0 - 23)
      const hourCounts = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
      filteredLogs.forEach(l => {
        const hour = new Date(l.timestamp).getHours();
        if (hour >= 0 && hour < 24) {
          hourCounts[hour].count++;
        }
      });

      // 4. Messages by Date
      const dateCountMap: Record<string, number> = {};
      filteredLogs.forEach(l => {
        const d = new Date(l.timestamp);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dateCountMap[dateKey] = (dateCountMap[dateKey] || 0) + 1;
      });

      const messagesByDate = Object.entries(dateCountMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // 5. Failed Queries (Fallback list)
      const failedQueries = filteredLogs
        .filter(l => !l.isSuccess)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);

      return {
        totalMessages,
        totalSessions,
        successRate,
        averageResponseTimeMs,
        topIntents,
        messagesByHour: hourCounts,
        messagesByDate,
        failedQueries
      };
    } catch (error) {
      console.error('Error calculating chat analytics:', error);
      return {
        totalMessages: 0,
        totalSessions: 0,
        successRate: 0,
        averageResponseTimeMs: 0,
        topIntents: [],
        messagesByHour: [],
        messagesByDate: [],
        failedQueries: []
      };
    }
  }

  /**
   * PDPA / GDPR: ลบประวัติการแชททั้งหมดของผู้ใช้รายบุคคล (Right to Erasure)
   */
  async deleteChatLogsByUser(userId: string): Promise<boolean> {
    try {
      if (!userId) return false;
      const logsRef = ref(database, 'chatLogs');
      const snapshot = await get(logsRef);

      if (!snapshot.exists()) return true;

      const rawData = snapshot.val();
      const keysToDelete = Object.keys(rawData).filter(k => rawData[k]?.userId === userId);

      await Promise.all(keysToDelete.map(k => remove(ref(database, `chatLogs/${k}`))));
      return true;
    } catch (error) {
      console.error('Error deleting user chat logs:', error);
      return false;
    }
  }

  /**
   * ลบ Log รายการเดี่ยว
   */
  async deleteChatLog(logId: string): Promise<boolean> {
    try {
      const logRef = ref(database, `chatLogs/${logId}`);
      await remove(logRef);
      return true;
    } catch (error) {
      console.error('Error deleting chat log:', error);
      return false;
    }
  }
}

export const chatLogService = new ChatLogService();
export default chatLogService;
