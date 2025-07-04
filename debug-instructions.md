# Document Chat with URL Support - Debugging Guide

## What I've Built

### Core Features:
1. **File Upload**: Upload PDF, TXT, DOCX files for AI chat
2. **URL Processing**: Paste URLs to extract web content for AI chat  
3. **AI Chat**: Chat with AI about the document/URL content
4. **Smart Extraction**: Multiple methods for text extraction from different sources

### Key Files:
- `src/screens/DocumentChatScreen.tsx` - Main screen with tabs for file upload vs URL
- `src/utils/simpleDocumentProcessor.ts` - File processing (PDF, TXT, DOCX)
- `src/utils/simpleUrlProcessor.ts` - URL content extraction
- `src/utils/documentChatSystem.ts` - AI chat with document context

## Testing Steps

### 1. Test File Upload:
1. Go to Documents tab
2. Stay on "📁 Upload File" tab
3. Tap "Choose Document" button
4. Upload a .txt file (most reliable)
5. Should process and show AI chat interface

### 2. Test URL Processing:
1. Go to Documents tab  
2. Switch to "🔗 Paste URL" tab
3. Try test URLs:
   - `https://httpbin.org/html` (simple HTML test)
   - `https://example.com` (basic webpage)
   - `https://httpbin.org/json` (JSON content test)

### 3. Check Console Logs:
Open browser dev tools or Metro logs and look for:
- "DocumentChatScreen mounted successfully"
- "=== Testing URL Processing ==="
- "Processing URL: [your url]"
- "Response status: 200"
- "Successfully processed URL"

### 4. Debug Options:
- Tap "🔧 Test URL Processing" button to run network tests
- Check console for detailed error messages
- Try simpler URLs first (httpbin.org, example.com)

## Common Issues & Solutions

### Issue: "URL Processing Failed"
**Solutions:**
1. Check internet connection
2. Try simpler URLs (example.com, httpbin.org)
3. Some websites block automated access
4. Check console logs for specific error

### Issue: "Document Processing Failed" 
**Solutions:**
1. Try .txt files first (most reliable)
2. For PDFs: use text-based PDFs, not scanned images
3. Check file isn't corrupted
4. Try smaller files first

### Issue: AI Chat Not Working
**Solutions:**
1. Verify document/URL processed successfully
2. Check that content was extracted (should show character count)
3. Try asking simple questions first
4. Check OpenAI API connectivity

## Technical Details

### URL Processing Flow:
1. User enters URL
2. Validate URL format
3. Fetch content with proper headers
4. Detect content type (HTML, JSON, text)
5. Extract and clean text content
6. Create AI chat session with extracted content

### File Processing Flow:
1. User selects file
2. Determine file type (PDF, TXT, DOCX)
3. Extract text using appropriate method
4. Validate extracted content
5. Create AI chat session with text

### AI Chat Flow:
1. User asks question
2. System sends document content + question to OpenAI
3. AI responds based only on document content
4. Response displayed in chat interface

## Expected Behavior

### Successful URL Processing:
- Shows "Processing URL..." screen
- Displays "URL Processed Successfully!" alert
- Opens chat interface with URL title and character count
- AI can answer questions about the webpage content

### Successful File Processing:
- Shows "Processing Document..." screen  
- Displays "Document Processed Successfully!" alert
- Opens chat interface with filename and character count
- AI can answer questions about the file content

## Fallback Options

If URL processing has issues:
1. Download the webpage as HTML and upload as file
2. Copy text content and save as .txt file
3. Use file upload instead of URL processing
4. Try different URLs to isolate the issue

## Debug Commands

Run these in the console if needed:
```javascript
// Test basic URL fetch
fetch('https://httpbin.org/html').then(r => r.text()).then(console.log)

// Test document picker availability  
console.log(require('expo-document-picker'))

// Test file system
console.log(require('expo-file-system'))
```