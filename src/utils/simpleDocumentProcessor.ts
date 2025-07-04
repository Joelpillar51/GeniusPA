import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

export interface ProcessedDocument {
  id: string;
  fileName: string;
  fileType: 'txt' | 'pdf' | 'docx' | 'unknown';
  extractedText: string;
  success: boolean;
  error?: string;
}

export const processUploadedDocument = async (
  file: DocumentPicker.DocumentPickerAsset
): Promise<ProcessedDocument> => {
  const fileExtension = getFileExtension(file.name);
  const fileType = determineFileType(fileExtension, file.mimeType);
  
  console.log(`Processing file: ${file.name}, type: ${fileType}, mime: ${file.mimeType}`);
  
  const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    let extractedText = '';
    
    switch (fileType) {
      case 'txt':
        extractedText = await extractTextFromTxtFile(file.uri);
        break;
      case 'pdf':
        extractedText = await extractTextFromPdfFile(file.uri, file.name);
        break;
      case 'docx':
        extractedText = await extractTextFromDocxFile(file.uri, file.name);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
    
    // Validate extracted text
    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error('No readable text content found in the document');
    }
    
    return {
      id: documentId,
      fileName: file.name,
      fileType,
      extractedText: extractedText.trim(),
      success: true
    };
    
  } catch (error) {
    console.error('Document processing failed:', error);
    return {
      id: documentId,
      fileName: file.name,
      fileType,
      extractedText: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown processing error'
    };
  }
};

const getFileExtension = (fileName: string): string => {
  return fileName.toLowerCase().split('.').pop() || '';
};

const determineFileType = (extension: string, mimeType?: string): 'txt' | 'pdf' | 'docx' | 'unknown' => {
  // Check by file extension first
  if (['txt', 'md', 'csv', 'json', 'log'].includes(extension)) {
    return 'txt';
  }
  if (extension === 'pdf') {
    return 'pdf';
  }
  if (['docx', 'doc'].includes(extension)) {
    return 'docx';
  }
  
  // Fallback to MIME type
  if (mimeType?.includes('text')) {
    return 'txt';
  }
  if (mimeType?.includes('pdf')) {
    return 'pdf';
  }
  if (mimeType?.includes('word') || mimeType?.includes('officedocument')) {
    return 'docx';
  }
  
  return 'unknown';
};

const extractTextFromTxtFile = async (uri: string): Promise<string> => {
  try {
    // First try UTF-8 encoding
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8
    });
    
    if (content && content.trim().length > 0) {
      return content.trim();
    }
    
    // If UTF-8 fails or returns empty, try default encoding
    const fallbackContent = await FileSystem.readAsStringAsync(uri);
    return fallbackContent.trim();
    
  } catch (error) {
    throw new Error(`Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const extractTextFromPdfFile = async (uri: string, fileName: string): Promise<string> => {
  try {
    console.log(`Attempting to extract text from PDF: ${fileName}`);
    
    // Method 1: Try to read as UTF-8 text (works for text-based PDFs)
    try {
      const rawContent = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.UTF8
      });
      
      if (rawContent && rawContent.length > 100) {
        const extractedText = extractTextFromPdfContent(rawContent);
        if (extractedText && extractedText.length > 50) {
          console.log(`Successfully extracted ${extractedText.length} characters from PDF`);
          return extractedText;
        }
      }
    } catch (utf8Error) {
      console.log('UTF-8 extraction failed, trying alternative method');
    }
    
    // Method 2: Try reading without encoding specification
    try {
      const rawContent = await FileSystem.readAsStringAsync(uri);
      
      if (rawContent && rawContent.length > 100) {
        const extractedText = extractTextFromPdfContent(rawContent);
        if (extractedText && extractedText.length > 50) {
          console.log(`Successfully extracted ${extractedText.length} characters from PDF (fallback method)`);
          return extractedText;
        }
      }
    } catch (fallbackError) {
      console.log('Fallback extraction also failed');
    }
    
    // If all methods fail, provide clear guidance
    throw new Error(`This PDF cannot be automatically processed. Please try:

1. Copy the text from the PDF and paste it into a text document
2. Save the PDF as a .txt file from your PDF viewer
3. Use a different PDF that contains selectable text (not scanned images)

Note: PDFs with scanned images or complex formatting may not work with automatic text extraction.`);
    
  } catch (error) {
    console.error('PDF processing error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process PDF document');
  }
};

const extractTextFromDocxFile = async (uri: string, fileName: string): Promise<string> => {
  // DOCX files are ZIP archives with XML content
  // Without a proper DOCX parser library, we'll provide guidance
  throw new Error('DOCX files require conversion - please save as .txt format or copy-paste the content');
};

const extractTextFromPdfContent = (rawContent: string): string => {
  let extractedTexts: string[] = [];
  
  // Pattern 1: Text between parentheses (common in PDF text objects)
  const parenthesesMatches = rawContent.match(/\(([^)]{5,})\)/g);
  if (parenthesesMatches) {
    parenthesesMatches.forEach(match => {
      const text = match.replace(/^\(|\)$/g, '').trim();
      if (text.length > 5 && /[a-zA-Z]/.test(text) && !text.includes('\\')) {
        extractedTexts.push(text);
      }
    });
  }
  
  // Pattern 2: Text streams (more aggressive)
  const streamMatches = rawContent.match(/stream[\s\S]*?endstream/gi);
  if (streamMatches) {
    streamMatches.forEach(match => {
      const content = match.replace(/stream|endstream/gi, '');
      // Look for text objects within streams
      const textObjects = content.match(/BT[\s\S]*?ET/gi);
      if (textObjects) {
        textObjects.forEach(textObj => {
          const cleanText = textObj
            .replace(/BT|ET|Tf|Tj|TJ|Td|TD/gi, ' ')
            .replace(/\/F\d+/g, '')
            .replace(/\d+\.?\d*\s+/g, ' ')
            .replace(/[^\w\s.,!?;:'"()-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (cleanText.length > 10 && /[a-zA-Z]{3,}/.test(cleanText)) {
            extractedTexts.push(cleanText);
          }
        });
      }
    });
  }
  
  // Pattern 3: Direct text content (more permissive)
  const directTextMatches = rawContent.match(/[A-Za-z][A-Za-z0-9\s.,!?;:'"()-]{10,}/g);
  if (directTextMatches) {
    directTextMatches.forEach(text => {
      const cleanText = text.replace(/[^\w\s.,!?;:'"()-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanText.length > 15 && /[a-zA-Z]{5,}/.test(cleanText)) {
        extractedTexts.push(cleanText);
      }
    });
  }
  
  // Pattern 4: Look for any meaningful text sequences
  const meaningfulText = rawContent.match(/[A-Z][a-z][\w\s.,!?;:'"()-]{20,}/g);
  if (meaningfulText) {
    meaningfulText.forEach(text => {
      const cleanText = text.replace(/[^\w\s.,!?;:'"()-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanText.length > 20 && !cleanText.match(/^[\d\s.,]+$/)) {
        extractedTexts.push(cleanText);
      }
    });
  }
  
  // Remove duplicates and combine
  const uniqueTexts = [...new Set(extractedTexts)];
  const combinedText = uniqueTexts.join(' ').trim();
  
  // Final cleanup and formatting
  return combinedText
    .replace(/\s+/g, ' ')
    .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2')  // Add paragraph breaks
    .replace(/\n{3,}/g, '\n\n')  // Limit line breaks
    .trim();
};

export const getSupportedFileTypes = () => {
  return {
    supported: [
      { extension: 'txt', description: 'Text files (.txt, .md, .csv)' },
      { extension: 'pdf', description: 'PDF documents (text-based)' },
      { extension: 'docx', description: 'Word documents (.docx, .doc)' }
    ],
    recommendations: [
      'Text files (.txt) work best for AI analysis',
      'For PDFs, text-based PDFs work better than scanned images',
      'For Word documents, consider saving as .txt for better compatibility'
    ]
  };
};