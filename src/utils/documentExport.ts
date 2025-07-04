import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { ChatSession } from '../types/meeting';

// Create RTF (Rich Text Format) which can be opened by Word and other document editors
const createRTFContent = (title: string, content: string): string => {
  // RTF header
  const rtfHeader = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}`;
  
  // Convert content to RTF format
  const rtfContent = content
    .replace(/\n/g, '\\par ')
    .replace(/\t/g, '\\tab ')
    .replace(/[{}\\]/g, (match) => `\\${match}`);
  
  return `${rtfHeader}
\\f0\\fs24 {\\b\\fs28 ${title.replace(/[{}\\]/g, (match) => `\\${match}`)}\\par\\par}
${rtfContent}
}`;
};

// Create Markdown format which is widely supported
const createMarkdownContent = (title: string, content: string): string => {
  return `# ${title}\n\n${content}`;
};

export const exportChatAsDocument = async (chatSession: ChatSession, format: 'txt' | 'rtf' | 'md' = 'txt') => {
  try {
    const timestamp = new Date().toLocaleDateString();
    const header = `${chatSession.title}\n\nExported on: ${timestamp}\nTotal messages: ${chatSession.messages.length}\n\n`;
    
    const messages = chatSession.messages.map(message => {
      const messageTime = new Date(message.timestamp).toLocaleString();
      const speaker = message.role === 'user' ? 'You' : 'AI Assistant';
      return `[${messageTime}] ${speaker}:\n${message.content}\n`;
    }).join('\n');
    
    const plainContent = header + messages;
    
    let fileContent: string;
    let mimeType: string;
    let fileExtension: string;
    
    switch (format) {
      case 'rtf':
        fileContent = createRTFContent(chatSession.title, plainContent);
        mimeType = 'application/rtf';
        fileExtension = 'rtf';
        break;
      case 'md':
        fileContent = createMarkdownContent(chatSession.title, plainContent);
        mimeType = 'text/markdown';
        fileExtension = 'md';
        break;
      default:
        fileContent = plainContent;
        mimeType = 'text/plain';
        fileExtension = 'txt';
    }
    
    const fileName = `${chatSession.title.replace(/[^a-zA-Z0-9\s]/g, '_')}_chat.${fileExtension}`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, fileContent);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: `Export Chat as ${format.toUpperCase()}`,
        UTI: format === 'rtf' ? 'public.rtf' : format === 'md' ? 'net.daringfireball.markdown' : 'public.plain-text',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }

    // Clean up after sharing
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

export const exportTranscriptAsDocument = async (
  recording: { title: string; transcript?: string; summary?: string; createdAt: Date },
  format: 'txt' | 'rtf' | 'md' = 'txt'
) => {
  if (!recording.transcript) {
    throw new Error('No transcript available to export');
  }

  try {
    const timestamp = new Date(recording.createdAt);
    const header = `${recording.title}\n\nRecorded on: ${timestamp.toLocaleDateString()} at ${timestamp.toLocaleTimeString()}\n\n`;
    
    const summary = recording.summary ? `SUMMARY\n${recording.summary}\n\n` : '';
    const transcript = `TRANSCRIPT\n${recording.transcript}`;
    
    const plainContent = header + summary + transcript;
    
    let fileContent: string;
    let mimeType: string;
    let fileExtension: string;
    
    switch (format) {
      case 'rtf':
        fileContent = createRTFContent(recording.title, plainContent);
        mimeType = 'application/rtf';
        fileExtension = 'rtf';
        break;
      case 'md':
        const mdContent = `# ${recording.title}\n\n**Recorded on:** ${timestamp.toLocaleDateString()} at ${timestamp.toLocaleTimeString()}\n\n${recording.summary ? `## Summary\n\n${recording.summary}\n\n` : ''}## Transcript\n\n${recording.transcript}`;
        fileContent = mdContent;
        mimeType = 'text/markdown';
        fileExtension = 'md';
        break;
      default:
        fileContent = plainContent;
        mimeType = 'text/plain';
        fileExtension = 'txt';
    }
    
    const fileName = `${recording.title.replace(/[^a-zA-Z0-9\s]/g, '_')}_transcript.${fileExtension}`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, fileContent);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: `Export Transcript as ${format.toUpperCase()}`,
        UTI: format === 'rtf' ? 'public.rtf' : format === 'md' ? 'net.daringfireball.markdown' : 'public.plain-text',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }

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

export const exportDocumentAsDocument = async (
  document: { name: string; transcript?: string; summary?: string; createdAt: Date },
  format: 'txt' | 'rtf' | 'md' = 'txt'
) => {
  if (!document.transcript) {
    throw new Error('No content available to export');
  }

  try {
    const timestamp = new Date(document.createdAt);
    const header = `${document.name}\n\nUploaded on: ${timestamp.toLocaleDateString()} at ${timestamp.toLocaleTimeString()}\n\n`;
    
    const summary = document.summary ? `SUMMARY\n${document.summary}\n\n` : '';
    const content = `CONTENT\n${document.transcript}`;
    
    const plainContent = header + summary + content;
    
    let fileContent: string;
    let mimeType: string;
    let fileExtension: string;
    
    switch (format) {
      case 'rtf':
        fileContent = createRTFContent(document.name, plainContent);
        mimeType = 'application/rtf';
        fileExtension = 'rtf';
        break;
      case 'md':
        const mdContent = `# ${document.name}\n\n**Uploaded on:** ${timestamp.toLocaleDateString()} at ${timestamp.toLocaleTimeString()}\n\n${document.summary ? `## Summary\n\n${document.summary}\n\n` : ''}## Content\n\n${document.transcript}`;
        fileContent = mdContent;
        mimeType = 'text/markdown';
        fileExtension = 'md';
        break;
      default:
        fileContent = plainContent;
        mimeType = 'text/plain';
        fileExtension = 'txt';
    }
    
    const fileName = `${document.name.replace(/[^a-zA-Z0-9\s]/g, '_')}_content.${fileExtension}`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, fileContent);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: `Export Document as ${format.toUpperCase()}`,
        UTI: format === 'rtf' ? 'public.rtf' : format === 'md' ? 'net.daringfireball.markdown' : 'public.plain-text',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }

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