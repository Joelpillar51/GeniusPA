/**
 * Transcription fallback utilities
 * Handles cases where automatic transcription fails
 */

export const getTranscriptionFallbackMessage = (errorType: string): string => {
  const baseMessage = '🎤 Recording completed successfully!\n\n';
  
  switch (errorType) {
    case 'RATE_LIMIT_EXCEEDED':
      return `${baseMessage}⚠️ Automatic transcription is temporarily unavailable due to high usage.\n\n📝 Manual transcription options:\n• Use voice-to-text on your device\n• Upload to a transcription service\n• Edit this text manually with your notes\n\n💡 Tip: You can still use AI Chat and Export features!`;
      
    case 'INVALID_CREDENTIALS':
      return `${baseMessage}⚠️ Transcription service configuration issue.\n\n📝 Manual transcription options:\n• Use voice-to-text on your device\n• Upload to a transcription service\n• Edit this text manually with your notes\n\n💡 Your recording is safely stored and ready to use.`;
      
    case 'FILE_TOO_LARGE':
      return `${baseMessage}⚠️ Audio file is too large for automatic transcription.\n\n📝 For large recordings, try:\n• Breaking into smaller segments\n• Using external transcription services\n• Adding manual notes and key points\n\n💡 Your recording is saved and ready for manual transcription.`;
      
    case 'NETWORK_ERROR':
      return `${baseMessage}⚠️ Network issue prevented automatic transcription.\n\n📝 Your recording is safely stored. You can:\n• Try transcription again later\n• Add manual notes and key points\n• Export the recording\n• Use AI Chat with manual transcription`;
      
    default:
      return `${baseMessage}⚠️ Automatic transcription is currently unavailable.\n\n📝 Your recording is safely stored and you can:\n• Play back the recording anytime\n• Add manual notes and key points\n• Export the recording\n• Use AI Chat with manual transcription\n\n💡 Tap the edit icon to add your own transcript.`;
  }
};

export const getUserFriendlyErrorMessage = (errorType: string): string => {
  switch (errorType) {
    case 'RATE_LIMIT_EXCEEDED':
      return 'Transcription service temporarily busy. Your recording is saved and ready to use manually.';
      
    case 'INVALID_CREDENTIALS':
      return 'Transcription service temporarily unavailable. Your recording is saved for manual transcription.';
      
    case 'FILE_TOO_LARGE':
      return 'Recording too large for automatic transcription. You can add transcript manually.';
      
    case 'NETWORK_ERROR':
      return 'Network issue prevented transcription. Your recording is saved and you can try again later.';
      
    default:
      return 'Transcription unavailable, but your recording is saved and ready to use.';
  }
};

export const getTranscriptionGuidance = (): string[] => {
  return [
    '🎯 Pro Tip: Use your device\'s built-in voice-to-text to transcribe',
    '📱 Try saying "Hey Siri, transcribe this audio" (iOS)',
    '🔊 Play back sections and type key points manually',
    '⏯️ Use playback speed controls for easier manual transcription',
    '📝 Focus on main topics rather than word-for-word transcription',
    '🤖 You can still chat with AI about your manual notes!'
  ];
};