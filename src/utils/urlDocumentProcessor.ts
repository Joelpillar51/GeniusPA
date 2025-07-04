import { getOpenAIChatResponse } from '../api/chat-service';

export interface UrlProcessingResult {
  id: string;
  url: string;
  title: string;
  extractedText: string;
  success: boolean;
  error?: string;
  contentType: 'webpage' | 'pdf' | 'text' | 'unknown';
}

export const processDocumentFromUrl = async (url: string): Promise<UrlProcessingResult> => {
  const documentId = `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Validate URL format
    const validatedUrl = validateAndCleanUrl(url);
    
    // Fetch content from URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let response: Response;
    
    try {
      response = await fetch(validatedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml,text/plain,application/pdf,*/*',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. This website blocks automated access. Try downloading the content manually.');
        } else if (response.status === 404) {
          throw new Error('URL not found. Please check the URL and try again.');
        } else if (response.status >= 500) {
          throw new Error('Server error. The website is temporarily unavailable.');
        } else {
          throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. The URL took too long to respond.');
      }
      throw error;
    }

    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length');
    
    // Check if content is too large (limit to 10MB)
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      throw new Error('Document is too large (>10MB). Please try a smaller document.');
    }

    let extractedText = '';
    let title = '';
    let detectedType: 'webpage' | 'pdf' | 'text' | 'unknown' = 'unknown';

    if (contentType.includes('text/html')) {
      // Process HTML webpage
      const htmlContent = await response.text();
      const processed = await processHtmlContent(htmlContent, validatedUrl);
      extractedText = processed.text;
      title = processed.title;
      detectedType = 'webpage';
      
    } else if (contentType.includes('text/plain')) {
      // Process plain text
      extractedText = await response.text();
      title = extractTitleFromUrl(validatedUrl);
      detectedType = 'text';
      
    } else if (contentType.includes('application/pdf')) {
      // Process PDF
      throw new Error('PDF URLs are not supported yet. Please download the PDF and upload it directly.');
      
    } else {
      // Try to process as text anyway
      const textContent = await response.text();
      if (textContent && textContent.length > 0) {
        extractedText = textContent;
        title = extractTitleFromUrl(validatedUrl);
        detectedType = 'text';
      } else {
        throw new Error('Unable to extract text content from this URL');
      }
    }

    // Validate extracted content
    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error('The URL content is too short or empty. Please check the URL and try again.');
    }

    // Clean up extracted text
    const cleanedText = cleanExtractedText(extractedText);

    return {
      id: documentId,
      url: validatedUrl,
      title: title || extractTitleFromUrl(validatedUrl),
      extractedText: cleanedText,
      success: true,
      contentType: detectedType
    };

  } catch (error) {
    console.error('URL processing error:', error);
    return {
      id: documentId,
      url: url,
      title: 'Failed to process URL',
      extractedText: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      contentType: 'unknown'
    };
  }
};

const validateAndCleanUrl = (url: string): string => {
  let cleanUrl = url.trim();
  
  // Add protocol if missing
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }
  
  // Validate URL format
  try {
    const urlObj = new URL(cleanUrl);
    return urlObj.href;
  } catch (error) {
    throw new Error('Invalid URL format. Please enter a valid URL.');
  }
};

const processHtmlContent = async (html: string, url: string): Promise<{text: string, title: string}> => {
  try {
    // Use AI to extract clean text content from HTML
    const prompt = `Extract the main text content from this HTML webpage. Remove navigation, ads, headers, footers, and other non-content elements. Return only the readable article/document text.

URL: ${url}

HTML Content:
${html.substring(0, 15000)}${html.length > 15000 ? '...[truncated]' : ''}

Please provide:
1. TITLE: The webpage title
2. CONTENT: The main text content (clean, readable text without HTML tags)

Format your response as:
TITLE: [webpage title]

CONTENT:
[main text content]`;

    const response = await getOpenAIChatResponse(prompt);
    const content = response.content;
    
    // Parse AI response
    const titleMatch = content.match(/TITLE:\s*(.+)/);
    const contentMatch = content.match(/CONTENT:\s*([\s\S]+)/);
    
    const title = titleMatch ? titleMatch[1].trim() : extractTitleFromUrl(url);
    const text = contentMatch ? contentMatch[1].trim() : '';
    
    if (!text || text.length < 50) {
      // Fallback: basic HTML parsing
      return basicHtmlParsing(html, url);
    }
    
    return { text, title };
    
  } catch (error) {
    console.error('AI HTML processing failed, using fallback:', error);
    return basicHtmlParsing(html, url);
  }
};

const basicHtmlParsing = (html: string, url: string): {text: string, title: string} => {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : extractTitleFromUrl(url);
  
  // Basic HTML tag removal
  let text = html
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
  
  return { text, title };
};

const extractTitleFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const pathname = urlObj.pathname;
    
    // Try to extract meaningful title from URL
    if (pathname && pathname !== '/') {
      const pathParts = pathname.split('/').filter(part => part.length > 0);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        const titleFromPath = lastPart
          .replace(/[-_]/g, ' ')
          .replace(/\.[^.]+$/, '') // Remove file extension
          .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
        
        if (titleFromPath.length > 0) {
          return `${titleFromPath} - ${hostname}`;
        }
      }
    }
    
    return hostname;
  } catch (error) {
    return 'Document from URL';
  }
};

const cleanExtractedText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const getSupportedUrlTypes = () => {
  return {
    supported: [
      'Web articles and blog posts',
      'Documentation pages',
      'Text-based web content',
      'Plain text files (.txt)',
      'Online documents and papers'
    ],
    notSupported: [
      'PDF URLs (download and upload instead)',
      'Images or multimedia content',
      'Password-protected content',
      'Dynamic content requiring JavaScript'
    ],
    tips: [
      'Make sure the URL is publicly accessible',
      'Web articles and documentation work best',
      'Some websites may block automated access',
      'For PDFs, download and upload the file instead'
    ]
  };
};