// Simple test function to verify URL processing works
export const testUrlProcessing = async (): Promise<void> => {
  console.log('=== Testing URL Processing ===');
  
  try {
    // Test with a simple, reliable URL
    const testUrl = 'https://httpbin.org/html';
    console.log('Testing with URL:', testUrl);
    
    const response = await fetch(testUrl);
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const content = await response.text();
    console.log('Content length:', content.length);
    console.log('Content preview:', content.substring(0, 200));
    
    console.log('=== URL Processing Test Successful ===');
  } catch (error) {
    console.error('=== URL Processing Test Failed ===');
    console.error('Error:', error);
  }
};