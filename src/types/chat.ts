export interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  userId?: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  startTime: Date;
  lastMessage: Date;
  isActive: boolean;
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  courses?: any[];
  isError?: boolean;
}

export interface ChatIntent {
  intent: string;
  entities: { [key: string]: any };
  confidence: number;
}