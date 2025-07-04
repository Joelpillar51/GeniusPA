import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { ChatSession } from '../types/meeting';

const createPlainTextContent = (chatSession: ChatSession): string => {
  const header = `${chatSession.title}\n${'='.repeat(chatSession.title.length)}\n\nExported on: ${new Date().toLocaleDateString()}\nTotal messages: ${chatSession.messages.length}\n\n`;
  
  const messages = chatSession.messages.map(message => {
    const timestamp = new Date(message.timestamp).toLocaleString();
    const speaker = message.role === 'user' ? 'You' : 'AI Assistant';
    return `[${timestamp}] ${speaker}:\n${message.content}\n`;
  }).join('\n');
  
  return header + messages;
};

export const exportChatToPDF = async (chatSession: ChatSession) => {
  try {
    // Create plain text content
    const content = createPlainTextContent(chatSession);
    
    // Create a text file (which can be easily converted to PDF by users)
    const fileName = `${chatSession.title.replace(/[^a-zA-Z0-9\s]/g, '_')}_chat_${Date.now()}.txt`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, content);

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Export Chat Conversation',
        UTI: 'public.plain-text',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }

    // Clean up the temporary file after a delay
    setTimeout(async () => {
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (cleanupError) {
        console.log('Cleanup error (non-critical):', cleanupError);
      }
    }, 5000);

  } catch (error) {
    console.error('Error exporting chat:', error);
    throw error;
  }
};

const createTranscriptContent = (recording: { title: string; transcript?: string; summary?: string; createdAt: Date }): string => {
  if (!recording.transcript) {
    throw new Error('No transcript available to export');
  }

  const header = `${recording.title}\n${'='.repeat(recording.title.length)}\n\nRecorded on: ${new Date(recording.createdAt).toLocaleDateString()} at ${new Date(recording.createdAt).toLocaleTimeString()}\n\n`;
  
  const summary = recording.summary ? `SUMMARY\n${'─'.repeat(50)}\n${recording.summary}\n\n` : '';
  
  const transcript = `TRANSCRIPT\n${'─'.repeat(50)}\n${recording.transcript}`;
  
  return header + summary + transcript;
};

export const exportRecordingTranscript = async (recording: { title: string; transcript?: string; summary?: string; createdAt: Date }) => {
  try {
    // Create plain text content
    const content = createTranscriptContent(recording);
    
    // Create a text file
    const fileName = `${recording.title.replace(/[^a-zA-Z0-9\s]/g, '_')}_transcript_${Date.now()}.txt`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, content);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Export Recording Transcript',
        UTI: 'public.plain-text',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }

    // Clean up the temporary file after a delay
    setTimeout(async () => {
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (cleanupError) {
        console.log('Cleanup error (non-critical):', cleanupError);
      }
    }, 5000);

  } catch (error) {
    console.error('Error exporting transcript:', error);
    throw error;
  }
};

// New function to export document content
export const exportDocumentContent = async (document: { name: string; transcript?: string; summary?: string; createdAt: Date }) => {
  if (!document.transcript) {
    throw new Error('No content available to export');
  }

  try {
    const header = `${document.name}\n${'='.repeat(document.name.length)}\n\nUploaded on: ${new Date(document.createdAt).toLocaleDateString()} at ${new Date(document.createdAt).toLocaleTimeString()}\n\n`;
    
    const summary = document.summary ? `SUMMARY\n${'─'.repeat(50)}\n${document.summary}\n\n` : '';
    
    const content = `CONTENT\n${'─'.repeat(50)}\n${document.transcript}`;
    
    const fullContent = header + summary + content;
    
    // Create a text file
    const fileName = `${document.name.replace(/[^a-zA-Z0-9\s]/g, '_')}_content_${Date.now()}.txt`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, fullContent);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Export Document Content',
        UTI: 'public.plain-text',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }

    // Clean up the temporary file after a delay
    setTimeout(async () => {
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      } catch (cleanupError) {
        console.log('Cleanup error (non-critical):', cleanupError);
      }
    }, 5000);

  } catch (error) {
    console.error('Error exporting document:', error);
    throw error;
  }
};