/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom audio transcription service that uses a custom API endpoint maintained by Vibecode.
You can use this function to transcribe audio files, and it will return the text of the audio file.
*/

/**
 * Transcribe an audio file
 * @param localAudioUri - The local URI of the audio file to transcribe. Obtained via the expo-av library.
 * @returns The text of the audio file
 */
export const transcribeAudio = async (localAudioUri: string) => {
  try {
    // Create FormData for the audio file
    const formData = new FormData();
    formData.append("file", {
      uri: localAudioUri,
      type: "audio/m4a",
      name: "recording.m4a",
    } as any);
    formData.append("model", "gpt-4o-transcribe");
    formData.append("language", "en");

    const OPENAI_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    // API call to OpenAI's gpt-4o-transcribe
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorData = JSON.parse(errorText);
      
      // Handle specific error types
      if (response.status === 503 || errorData.error?.message?.includes('rate limit')) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('INVALID_CREDENTIALS');
      }
      
      if (response.status === 413) {
        throw new Error('FILE_TOO_LARGE');
      }
      
      throw new Error(`Transcription failed: ${errorText}`);
    }

    const result = await response.json();
    return result.text;
  } catch (error) {
    console.error("Transcription error:", error);
    
    // Re-throw with more specific error types
    if (error instanceof Error) {
      if (error.message === 'RATE_LIMIT_EXCEEDED') {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      if (error.message === 'INVALID_CREDENTIALS') {
        throw new Error('INVALID_CREDENTIALS');
      }
      if (error.message === 'FILE_TOO_LARGE') {
        throw new Error('FILE_TOO_LARGE');
      }
    }
    
    throw error;
  }
};
