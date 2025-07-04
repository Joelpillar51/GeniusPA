import * as FileSystem from 'expo-file-system';

export interface DocumentProcessingResult {
  content: string;
  success: boolean;
  fileType: 'text' | 'pdf' | 'word' | 'unknown';
  message?: string;
}

export const processDocumentContent = async (
  uri: string, 
  fileName: string, 
  mimeType?: string
): Promise<DocumentProcessingResult> => {
  const fileType = determineFileType(fileName, mimeType);
  
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    switch (fileType) {
      case 'text':
        return await processTextFile(uri, fileName);
      case 'pdf':
        return await processPDFFile(uri, fileName, fileInfo.size);
      case 'word':
        return await processWordFile(uri, fileName);
      default:
        return {
          content: createUnsupportedFileMessage(fileName),
          success: false,
          fileType: 'unknown',
          message: 'Unsupported file format'
        };
    }
  } catch (error) {
    console.error('Document processing error:', error);
    return {
      content: createErrorMessage(fileName, error instanceof Error ? error.message : 'Unknown error'),
      success: false,
      fileType,
      message: 'Processing failed'
    };
  }
};

const determineFileType = (fileName: string, mimeType?: string): 'text' | 'pdf' | 'word' | 'unknown' => {
  const extension = fileName.toLowerCase().split('.').pop() || '';
  
  if (mimeType?.includes('text') || ['txt', 'md', 'csv', 'json', 'xml', 'html'].includes(extension)) {
    return 'text';
  }
  
  if (mimeType?.includes('pdf') || extension === 'pdf') {
    return 'pdf';
  }
  
  if (mimeType?.includes('word') || ['doc', 'docx'].includes(extension)) {
    return 'word';
  }
  
  return 'unknown';
};

const processTextFile = async (uri: string, fileName: string): Promise<DocumentProcessingResult> => {
  try {
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    if (!content || content.trim().length === 0) {
      return {
        content: createEmptyFileMessage(fileName),
        success: false,
        fileType: 'text',
        message: 'File appears to be empty'
      };
    }
    
    return {
      content: content.trim(),
      success: true,
      fileType: 'text'
    };
  } catch (error) {
    // Try with different encoding if UTF8 fails
    try {
      const content = await FileSystem.readAsStringAsync(uri);
      return {
        content: content.trim() || createEmptyFileMessage(fileName),
        success: !!content.trim(),
        fileType: 'text'
      };
    } catch (fallbackError) {
      throw new Error('Could not read text file');
    }
  }
};

const processPDFFile = async (uri: string, fileName: string, fileSize?: number): Promise<DocumentProcessingResult> => {
  try {
    // First, try to read the PDF as UTF-8 text
    let rawContent = '';
    try {
      rawContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.UTF8
      });
    } catch (utf8Error) {
      // If UTF-8 fails, try reading as base64 and then convert
      try {
        const base64Content = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64
        });
        // Try to decode base64 content
        rawContent = atob(base64Content);
      } catch (base64Error) {
        console.log('Both UTF-8 and Base64 reading failed:', utf8Error, base64Error);
      }
    }
    
    if (rawContent && rawContent.length > 0) {
      // Extract readable text using enhanced pattern matching
      const extractedText = extractTextFromPDFContent(rawContent);
      
      // Check if we got meaningful text (more than just random characters)
      const meaningfulText = extractedText.length > 100 && 
                           /[a-zA-Z\s]{20,}/.test(extractedText) &&
                           !extractedText.includes('����') && // Filter out garbled text
                           extractedText.split(/\s+/).length > 10; // Must have at least 10 words
      
      if (meaningfulText) {
        return {
          content: cleanExtractedText(extractedText),
          success: true,
          fileType: 'pdf',
          message: 'PDF text extracted successfully'
        };
      }
    }
    
    // If we can't extract meaningful text, provide a helpful placeholder
    return {
      content: createPDFPlaceholderMessage(fileName, fileSize),
      success: true, // Still successful upload, just need manual processing
      fileType: 'pdf',
      message: 'PDF uploaded - manual text extraction may be needed'
    };
    
  } catch (error) {
    console.error('PDF processing error:', error);
    return {
      content: createPDFPlaceholderMessage(fileName, fileSize),
      success: true,
      fileType: 'pdf',
      message: 'PDF uploaded successfully'
    };
  }
};

const processWordFile = async (uri: string, fileName: string): Promise<DocumentProcessingResult> => {
  // Word files require special handling - for now, provide guidance
  return {
    content: createWordFileMessage(fileName),
    success: true,
    fileType: 'word',
    message: 'Word document uploaded - conversion to text recommended'
  };
};

const extractTextFromPDFContent = (rawContent: string): string => {
  let extractedText = '';
  
  // Enhanced text extraction patterns for PDF content
  const patterns = [
    // Text streams
    /stream\s*([^]*?)\s*endstream/gi,
    // Parenthetical content (common in PDFs)
    /\(([^)]+)\)/g,
    // Text objects
    /BT\s+([^]*?)\s+ET/gi,
    // Show text commands
    /Tj\s*\[(.*?)\]/gi,
    // Simple text patterns
    /\/F\d+\s+\d+\s+Tf\s*([A-Za-z0-9\s.,!?;:'"()-]+)/gi,
    // Any readable text sequences
    /[A-Za-z][A-Za-z0-9\s.,!?;:'"()-]{10,}/g
  ];
  
  for (const pattern of patterns) {
    const matches = rawContent.match(pattern);
    if (matches) {
      for (const match of matches) {
        let cleanText = match
          .replace(/stream|endstream|BT|ET|Tj|\[|\]|\(|\)|\/F\d+|\d+\s+Tf/gi, '')
          .replace(/[^\w\s.,!?;:'"()-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Only add if it contains meaningful text
        if (cleanText.length > 15 && /[a-zA-Z]{5,}/.test(cleanText)) {
          extractedText += cleanText + ' ';
        }
      }
    }
  }
  
  // Try a more direct approach - look for readable sentences
  const sentences = rawContent.match(/[A-Z][a-zA-Z0-9\s.,!?;:'"()-]{20,}[.!?]/g);
  if (sentences) {
    for (const sentence of sentences) {
      const cleanSentence = sentence.replace(/[^\w\s.,!?;:'"()-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanSentence.length > 20) {
        extractedText += cleanSentence + ' ';
      }
    }
  }
  
  return extractedText.trim();
};

const cleanExtractedText = (text: string): string => {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2') // Add paragraph breaks after sentences
    .replace(/^\s+|\s+$/gm, '') // Trim lines
    .replace(/\n{3,}/g, '\n\n') // Limit multiple line breaks
    .trim();
};

const createPDFPlaceholderMessage = (fileName: string, fileSize?: number): string => {
  const sizeText = fileSize ? ` (${(fileSize / 1024 / 1024).toFixed(1)} MB)` : '';
  
  return `PDF Document: ${fileName}${sizeText}

This PDF has been uploaded successfully! To get the most out of AI analysis with this document:

OPTION 1 - Copy & Paste Method (Recommended):
• Open your PDF in another app
• Copy the text you want to analyze
• Come back to the AI Chat and paste it in your question
• Example: "Analyze this text: [paste your content here]"

OPTION 2 - Manual Text Entry:
• Tap "Edit" on this document
• Type or paste the document content
• The AI will then be able to analyze the full text

OPTION 3 - Convert to Text:
• Save your PDF as a .txt file
• Upload the text version for full AI integration

The AI Chat is ready to help analyze any text content you provide from this document!`;
};

const createWordFileMessage = (fileName: string): string => {
  return `📄 Word Document: "${fileName}"

✅ Document uploaded successfully!

💡 To get the best experience:
1. Copy the text content from your Word document
2. Create a new text document with that content, or
3. Use the AI Chat feature to ask questions about this document

🤖 AI Features Available:
• Ask questions about the document content
• Get summaries and key points
• Extract specific information

The document is saved in your library and ready for use!`;
};

const createEmptyFileMessage = (fileName: string): string => {
  return `📄 Document: "${fileName}"

⚠️ This file appears to be empty or couldn't be read.

Please check:
• The file contains text content
• The file isn't corrupted
• Try uploading a different file format

Supported formats: .txt, .md, .csv, and other text files work best.`;
};

const createUnsupportedFileMessage = (fileName: string): string => {
  return `📄 File: "${fileName}"

❌ This file format is not directly supported.

✅ Recommended formats:
• Text files (.txt, .md, .csv)
• PDF documents
• Word documents (.doc, .docx)

💡 Workaround:
1. Convert your file to a text format
2. Copy and paste the content into a new text document
3. Use the AI Chat feature for document analysis`;
};

const createErrorMessage = (fileName: string, error: string): string => {
  return `📄 Document: "${fileName}"

❌ Processing Error: ${error}

💡 What you can do:
1. Try uploading the file again
2. Check the file isn't corrupted
3. Convert to a text format (.txt, .md)
4. Use a smaller file size if the file is very large

The file has been saved, but manual text input may be needed for full functionality.`;
};