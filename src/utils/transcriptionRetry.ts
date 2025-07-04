import { transcribeAudio } from '../api/transcribe-audio';

/**
 * Retry transcription with exponential backoff
 */
export const retryTranscription = async (
  audioUri: string, 
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<string> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Transcription attempt ${attempt + 1}/${maxRetries + 1}`);
      const result = await transcribeAudio(audioUri);
      
      if (result && result.trim().length > 0) {
        return result;
      } else {
        throw new Error('Empty transcript received');
      }
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry for certain error types
      if (error instanceof Error) {
        if (error.message === 'INVALID_CREDENTIALS' || 
            error.message === 'FILE_TOO_LARGE') {
          throw error;
        }
      }
      
      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`Waiting ${delay}ms before retry...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  throw lastError || new Error('Transcription failed after all retries');
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: Error): boolean => {
  const retryableErrors = [
    'RATE_LIMIT_EXCEEDED',
    'NETWORK_ERROR',
    'TIMEOUT',
    'SERVER_ERROR'
  ];
  
  return retryableErrors.includes(error.message) || 
         error.message.includes('timeout') ||
         error.message.includes('network');
};