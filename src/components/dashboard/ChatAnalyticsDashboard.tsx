import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Download,
  Search,
  Trash2,
  Sparkles,
  TrendingUp,
  HelpCircle,
  BarChart3,
  Bot,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { chatLogService } from '@/services/chatLogService';
import { ChatLog, ChatAnalytics } from '@/types/chatLog';
import { useToast } from '@/hooks/use-toast';

const INTENT_NAMES: Record<string, string> = {
  course_info: 'ข้อมูลรายวิชา',
  prerequisite_check: 'ตรวจวิชาบังคับก่อน',
  registration_advice: 'แนะนำการลงทะเบียน',
  gpa_inquiry: 'เกรดและผลการเรียน',
  curriculum_compare: 'เปรียบเทียบหลักสูตร',
  study_plan: 'แผนการเรียน',
  general_question: 'คำถามทั่วไป',
  greeting: 'ทักทาย',
  unknown: 'ไม่สามารถระบุได้'
};

const PIE_COLORS = ['#10b981', '#ef4444'];
const BAR_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#14b8a6', '#64748b'];

const ROLE_NAMES: Record<string, string> = {
  student: 'นักศึกษา',
  instructor: 'อาจารย์',
  staff: 'เจ้าหน้าที่',
  admin: 'ผู้ดูแลระบบ',
  guest: 'ผู้เยี่ยมชม'
};

const ChatAnalyticsDashboard: React.FC = () => {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<string>('30');
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null);
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIntentFilter, setSelectedIntentFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isGeneratingMock, setIsGeneratingMock] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const days = parseInt(timeRange, 10);
      const [analyticsData, logsData] = await Promise.all([
        chatLogService.getAnalytics(days),
        chatLogService.getChatLogs({
          limit: 15,
          page,
          intent: selectedIntentFilter !== 'all' ? selectedIntentFilter : undefined,
          isSuccess: selectedStatusFilter === 'success' ? true : selectedStatusFilter === 'failure' ? false : undefined
        })
      ]);

      setAnalytics(analyticsData);
      setLogs(logsData.logs);
      setTotalPages(logsData.totalPages || 1);
      setTotalCount(logsData.totalCount || 0);
    } catch (error) {
      console.error('Error loading chat analytics:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลสถิติแชทบอทได้',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [timeRange, page, selectedIntentFilter, selectedStatusFilter, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Seed sample data for testing
  const handleGenerateSampleLogs = async () => {
    setIsGeneratingMock(true);
    try {
      const sampleQueries = [
        { q: 'วิชา Data Structures ต้องผ่านวิชาอะไรมาก่อนไหมครับ?', r: 'วิชา 060163152 Data Structures ต้องผ่านวิชา 060163150 Computer Programming มาก่อนด้วยเกรด D ขึ้นไปครับ', intent: 'prerequisite_check', success: true },
        { q: 'เทอมหน้าแนะนำให้ลงวิชาอะไรบ้าง สำหรับเด็กปี 2 IT', r: 'สำหรับชั้นปีที่ 2 ภาคเรียนที่ 1 แนะนำลงวิชา Database Systems, Web Tech และ Operating Systems ครับ', intent: 'registration_advice', success: true },
        { q: 'ตอนนี้ GPA ผมเท่าไหร่ ขาดอีกกี่หน่วยกิตจะจบ', r: 'เกรดเฉลี่ยสะสมปัจจุบันของคุณคือ 3.25 ผ่านแล้ว 75 หน่วยกิต จากทั้งหมด 132 หน่วยกิตครับ', intent: 'gpa_inquiry', success: true },
        { q: 'หลักสูตร IT 62 กับ IT 67 ต่างกันยังไง', r: 'หลักสูตร IT 67 มีการปรับปรุงเนื้อหาสาย AI/Cloud และลดหน่วยกิตวิชาศึกษาทั่วไปลงเล็กน้อยครับ', intent: 'curriculum_compare', success: true },
        { q: 'วิชา AI สอนห้องไหนเวลาอะไร', r: 'ขออภัยครับ ระบบแชทบอทมีข้อมูลเฉพาะโครงสร้างหลักสูตรและเงื่อนไขรายวิชา ไม่พบตารางเรียนห้องบรรยาย กรุณาตรวจสอบที่ Reg KMUTNB ครับ', intent: 'course_info', success: false },
        { q: 'สวัสดีครับบอท', r: 'สวัสดีครับ! ผมคือ AI Assistant ประจำภาควิชา IT มีอะไรเกี่ยวกับหลักสูตรให้ช่วยเหลือสอบถามได้เลยครับ', intent: 'greeting', success: true },
        { q: 'ถอนวิชาได้ถึงวันไหน', r: 'ขออภัยครับ ไม่พบข้อมูลกำหนดการถอนรายวิชาในระบบ กรุณาตรวจสอบปฏิทินการศึกษาของมหาวิทยาลัยครับ', intent: 'general_question', success: false },
        { q: 'วิชา Advanced Database มีเปิดในเทอม 2 ไหม', r: 'วิชา Advanced Database Systems (060163254) เป็นวิชาเลือกเฉพาะกลุ่ม เปิดสอนในชั้นปีที่ 3 ภาคการศึกษาที่ 2 ครับ', intent: 'course_info', success: true },
        { q: 'อยากย้ายไปเรียนแผนสหกิจศึกษาต้องทำยังไง', r: 'การเลือกแผนสหกิจศึกษาต้องมีหน่วยกิตสะสมไม่น้อยกว่า 90 หน่วยกิต และ GPA ไม่ต่ำกว่า 2.00 ครับ', intent: 'study_plan', success: true },
        { q: 'ขอยืมโน้ตบุ๊กภาควิชาได้ที่ไหน', r: 'ขออภัยครับ ข้อมูลการยืมอุปกรณ์ไม่ได้อยู่ในฐานข้อมูลหลักสูตร กรุณาติดต่อธุรการภาควิชาชั้น 4 ครับ', intent: 'unknown', success: false }
      ];

      const roles: Array<'student' | 'instructor' | 'guest'> = ['student', 'student', 'student', 'guest', 'instructor'];

      for (let i = 0; i < 15; i++) {
        const item = sampleQueries[i % sampleQueries.length];
        const randomRole = roles[i % roles.length];
        const randomDaysAgo = Math.floor(Math.random() * 14);
        const logDate = new Date(Date.now() - randomDaysAgo * 24 * 60 * 60 * 1000 - Math.random() * 3600000);

        await chatLogService.createChatLog({
          sessionId: `sess_${1000 + (i % 5)}`,
          userId: randomRole === 'guest' ? 'guest' : `user_sample_${i % 3}`,
          userRole: randomRole,
          userName: randomRole === 'guest' ? 'ผู้เยี่ยมชม' : `นักศึกษาทดสอบ ${i + 1}`,
          ...(randomRole === 'student' ? { studentId: `650602262${1000 + i}` } : {}),
          query: item.q,
          response: item.r,
          intent: item.intent,
          isSuccess: item.success,
          responseTimeMs: Math.floor(600 + Math.random() * 1800),
          channel: 'web',
          timestamp: logDate.toISOString()
        });
      }

      toast({
        title: 'สร้างข้อมูลจำลองสำเร็จ',
        description: 'เพิ่ม 15 ตัวอย่าง Chat Logs สำหรับการทดสอบและวิเคราะห์สถิติเรียบร้อยแล้ว'
      });

      await loadData();
    } catch (error) {
      console.error('Error generating sample logs:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้างข้อมูลจำลองได้',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingMock(false);
    }
  };

  // Export to CSV with Executive Summary and formatted columns
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);

      // Fetch all matching logs according to current filters
      const exportData = await chatLogService.getChatLogs({
        limit: 10000,
        page: 1,
        intent: selectedIntentFilter,
        isSuccess: selectedStatusFilter === 'success' ? true : selectedStatusFilter === 'failure' ? false : undefined
      });

      let exportLogs = exportData.logs;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        exportLogs = exportLogs.filter(l =>
          (l.query && l.query.toLowerCase().includes(term)) ||
          (l.response && l.response.toLowerCase().includes(term)) ||
          (l.userName && l.userName.toLowerCase().includes(term)) ||
          (l.studentId && l.studentId.includes(term))
        );
      }

      if (exportLogs.length === 0) {
        toast({
          title: 'ไม่มีข้อมูล',
          description: 'ไม่มีรายการ Log สำหรับส่งออกตามเงื่อนไขที่เลือก',
          variant: 'destructive'
        });
        return;
      }

      // Calculate executive summary metrics
      const totalCount = exportLogs.length;
      const successCount = exportLogs.filter(l => l.isSuccess).length;
      const failureCount = totalCount - successCount;
      const successRate = ((successCount / totalCount) * 100).toFixed(2);
      const fallbackRate = ((failureCount / totalCount) * 100).toFixed(2);
      const avgResponseTime = (
        exportLogs.reduce((acc, l) => acc + (Number(l.responseTimeMs) || 850), 0) / totalCount / 1000
      ).toFixed(2);

      const now = new Date();
      const exportDateStr = now.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const timeRangeText = timeRange === '0' ? 'ข้อมูลทั้งหมด (All Time)' : `ย้อนหลัง ${timeRange} วัน`;

      // 1. Summary Header Block
      const summaryRows = [
        ['"=== รายงานสถิติและประวัติการสนทนา IT Course Chatbot ==="'],
        [`"วันที่ออกรายงาน:"`, `"${exportDateStr}"`],
        [`"ช่วงเวลาข้อมูล:"`, `"${timeRangeText}"`],
        [`"จำนวนข้อความทั้งหมด:"`, `"${totalCount} ข้อความ"`],
        [`"อัตราการตอบสำเร็จ (Success Rate):"`, `"${successRate}% (${successCount} ข้อความ)"`],
        [`"อัตราการตอบไม่ได้ (Fallback Rate):"`, `"${fallbackRate}% (${failureCount} ข้อความ)"`],
        [`"เวลาตอบสนองเฉลี่ย:"`, `"${avgResponseTime} วินาที"`],
        [''] // Blank separator
      ];

      // 2. Data Table Columns
      const tableHeaders = [
        'ลำดับ',
        'วันที่-เวลา',
        'ชื่อผู้ใช้งาน',
        'รหัสนักศึกษา',
        'บทบาท',
        'หมวดหมู่คำถาม',
        'สถานะการตอบ',
        'เวลาตอบสนอง (วินาที)',
        'คำถามของผู้ใช้',
        'คำตอบของบอท'
      ];

      // 3. Formatted Data Rows
      const padZero = (n: number) => String(n).padStart(2, '0');
      const dataRows = exportLogs.map((l, index) => {
        const d = new Date(l.timestamp);
        let formattedDate = '';
        if (isNaN(d.getTime())) {
          const nowTime = new Date();
          formattedDate = `${nowTime.getFullYear()}-${padZero(nowTime.getMonth() + 1)}-${padZero(nowTime.getDate())} ${padZero(nowTime.getHours())}:${padZero(nowTime.getMinutes())}:${padZero(nowTime.getSeconds())}`;
        } else {
          formattedDate = `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())} ${padZero(d.getHours())}:${padZero(d.getMinutes())}:${padZero(d.getSeconds())}`;
        }

        const roleText = ROLE_NAMES[l.userRole] || l.userRole || 'ผู้เยี่ยมชม';
        const intentText = INTENT_NAMES[l.intent] || l.intent || 'ทั่วไป';
        const statusText = l.isSuccess ? 'สำเร็จ' : 'ตอบไม่ได้';
        const respTime = (Number(l.responseTimeMs || 850) / 1000).toFixed(2);

        // Sanitize multi-line query/response for clean CSV output
        const cleanQuery = (l.query || '').replace(/\r?\n/g, ' ').replace(/"/g, '""').trim();
        const cleanResponse = (l.response || '').replace(/\r?\n/g, '  |  ').replace(/"/g, '""').trim();

        const studentIdVal = l.studentId && l.studentId !== '-' ? `="` + l.studentId + `"` : `"-"`;

        return [
          index + 1,
          `="` + formattedDate + `"`, // Force Excel text format so it never displays as ########
          `"${(l.userName || l.userId || 'Guest').replace(/"/g, '""')}"`,
          studentIdVal,               // Force Excel text format so student ID never shows as 6.51E+12
          `"${roleText}"`,
          `"${intentText}"`,
          `"${statusText}"`,
          respTime,
          `"${cleanQuery}"`,
          `"${cleanResponse}"`
        ];
      });

      const csvContent =
        '\uFEFF' +
        summaryRows.map(r => r.join(',')).join('\n') +
        '\n' +
        tableHeaders.map(h => `"${h}"`).join(',') +
        '\n' +
        dataRows.map(r => r.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);

      const fileDateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      link.setAttribute('download', `chatbot_analytics_${fileDateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'ส่งออกรายงานสำเร็จ 🎉',
        description: `ดาวน์โหลดไฟล์ CSV สรุปสถิติเรียบร้อยแล้ว (${totalCount} รายการ)`
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถส่งออกไฟล์ CSV ได้',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Multi-Sheet Formatted Excel (.xlsx)
  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);

      // Fetch all matching logs
      const exportData = await chatLogService.getChatLogs({
        limit: 10000,
        page: 1,
        intent: selectedIntentFilter,
        isSuccess: selectedStatusFilter === 'success' ? true : selectedStatusFilter === 'failure' ? false : undefined
      });

      let exportLogs = exportData.logs;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        exportLogs = exportLogs.filter(l =>
          (l.query && l.query.toLowerCase().includes(term)) ||
          (l.response && l.response.toLowerCase().includes(term)) ||
          (l.userName && l.userName.toLowerCase().includes(term)) ||
          (l.studentId && l.studentId.includes(term))
        );
      }

      if (exportLogs.length === 0) {
        toast({
          title: 'ไม่มีข้อมูล',
          description: 'ไม่มีรายการ Log สำหรับส่งออกตามเงื่อนไขที่เลือก',
          variant: 'destructive'
        });
        return;
      }

      const totalCount = exportLogs.length;
      const successCount = exportLogs.filter(l => l.isSuccess).length;
      const failureCount = totalCount - successCount;
      const successRate = ((successCount / totalCount) * 100).toFixed(2);
      const fallbackRate = ((failureCount / totalCount) * 100).toFixed(2);
      const avgResponseTime = (
        exportLogs.reduce((acc, l) => acc + (Number(l.responseTimeMs) || 850), 0) / totalCount / 1000
      ).toFixed(2);

      const now = new Date();
      const exportDateStr = now.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      const timeRangeText = timeRange === '0' ? 'ข้อมูลทั้งหมด (All Time)' : `ย้อนหลัง ${timeRange} วัน`;

      const wb = XLSX.utils.book_new();

      // ==========================================
      // SHEET 1: สรุปสถิติ & ประวัติการสนทนา
      // ==========================================
      const summaryBlock = [
        ['รายงานสถิติและประวัติการสนทนา IT Course Chatbot (KMUTNB)'],
        ['วันที่ออกรายงาน:', exportDateStr],
        ['ช่วงเวลาข้อมูล:', timeRangeText],
        ['จำนวนข้อความทั้งหมด:', `${totalCount} ข้อความ`],
        ['อัตราการตอบสำเร็จ (Success Rate):', `${successRate}% (${successCount} ข้อความ)`],
        ['อัตราการตอบไม่ได้ (Fallback Rate):', `${fallbackRate}% (${failureCount} ข้อความ)`],
        ['เวลาตอบสนองเฉลี่ย:', `${avgResponseTime} วินาที`],
        []
      ];

      const tableHeaders = [
        'ลำดับ',
        'วันที่-เวลา',
        'ชื่อผู้ใช้งาน',
        'รหัสนักศึกษา',
        'บทบาท',
        'หมวดหมู่คำถาม',
        'สถานะการตอบ',
        'เวลาตอบ (วินาที)',
        'คำถามของผู้ใช้',
        'คำตอบของบอท'
      ];

      const padZero = (n: number) => String(n).padStart(2, '0');
      const dataRows = exportLogs.map((l, index) => {
        const d = new Date(l.timestamp);
        let formattedDate = '';
        if (isNaN(d.getTime())) {
          const nowTime = new Date();
          formattedDate = `${nowTime.getFullYear()}-${padZero(nowTime.getMonth() + 1)}-${padZero(nowTime.getDate())} ${padZero(nowTime.getHours())}:${padZero(nowTime.getMinutes())}:${padZero(nowTime.getSeconds())}`;
        } else {
          formattedDate = `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())} ${padZero(d.getHours())}:${padZero(d.getMinutes())}:${padZero(d.getSeconds())}`;
        }

        const roleText = ROLE_NAMES[l.userRole] || l.userRole || 'ผู้เยี่ยมชม';
        const intentText = INTENT_NAMES[l.intent] || l.intent || 'ทั่วไป';
        const statusText = l.isSuccess ? 'สำเร็จ' : 'ตอบไม่ได้';
        const respTime = Number((Number(l.responseTimeMs || 850) / 1000).toFixed(2));

        return [
          index + 1,
          formattedDate,
          l.userName || l.userId || 'Guest',
          l.studentId || '-',
          roleText,
          intentText,
          statusText,
          respTime,
          (l.query || '').trim(),
          (l.response || '').trim()
        ];
      });

      const ws1 = XLSX.utils.aoa_to_sheet([...summaryBlock, tableHeaders, ...dataRows]);

      // Set optimal column widths so no column is ever truncated or squished
      ws1['!cols'] = [
        { wch: 8 },   // ลำดับ
        { wch: 22 },  // วันที่-เวลา
        { wch: 28 },  // ชื่อผู้ใช้งาน
        { wch: 18 },  // รหัสนักศึกษา
        { wch: 14 },  // บทบาท
        { wch: 24 },  // หมวดหมู่
        { wch: 14 },  // สถานะ
        { wch: 18 },  // เวลาตอบ
        { wch: 45 },  // คำถาม
        { wch: 75 }   // คำตอบ
      ];

      XLSX.utils.book_append_sheet(wb, ws1, 'ประวัติการสนทนา');

      // ==========================================
      // SHEET 2: สรุปแยกตามหมวดหมู่ (Intent Breakdown)
      // ==========================================
      const intentCountMap: Record<string, { total: number; success: number; fail: number }> = {};
      exportLogs.forEach(l => {
        const intent = l.intent || 'unknown';
        if (!intentCountMap[intent]) {
          intentCountMap[intent] = { total: 0, success: 0, fail: 0 };
        }
        intentCountMap[intent].total++;
        if (l.isSuccess) {
          intentCountMap[intent].success++;
        } else {
          intentCountMap[intent].fail++;
        }
      });

      const intentRows = Object.entries(intentCountMap)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([intent, stats], idx) => [
          idx + 1,
          INTENT_NAMES[intent] || intent,
          stats.total,
          `${((stats.total / totalCount) * 100).toFixed(1)}%`,
          stats.success,
          stats.fail,
          `${((stats.success / stats.total) * 100).toFixed(1)}%`
        ]);

      const ws2 = XLSX.utils.aoa_to_sheet([
        ['สรุปสถิติแยกตามหมวดหมู่คำถาม (Intent Analysis)'],
        ['วันที่ออกรายงาน:', exportDateStr],
        [],
        ['ลำดับ', 'หมวดหมู่คำถาม', 'จำนวนคำถาม (ข้อความ)', 'สัดส่วน (%)', 'ตอบสำเร็จ', 'ตอบไม่ได้', 'อัตราความสำเร็จ (%)'],
        ...intentRows
      ]);

      ws2['!cols'] = [
        { wch: 8 },
        { wch: 26 },
        { wch: 22 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 22 }
      ];

      XLSX.utils.book_append_sheet(wb, ws2, 'สถิติตามหมวดหมู่');

      // ==========================================
      // SHEET 3: คำถามที่ตอบไม่ได้ (Fallback Queries)
      // ==========================================
      const failedLogs = exportLogs.filter(l => !l.isSuccess);
      const failedRows = failedLogs.map((l, idx) => [
        idx + 1,
        l.timestamp,
        l.userName || l.userId || 'Guest',
        INTENT_NAMES[l.intent] || l.intent || 'ทั่วไป',
        (l.query || '').trim(),
        (l.response || '').trim()
      ]);

      const ws3 = XLSX.utils.aoa_to_sheet([
        ['รายการคำถามที่บอทตอบไม่ได้ (สำหรับปรับปรุงฐานข้อมูล RAG/หลักสูตร)'],
        ['จำนวนคำถามที่ไม่พบข้อมูล:', `${failedLogs.length} ข้อความ`],
        [],
        ['ลำดับ', 'วันที่-เวลา', 'ผู้ใช้งาน', 'หมวดหมู่ที่คาดหวัง', 'คำถามที่ผู้ใช้ถาม', 'ข้อความตอบกลับของบอท'],
        ...(failedRows.length > 0 ? failedRows : [['-', '-', '-', '-', 'ไม่มีประวัติคำถามที่ตอบไม่ได้ (ตอบสำเร็จ 100%)', '-']])
      ]);

      ws3['!cols'] = [
        { wch: 8 },
        { wch: 22 },
        { wch: 24 },
        { wch: 24 },
        { wch: 45 },
        { wch: 65 }
      ];

      XLSX.utils.book_append_sheet(wb, ws3, 'คำถามที่ตอบไม่ได้');

      // Download .xlsx file
      const fileDateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      XLSX.writeFile(wb, `chatbot_analytics_${fileDateStr}.xlsx`);

      toast({
        title: 'ส่งออก Excel สำเร็จ 🎉',
        description: `สร้างไฟล์ Excel พร้อม 3 แผ่นงาน (Sheets) เรียบร้อยแล้ว (${totalCount} รายการ)`
      });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถส่งออกไฟล์ Excel ได้',
        variant: 'destructive'
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Filter logs locally by search term
  const filteredLogs = logs.filter(l => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (l.query && l.query.toLowerCase().includes(term)) ||
      (l.response && l.response.toLowerCase().includes(term)) ||
      (l.userName && l.userName.toLowerCase().includes(term)) ||
      (l.studentId && l.studentId.includes(term))
    );
  });

  const successPieData = [
    { name: 'ตอบได้สำเร็จ', value: Math.round((analytics?.totalMessages || 0) * ((analytics?.successRate || 0) / 100)) },
    { name: 'ไม่สามารถตอบได้ (Fallback)', value: (analytics?.totalMessages || 0) - Math.round((analytics?.totalMessages || 0) * ((analytics?.successRate || 0) / 100)) }
  ];

  const intentChartData = (analytics?.topIntents || []).map(item => ({
    name: INTENT_NAMES[item.intent] || item.intent,
    count: item.count
  }));

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            สถิติการใช้งานแชทบอท (Chatbot Analytics)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            วิเคราะห์ความถี่การถาม หมวดหมู่ยอดนิยม อัตราความสำเร็จ และคำถามที่บอทตอบไม่ได้
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="ช่วงเวลา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 วันล่าสุด</SelectItem>
              <SelectItem value="30">30 วันล่าสุด</SelectItem>
              <SelectItem value="90">90 วันล่าสุด</SelectItem>
              <SelectItem value="0">ทั้งหมด</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={isExportingExcel || loading}
            className="border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <FileSpreadsheet className={`w-4 h-4 mr-2 ${isExportingExcel ? 'animate-bounce' : 'text-emerald-600 dark:text-emerald-400'}`} />
            {isExportingExcel ? 'กำลังส่งออก Excel...' : 'ส่งออก Excel (.xlsx)'}
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isExporting || loading}>
            <Download className={`w-4 h-4 mr-2 ${isExporting ? 'animate-bounce' : ''}`} />
            {isExporting ? 'กำลังส่งออก...' : 'ส่งออก CSV'}
          </Button>

          <Button variant="secondary" size="sm" onClick={handleGenerateSampleLogs} disabled={isGeneratingMock}>
            <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
            {isGeneratingMock ? 'กำลังสร้าง...' : 'สร้างข้อมูลจำลอง'}
          </Button>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ข้อความทั้งหมด (Messages)</CardTitle>
            <MessageSquare className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              จาก {analytics?.totalSessions || 0} เซสชันการสนทนา
            </p>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">อัตราการตอบสำเร็จ (Success Rate)</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {(analytics?.successRate ?? 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              บอทสามารถค้นหาและตอบคำถามได้ถูกต้อง
            </p>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">เวลาตอบกลับเฉลี่ย (Avg Response)</CardTitle>
            <Clock className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {((analytics?.averageResponseTimeMs || 0) / 1000).toFixed(2)}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.averageResponseTimeMs || 0} มิลลิวินาที (RAG + LLM)
            </p>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">คำถามที่ตอบไม่ได้ (Fallback Rate)</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {(100 - (analytics?.successRate ?? 100)).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics?.failedQueries?.length || 0} คำถามที่ต้องการข้อมูลเพิ่ม
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Intents Bar Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              หมวดหมู่คำถามที่ถูกถามบ่อยที่สุด (Top Intents by Frequency)
            </CardTitle>
            <CardDescription>จำแนกประเภทคำถามตามความต้องการของนักศึกษา</CardDescription>
          </CardHeader>
          <CardContent>
            {intentChartData.length > 0 ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={intentChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                      {intentChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                ยังไม่มีข้อมูลสถิติหมวดหมู่
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success vs Fallback Pie Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              สัดส่วนความสำเร็จของการตอบ
            </CardTitle>
            <CardDescription>เปรียบเทียบคำตอบที่บอทตอบได้ vs ตอบไม่ได้</CardDescription>
          </CardHeader>
          <CardContent>
            {(analytics?.totalMessages || 0) > 0 ? (
              <div className="h-[280px] w-full flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={successPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {successPieData.map((_, index) => (
                        <Cell key={`pie-cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                ยังไม่มีข้อมูลความสำเร็จ
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages Over Time (Daily) */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              ปริมาณการใช้งานแชทบอทรายวัน (Daily Messages Trend)
            </CardTitle>
            <CardDescription>ติดตามจำนวนคำถามในแต่ละวัน</CardDescription>
          </CardHeader>
          <CardContent>
            {(analytics?.messagesByDate || []).length > 0 ? (
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.messagesByDate} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" name="จำนวนข้อความ" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
                ยังไม่มีข้อมูลรายวัน
              </div>
            )}
          </CardContent>
        </Card>

        {/* Peak Hours (0 - 23) */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              ช่วงเวลาที่ใช้งานมากที่สุด (Peak Hours)
            </CardTitle>
            <CardDescription>การกระจายตามชั่วโมงตลอดวัน (0:00 - 23:00)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.messagesByHour || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(h) => `เวลา ${h}:00 - ${h}:59 น.`} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="ข้อความ" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Detailed Logs & Failure Analysis */}
      <Tabs defaultValue="all-logs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="all-logs">ประวัติการสนทนาทั้งหมด</TabsTrigger>
          <TabsTrigger value="failed-logs">
            คำถามที่ตอบไม่ได้
            {analytics?.failedQueries && analytics.failedQueries.length > 0 && (
              <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
                {analytics.failedQueries.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: All Logs */}
        <TabsContent value="all-logs" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold">รายการประวัติการถาม-ตอบ</CardTitle>
                  <CardDescription>แสดงบทสนทนาและผลลัพธ์การตอบแบบละเอียด</CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาข้อความ/ผู้ใช้..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-9 text-sm"
                    />
                  </div>

                  <Select value={selectedIntentFilter} onValueChange={(v) => { setSelectedIntentFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-[130px] h-9 text-xs">
                      <SelectValue placeholder="หมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                      {Object.entries(INTENT_NAMES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatusFilter} onValueChange={(v) => { setSelectedStatusFilter(v); setPage(1); }}>
                    <SelectTrigger className="w-[110px] h-9 text-xs">
                      <SelectValue placeholder="สถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกสถานะ</SelectItem>
                      <SelectItem value="success">สำเร็จ</SelectItem>
                      <SelectItem value="failure">ตอบไม่ได้</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <div key={log.id} className="p-4 rounded-lg border bg-card/50 hover:bg-muted/40 transition-colors space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.isSuccess ? 'secondary' : 'destructive'} className="text-xs">
                            {log.isSuccess ? 'สำเร็จ' : 'ตอบไม่ได้'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {INTENT_NAMES[log.intent] || log.intent}
                          </Badge>
                          <span className="font-medium text-foreground">
                            {log.userName || log.userId || 'Guest'} ({log.userRole})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {log.responseTimeMs ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {(Number(log.responseTimeMs || 850) / 1000).toFixed(2)}s
                            </span>
                          ) : null}
                          <span>
                            {isNaN(new Date(log.timestamp).getTime())
                              ? new Date().toLocaleString('th-TH')
                              : new Date(log.timestamp).toLocaleString('th-TH')}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={async () => {
                              if (confirm('ต้องการลบ Log นี้ใช่หรือไม่?')) {
                                await chatLogService.deleteChatLog(log.id);
                                loadData();
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* User Query */}
                      <div className="flex items-start gap-2 bg-muted/40 p-2.5 rounded-md text-sm">
                        <span className="font-semibold text-primary shrink-0">ถาม:</span>
                        <span className="text-foreground">{log.query}</span>
                      </div>

                      {/* Bot Response */}
                      <div className="flex items-start gap-2 bg-background p-2.5 rounded-md border text-sm">
                        <span className="font-semibold text-emerald-600 shrink-0">ตอบ:</span>
                        <span className="text-muted-foreground whitespace-pre-wrap">{log.response}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>ไม่พบรายการประวัติการสนทนาตามเงื่อนไขที่เลือก</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t text-sm">
                  <div className="text-muted-foreground">
                    ทั้งหมด {totalCount} รายการ (หน้า {page} จาก {totalPages})
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      ก่อนหน้า
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      ถัดไป
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Failure Analysis */}
        <TabsContent value="failed-logs" className="space-y-4">
          <Card className="shadow-sm border-amber-200 bg-amber-50/20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-amber-900">
                <HelpCircle className="w-5 h-5 text-amber-600" />
                การวิเคราะห์คำถามที่บอทตอบไม่ได้ (Failure Analysis & Gaps)
              </CardTitle>
              <CardDescription>
                รวบรวมคำถามที่ผู้ใช้ถามแต่บอทไม่สามารถให้คำตอบที่ถูกต้องได้ นำไปปรับปรุง Knowledge Base ใน Pinecone RAG
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.failedQueries && analytics.failedQueries.length > 0 ? (
                  analytics.failedQueries.map((log) => (
                    <div key={log.id} className="p-4 rounded-lg border border-amber-200 bg-background space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">ตอบไม่ได้</Badge>
                          <span className="font-medium text-foreground">{log.userName || log.userId}</span>
                        </div>
                        <span>{new Date(log.timestamp).toLocaleString('th-TH')}</span>
                      </div>
                      <div className="text-sm font-medium text-amber-900 bg-amber-50 p-2.5 rounded">
                        คำถาม: {log.query}
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                        คำตอบที่ส่งให้ผู้ใช้: {log.response}
                      </div>
                      <div className="text-xs text-blue-600 font-medium pt-1">
                        💡 คำแนะนำ: เพิ่มข้อมูลคำตอบสำหรับหัวข้อนี้ลงใน Vector Store (Pinecone)
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
                    <p className="text-emerald-700 font-medium">ยอดเยี่ยม! ไม่มีคำถามที่บอทตอบไม่ได้ในช่วงเวลานี้</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatAnalyticsDashboard;
