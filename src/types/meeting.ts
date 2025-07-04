export interface Recording {
  id: string;
  title: string;
  uri: string;
  duration: number;
  createdAt: Date;
  transcript?: string;
  summary?: string;
  isTranscribing?: boolean;
}

export interface Document {
  id: string;
  name: string;
  uri: string;
  type: string;
  createdAt: Date;
  transcript?: string;
  summary?: string;
  isProcessing?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  relatedItemId?: string | null; // Recording or Document ID, null for direct chat
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  relatedItemId?: string | null; // Recording or Document ID, null for direct chat
  relatedItemType?: 'recording' | 'document' | null; // null for direct chat
}