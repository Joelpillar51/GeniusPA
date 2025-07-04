import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { ChatSession } from '../types/meeting';

export const exportChatToPDF = async (chatSession: ChatSession) => {
  try {
    // Create a simple HTML representation
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${chatSession.title}</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #ccc; margin-bottom: 20px; padding-bottom: 10px; }
        .message { margin-bottom: 15px; }
        .user { text-align: right; }
        .assistant { text-align: left; }
        .message-content { display: inline-block; padding: 10px; border-radius: 10px; max-width: 70%; }
        .user .message-content { background-color: #007AFF; color: white; }
        .assistant .message-content { background-color: #f0f0f0; color: black; }
        .timestamp { font-size: 12px; color: #666; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${chatSession.title}</h1>
        <p>Exported on ${new Date().toLocaleDateString()}</p>
        <p>Total messages: ${chatSession.messages.length}</p>
    </div>
    
    <div class="messages">
        ${chatSession.messages.map(message => `
            <div class="message ${message.role}">
                <div class="message-content">
                    ${message.content.replace(/\n/g, '<br>')}
                </div>
                <div class="timestamp">
                    ${new Date(message.timestamp).toLocaleString()}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;

    // Create a temporary HTML file
    const fileName = `${chatSession.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, html);

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/html',
        dialogTitle: 'Export Chat',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }

    // Clean up the temporary file
    await FileSystem.deleteAsync(fileUri, { idempotent: true });

  } catch (error) {
    console.error('Error exporting chat:', error);
    throw error;
  }
};

export const exportRecordingTranscript = async (recording: { title: string; transcript?: string; summary?: string; createdAt: Date }) => {
  if (!recording.transcript) {
    throw new Error('No transcript available to export');
  }

  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${recording.title}</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { border-bottom: 2px solid #ccc; margin-bottom: 20px; padding-bottom: 10px; }
        .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .transcript { text-align: justify; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${recording.title}</h1>
        <p>Recorded on ${new Date(recording.createdAt).toLocaleDateString()}</p>
    </div>
    
    ${recording.summary ? `
    <div class="summary">
        <h2>Summary</h2>
        <p>${recording.summary}</p>
    </div>
    ` : ''}
    
    <div class="transcript">
        <h2>Transcript</h2>
        <p>${recording.transcript.replace(/\n/g, '</p><p>')}</p>
    </div>
</body>
</html>
    `;

    const fileName = `${recording.title.replace(/[^a-zA-Z0-9]/g, '_')}_transcript_${Date.now()}.html`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, html);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/html',
        dialogTitle: 'Export Transcript',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }

    await FileSystem.deleteAsync(fileUri, { idempotent: true });

  } catch (error) {
    console.error('Error exporting transcript:', error);
    throw error;
  }
};