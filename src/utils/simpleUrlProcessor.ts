export interface SimpleUrlResult {
  success: boolean;
  title: string;
  content: string;
  url: string;
  error?: string;
}

export const processSimpleUrl = async (url: string): Promise<SimpleUrlResult> => {
  console.log('Processing URL:', url);
  
  try {
    // Clean up URL
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    console.log('Clean URL:', cleanUrl);
    
    // Validate URL
    try {
      new URL(cleanUrl);
    } catch (error) {
      throw new Error('Invalid URL format');
    }
    
    // Fetch content with a simple approach
    console.log('Fetching URL content...');
    const response = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml,text/plain,*/*',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      },
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    console.log('Content type:', contentType);
    
    const rawContent = await response.text();
    console.log('Raw content length:', rawContent.length);
    
    if (!rawContent || rawContent.length < 50) {
      throw new Error('URL returned empty or very short content');
    }
    
    let title = 'Web Content';
    let cleanContent = rawContent;
    
    // Handle different content types
    if (contentType.includes('application/json') || (rawContent.startsWith('{') && rawContent.endsWith('}'))) {
      console.log('Processing as JSON...');
      try {
        const jsonData = JSON.parse(rawContent);
        title = 'JSON Data';
        cleanContent = JSON.stringify(jsonData, null, 2);
      } catch (e) {
        cleanContent = rawContent;
      }
    } else if (contentType.includes('text/plain')) {
      console.log('Processing as plain text...');
      title = 'Text Document';
      cleanContent = rawContent.trim();
    } else if (contentType.includes('text/html') || rawContent.includes('<html')) {
      console.log('Processing as HTML...');
      
      // Extract title
      const titleMatch = rawContent.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
      
      // Remove HTML tags and scripts
      cleanContent = rawContent
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    } else {
      console.log('Processing as unknown content type, treating as text...');
      title = 'Document';
      cleanContent = rawContent.trim();
    }
    
    // Validate final content
    if (!cleanContent || cleanContent.length < 100) {
      throw new Error('After processing, content is too short or empty');
    }
    
    console.log('Successfully processed URL. Title:', title, 'Content length:', cleanContent.length);
    
    return {
      success: true,
      title: title,
      content: cleanContent,
      url: cleanUrl
    };
    
  } catch (error) {
    console.error('URL processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      success: false,
      title: 'Failed to process URL',
      content: '',
      url: url,
      error: errorMessage
    };
  }
};