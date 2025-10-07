import { useEffect, useState } from "react";
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';

const Chatbot = () => {
  const [chatError, setChatError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        setChatError(null);
        
        // Check if webhook is available before initializing chat
        const webhookUrl = 'http://localhost:5678/webhook/dd7276e3-4e2c-48c0-a7b7-ca3647acf777/chat';
        
        // Test webhook connectivity
        try {
          const response = await fetch(webhookUrl, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(3000) // 3 second timeout
          });
        } catch (fetchError) {
          throw new Error('Webhook service is not available');
        }

        createChat({
          webhookUrl,
          mode: 'window',
          showWelcomeScreen: true,
          defaultLanguage: 'en',
          initialMessages: [
            'สวัสดีครับ! 👋',
            'ผมคือ AI Assistant ของภาควิชาเทคโนโลยีสารสนเทศ มีอะไรให้ช่วยไหมครับ?'
          ],
          i18n: {
            en: {
              title: 'IT Course Assistant 👋',
              subtitle: 'ยินดีต้อนรับสู่ระบบแชทบอทของภาควิชาเทคโนโลยีสารสนเทศ',
              footer: 'Powered by n8n',
              getStarted: 'เริ่มการสนทนา',
              inputPlaceholder: 'พิมพ์คำถามของคุณ...',
              closeButtonTooltip: 'ปิดแชทบอท',
            },
          },
          loadPreviousSession: true,
          enableStreaming: false,
        });
      } catch (error) {
        console.error('Chat initialization error:', error);
        setChatError('ขออภัย ระบบแชทบอทไม่สามารถเชื่อมต่อได้ในขณะนี้');
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดแชทบอท...</p>
        </div>
      </div>
    );
  }

  if (chatError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <div className="text-yellow-600 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">แชทบอทไม่พร้อมใช้งาน</h3>
          <p className="text-yellow-700 text-sm mb-4">{chatError}</p>
          <p className="text-yellow-600 text-xs">
            กรุณาติดต่อผู้ดูแลระบบหรือลองใหม่อีกครั้งในภายหลัง
          </p>
        </div>
      </div>
    );
  }

  return <div id="n8n-chat"></div>;
};

export default Chatbot;