import { useEffect } from "react";
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';

const Chatbot = () => {
  useEffect(() => {
    createChat({
      webhookUrl: 'http://localhost:5678/webhook/dd7276e3-4e2c-48c0-a7b7-ca3647acf777/chat',
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
  }, []);

  return <div id="n8n-chat"></div>;
};

export default Chatbot;