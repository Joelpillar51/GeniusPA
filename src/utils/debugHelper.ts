// Debug helper for troubleshooting document and URL processing

export const debugDocumentProcessing = () => {
  console.log('=== Document Processing Debug Info ===');
  console.log('Available DocumentPicker:', typeof require('expo-document-picker'));
  console.log('Available FileSystem:', typeof require('expo-file-system'));
  console.log('Fetch available:', typeof fetch);
  console.log('===================================');
};

export const debugUrlFetch = async (url: string) => {
  console.log('=== URL Fetch Debug ===');
  console.log('URL:', url);
  
  try {
    const response = await fetch(url);
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Content Length:', text.length);
    console.log('Content Preview (first 200 chars):', text.substring(0, 200));
    
    return { success: true, content: text };
  } catch (error) {
    console.log('Fetch Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const testBasicFunctionality = async () => {
  console.log('=== Testing Basic Functionality ===');
  
  // Test document processor components
  debugDocumentProcessing();
  
  // Test simple URL fetch
  const result = await debugUrlFetch('https://httpbin.org/html');
  console.log('Basic URL test result:', result.success ? 'SUCCESS' : 'FAILED');
  
  // Test JSON URL
  const jsonResult = await debugUrlFetch('https://httpbin.org/json');
  console.log('JSON URL test result:', jsonResult.success ? 'SUCCESS' : 'FAILED');
  
  console.log('=== Basic Functionality Test Complete ===');
};