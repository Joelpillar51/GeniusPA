import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recording, Document, ChatSession, ChatMessage } from '../types/meeting';

interface MeetingState {
  recordings: Recording[];
  documents: Document[];
  chatSessions: ChatSession[];
  
  // Recording actions
  addRecording: (recording: Recording) => void;
  updateRecording: (id: string, updates: Partial<Recording>) => void;
  deleteRecording: (id: string) => void;
  
  // Document actions
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  
  // Chat actions
  createChatSession: (session: ChatSession) => void;
  addMessageToSession: (sessionId: string, message: ChatMessage) => void;
  updateChatSession: (id: string, updates: Partial<ChatSession>) => void;
  deleteChatSession: (id: string) => void;
  getChatSessionByItemId: (itemId: string) => ChatSession | undefined;
}

export const useMeetingStore = create<MeetingState>()(
  persist(
    (set, get) => ({
      recordings: [],
      documents: [],
      chatSessions: [],
      
      addRecording: (recording) =>
        set((state) => ({ recordings: [...state.recordings, recording] })),
      
      updateRecording: (id, updates) =>
        set((state) => ({
          recordings: state.recordings.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),
      
      deleteRecording: (id) =>
        set((state) => ({
          recordings: state.recordings.filter((r) => r.id !== id),
          chatSessions: state.chatSessions.filter((s) => s.relatedItemId !== id),
        })),
      
      addDocument: (document) =>
        set((state) => ({ documents: [...state.documents, document] })),
      
      updateDocument: (id, updates) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        })),
      
      deleteDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
          chatSessions: state.chatSessions.filter((s) => s.relatedItemId !== id),
        })),
      
      createChatSession: (session) =>
        set((state) => ({ chatSessions: [...state.chatSessions, session] })),
      
      addMessageToSession: (sessionId, message) =>
        set((state) => {
          const sessionExists = state.chatSessions.some(s => s.id === sessionId);
          if (!sessionExists) {
            console.warn(`Trying to add message to non-existent session: ${sessionId}`);
            return state;
          }
          return {
            chatSessions: state.chatSessions.map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    messages: [...s.messages, message],
                    updatedAt: new Date(),
                  }
                : s
            ),
          };
        }),
      
      updateChatSession: (id, updates) =>
        set((state) => ({
          chatSessions: state.chatSessions.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
          ),
        })),
      
      deleteChatSession: (id) =>
        set((state) => ({
          chatSessions: state.chatSessions.filter((s) => s.id !== id),
        })),
      
      getChatSessionByItemId: (itemId) => {
        const state = get();
        return state.chatSessions.find((s) => s.relatedItemId === itemId);
      },
    }),
    {
      name: 'meeting-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        recordings: state.recordings,
        documents: state.documents,
        chatSessions: state.chatSessions,
      }),
    }
  )
);