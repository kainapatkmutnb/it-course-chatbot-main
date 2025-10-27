import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ChatBot from '@/components/chat/ChatBot';
import { 
  MessageCircle, 
  Bot, 
  Github, 
  Mail, 
  Phone,
  MapPin,
  ExternalLink
} from 'lucide-react';

const Footer: React.FC = () => {

  return (
    <>
      {/* Footer */}
      <footer className="bg-muted/30 border-t mt-auto">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 gradient-primary rounded-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">ระบบแนะนำหลักสูตรภาควิชาเทคโนโลยีสารสนเทศด้วย Chatbot</h3>
                  <p className="text-sm text-muted-foreground">Professional IT Guidance</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                ระบบแนะนำหลักสูตรเทคโนโลยีสารสนเทศ พร้อมแชทบอทอัจฉริยะ
                เพื่อช่วยเหลือนักศึกษาในการวางแผนการเรียน
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="font-semibold">ติดต่อเรา</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>fitm@fitm.kmutnb.ac.th</span>
                </li>
                <li className="flex items-start space-x-2 text-muted-foreground">
                  <Phone className="w-4 h-4 mt-0.5" />
                  <div className="space-y-1">
                    <div>037-217-339</div>
                    <div>037-217-341 ถึง 343</div>
                    <div>037-217-300 ถึง 304</div>
                  </div>
                </li>
                <li className="flex items-start space-x-2 text-muted-foreground">
                  <Phone className="w-4 h-4 mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground/80 mb-1">โทรสาร:</div>
                    <div>037-217-337</div>
                    <div>037-217-317</div>
                  </div>
                </li>
                <li className="flex items-start space-x-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>129 หมู่ 21 ตำบลเนินหอม อำเภอเมือง จังหวัดปราจีนบุรี 25230</span>
                </li>
              </ul>
            </div>

            {/* AI Assistant */}
            <div className="space-y-4">
              <h4 className="font-semibold">AI Assistant</h4>
              <p className="text-sm text-muted-foreground">
                ต้องการความช่วยเหลือ? แชทบอทของเราพร้อมตอบคำถามเกี่ยวกับหลักสูตรและการเรียน
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  ออนไลน์
                </Badge>
                <span className="text-xs text-muted-foreground">พร้อมให้บริการ 24/7</span>
              </div>
              <p className="text-xs text-muted-foreground">
                คลิกที่ปุ่มแชทด้านล่างขวาเพื่อเริ่มสนทนา
              </p>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2024 IT Assistant. สงวนลิขสิทธิ์ทุกประการ
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a 
                href="https://github.com" 
                className="text-muted-foreground hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="mailto:info@kmutnb.ac.th" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a 
                href="https://kmutnb.ac.th" 
                className="text-muted-foreground hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Chatbot Component */}
      <ChatBot />
    </>
  );
};

export default Footer;