import { getOpenAIChatResponse } from '../api/chat-service';

export interface DocumentChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface DocumentChatSession {
  documentId: string;
  documentName: string;
  extractedText: string;
  messages: DocumentChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// In-memory storage for document chat sessions (per app session)
// In a real app, you'd want to persist this to AsyncStorage or a database
let documentChatSessions: Map<string, DocumentChatSession> = new Map();

export const createDocumentChatSession = (
  documentId: string,
  documentName: string,
  extractedText: string
): DocumentChatSession => {
  const session: DocumentChatSession = {
    documentId,
    documentName,
    extractedText,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Add welcome message
  const welcomeMessage: DocumentChatMessage = {
    id: `welcome_${Date.now()}`,
    role: 'assistant',
    content: `Hello! I've successfully processed your document "${documentName}" and I'm ready to answer questions about its content. I have access to the full text and can help you with:

• Summarizing the document
• Answering specific questions about the content
• Explaining key concepts mentioned in the document
• Finding specific information within the text

What would you like to know about this document?`,
    timestamp: new Date()
  };
  
  session.messages.push(welcomeMessage);
  
  documentChatSessions.set(documentId, session);
  return session;
};

export const getDocumentChatSession = (documentId: string): DocumentChatSession | null => {
  return documentChatSessions.get(documentId) || null;
};

export const addMessageToDocumentChat = async (
  documentId: string,
  userMessage: string
): Promise<DocumentChatMessage> => {
  const session = documentChatSessions.get(documentId);
  if (!session) {
    throw new Error('Document chat session not found');
  }
  
  // Add user message
  const userMsg: DocumentChatMessage = {
    id: `user_${Date.now()}`,
    role: 'user',
    content: userMessage.trim(),
    timestamp: new Date()
  };
  
  session.messages.push(userMsg);
  session.updatedAt = new Date();
  
  // Generate AI response based on document content
  const aiResponse = await generateDocumentAIResponse(session.extractedText, userMessage.trim());
  
  const assistantMsg: DocumentChatMessage = {
    id: `ai_${Date.now()}`,
    role: 'assistant',
    content: aiResponse,
    timestamp: new Date()
  };
  
  session.messages.push(assistantMsg);
  session.updatedAt = new Date();
  
  return assistantMsg;
};

const generateDocumentAIResponse = async (documentText: string, userQuestion: string): Promise<string> => {
  // Create a focused prompt that constrains the AI to use only the document content
  const prompt = `You are an AI assistant that answers questions based ONLY on the provided document content. 

DOCUMENT CONTENT:
${documentText}

RULES:
1. Answer questions using ONLY the information from the document above
2. If the question asks about something not in the document, clearly state that the information is not available in the document
3. If asked for general knowledge not related to the document, you may provide general information but clearly distinguish it from document content
4. Be specific and quote relevant parts of the document when answering
5. If the document doesn't contain enough information to fully answer the question, say so explicitly

USER QUESTION: ${userQuestion}

Please provide a helpful response following the rules above.`;

  try {
    const response = await getOpenAIChatResponse(prompt);
    return response.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'I apologize, but I encountered an error while processing your question. Please try asking again.';
  }
};

export const getAllDocumentChatSessions = (): DocumentChatSession[] => {
  return Array.from(documentChatSessions.values());
};

export const deleteDocumentChatSession = (documentId: string): boolean => {
  return documentChatSessions.delete(documentId);
};

export const clearAllDocumentChatSessions = (): void => {
  documentChatSessions.clear();
};

// Helper function to generate suggested questions based on document content
export const generateSuggestedQuestions = async (documentText: string): Promise<string[]> => {
  const prompt = `Based on the following document content, generate 3 thoughtful questions that would help someone understand the key information in this document:

DOCUMENT CONTENT:
${documentText.substring(0, 2000)}${documentText.length > 2000 ? '...' : ''}

Please provide 3 specific questions that can be answered using the document content. Format as a simple list, one question per line.`;

  try {
    const response = await getOpenAIChatResponse(prompt);
    const questions = response.content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(question => question.length > 10)
      .slice(0, 3);
    
    return questions;
  } catch (error) {
    console.error('Error generating suggested questions:', error);
    return [
      "What are the main topics covered in this document?",
      "Can you summarize the key points?",
      "What are the most important details mentioned?"
    ];
  }
};