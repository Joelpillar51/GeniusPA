import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useMeetingStore } from '../state/meetingStore';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { EditableText } from '../components/EditableText';
import { SummarizeButton } from '../components/SummarizeButton';
import { UpgradeModal } from '../components/UpgradeModal';
import { Document } from '../types/meeting';
import { getOpenAIChatResponse, getOpenAITextResponse } from '../api/chat-service';
import { processUploadedDocument } from '../utils/simpleDocumentProcessor';
import { processDocumentFromUrl } from '../utils/urlDocumentProcessor';

export const DocumentsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { documents, addDocument, updateDocument, deleteDocument } = useMeetingStore();
  const { canAddDocument, addDocumentUsage, removeDocumentUsage } = useSubscriptionStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);

  const sortedDocuments = documents.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const processUrl = async () => {
    if (!urlInput.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    // Check subscription limits
    const documentCheck = canAddDocument();
    if (!documentCheck.allowed) {
      Alert.alert('Document Limit Reached', documentCheck.reason!, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => setShowUpgradeModal(true) },
      ]);
      return;
    }

    setIsProcessingUrl(true);
    
    try {
      // Process the URL and extract content
      const processedUrl = await processDocumentFromUrl(urlInput.trim());
      
      if (processedUrl.success && processedUrl.extractedText) {
        // Create document from URL content
        const newDocument: Document = {
          id: Date.now().toString(),
          name: processedUrl.title,
          uri: processedUrl.url,
          type: `url/${processedUrl.contentType}`,
          createdAt: new Date(),
          isProcessing: false,
          transcript: processedUrl.extractedText,
        };

        // Track usage
        const usageAdded = addDocumentUsage();
        if (!usageAdded) {
          console.warn('Failed to track document usage');
        }

        addDocument(newDocument);
        setUrlInput('');
        
        Alert.alert(
          'URL Processed Successfully!',
          `Content from "${processedUrl.title}" has been extracted and added to your documents.`,
          [{ text: 'OK' }]
        );
        
      } else {
        // Processing failed
        Alert.alert(
          'URL Processing Failed',
          processedUrl.error || 'Could not extract content from this URL. Please try:\n\n• Checking the URL is correct and accessible\n• Using a different webpage or document URL\n• Uploading a file instead',
          [{ text: 'Try Again' }]
        );
      }
    } catch (error) {
      console.error('URL processing error:', error);
      Alert.alert(
        'Processing Error',
        'Failed to process the URL. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessingUrl(false);
    }
  };

  const pickDocument = async () => {
    // Check subscription limits
    const documentCheck = canAddDocument();
    if (!documentCheck.allowed) {
      Alert.alert('Document Limit Reached', documentCheck.reason!, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => setShowUpgradeModal(true) },
      ]);
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/plain',
          'text/markdown', 
          'text/csv',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/*'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('Selected file:', {
          name: file.name,
          size: file.size,
          type: file.mimeType,
          uri: file.uri
        });
        
        // Show processing alert for large files
        if (file.size && file.size > 5 * 1024 * 1024) { // 5MB
          Alert.alert(
            'Large File Detected',
            `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. Large files may take longer to process or may fail. Continue?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Process Anyway', onPress: () => processDocument(file) }
            ]
          );
        } else {
          await processDocument(file);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert(
        'File Selection Error', 
        'Failed to select document. Please try again or choose a different file.',
        [{ text: 'OK' }]
      );
    }
  };

  const processDocument = async (file: DocumentPicker.DocumentPickerAsset) => {
    console.log('Processing document:', file.name, file.mimeType, file.size);
    
    // Create initial document entry
    const newDocument: Document = {
      id: Date.now().toString(),
      name: file.name,
      uri: file.uri,
      type: file.mimeType || 'unknown',
      createdAt: new Date(),
      isProcessing: true,
    };

    // Track usage
    const usageAdded = addDocumentUsage();
    if (!usageAdded) {
      console.warn('Failed to track document usage');
    }

    addDocument(newDocument);

    try {
      // Process document using the reliable processor
      const result = await processUploadedDocument(file);
      
      if (result.success && result.extractedText) {
        // Update document with successfully extracted content
        updateDocument(newDocument.id, {
          transcript: result.extractedText,
          isProcessing: false,
        });

        console.log(`Successfully processed ${file.name}: ${result.extractedText.length} characters`);
        
        // Show success message
        setTimeout(() => {
          Alert.alert(
            '✅ Document Processed Successfully!',
            `"${file.name}" has been processed and ${result.extractedText.length} characters of text were extracted.\n\nYou can now:\n• View and edit the content\n• Generate summaries\n• Use it in AI Chat`,
            [{ text: 'OK' }]
          );
        }, 500);
        
      } else {
        // Processing failed - show error and helpful content
        const errorContent = `Document "${file.name}" could not be processed automatically.

Error: ${result.error || 'Unknown processing error'}

What you can do:
1. For PDFs: Try saving as a text file (.txt) first
2. For Word docs: Copy and paste the text content
3. Make sure the file contains readable text (not just images)
4. Try uploading a different file format

Supported formats:
• Text files (.txt, .md, .csv) - Work best
• PDFs with selectable text - Usually work
• Word documents (.docx) - May need conversion

You can edit this document and paste the text content manually.`;

        updateDocument(newDocument.id, {
          transcript: errorContent,
          isProcessing: false,
        });

        setTimeout(() => {
          Alert.alert(
            '⚠️ Document Processing Failed',
            `${result.error || 'Could not extract text from this document.'}\n\nThe document has been saved and you can:\n• Edit it manually to add content\n• Try converting to .txt format first\n• Check if the file contains readable text`,
            [{ text: 'OK' }]
          );
        }, 500);
      }

    } catch (error) {
      console.error('Error processing document:', error);
      
      // Update with generic error message
      updateDocument(newDocument.id, {
        transcript: `Document "${file.name}" encountered an error during processing.

Error: ${error instanceof Error ? error.message : 'Unknown error'}

This could be due to:
• Unsupported file format
• Corrupted file
• Network issues
• File too large or complex

Try:
1. Converting to .txt format first
2. Using a smaller file
3. Checking the file isn't corrupted
4. Uploading a different document

You can edit this document to add content manually.`,
        isProcessing: false,
      });

      Alert.alert(
        'Processing Error',
        'An error occurred while processing the document. The document has been saved and you can edit it manually.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDeleteDocument = (document: Document) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDocument(document.id);
            removeDocumentUsage();
          },
        },
      ]
    );
  };

  const getFileIcon = (mimeType: string, fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    
    if (mimeType.startsWith('url/')) return 'link';
    if (mimeType.includes('pdf') || extension === 'pdf') return 'document-text';
    if (mimeType.includes('text') || ['txt', 'md', 'csv'].includes(extension)) return 'document-outline';
    if (mimeType.includes('word') || ['doc', 'docx'].includes(extension)) return 'document';
    return 'document-outline';
  };

  const getFileTypeLabel = (mimeType: string, fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    
    if (mimeType.startsWith('url/')) {
      const urlType = mimeType.split('/')[1];
      return urlType === 'webpage' ? 'Web' : urlType.toUpperCase();
    }
    if (mimeType.includes('pdf') || extension === 'pdf') return 'PDF';
    if (mimeType.includes('text') || ['txt', 'md', 'csv'].includes(extension)) return 'Text';
    if (mimeType.includes('word') || ['doc', 'docx'].includes(extension)) return 'Word';
    return 'Doc';
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">Documents</Text>
          <Text className="text-gray-600 mt-1">{documents.length} documents</Text>
        </View>

        {/* Upload Section */}
        <View className="py-6 px-6 border-b border-gray-200">
          {/* File Upload */}
          <View className="items-center mb-6">
            <Pressable
              onPress={pickDocument}
              className="w-20 h-20 rounded-full bg-emerald-500 items-center justify-center mb-4"
            >
              <Ionicons name="add" size={32} color="white" />
            </Pressable>
            <Text className="text-gray-600 text-center font-medium">
              Upload a document to analyze with AI
            </Text>
            <Text className="text-gray-500 text-sm text-center mt-1">
              Supports text files (.txt, .md, .csv) and PDFs
            </Text>
          </View>

          {/* URL Input Section */}
          <View className="border-t border-gray-100 pt-6">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="link" size={18} color="#3B82F6" />
              </View>
              <Text className="text-gray-900 font-medium text-base">Or paste a URL</Text>
            </View>
            
            <View className="flex-row items-center">
              <TextInput
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder="https://example.com/article or document"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base mr-3"
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isProcessingUrl}
              />
              <Pressable
                onPress={processUrl}
                disabled={!urlInput.trim() || isProcessingUrl}
                className={`px-4 py-3 rounded-xl ${
                  urlInput.trim() && !isProcessingUrl ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                {isProcessingUrl ? (
                  <Text className="text-white font-medium">...</Text>
                ) : (
                  <Text className="text-white font-medium">Add</Text>
                )}
              </Pressable>
            </View>
            
            <Text className="text-gray-400 text-xs mt-2">
              Web articles, documentation, and online text content work best
            </Text>
          </View>
        </View>

        {/* Documents List */}
        <ScrollView className="flex-1">
          {sortedDocuments.length === 0 ? (
            <View className="flex-1 items-center justify-center py-12">
              <Ionicons name="document-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg mt-4">No documents yet</Text>
              <Text className="text-gray-400 text-center mt-2 px-6">
                Upload your first document to see it here
              </Text>
            </View>
          ) : (
            <View className="px-6 py-4">
              {sortedDocuments.map((document) => (
                <Pressable 
                  key={document.id} 
                  onPress={() => navigation.navigate('DocumentDetail', { documentId: document.id })}
                  className="mb-4 p-4 bg-gray-50 rounded-lg"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <Ionicons
                          name={getFileIcon(document.type, document.name)}
                          size={20}
                          color="#6B7280"
                        />
                        <View className="ml-2 flex-1">
                          <View className="flex-row items-center">
                            <View className="flex-1">
                              <EditableText
                                text={document.name}
                                onSave={(newName) => updateDocument(document.id, { name: newName })}
                                placeholder="Document name"
                                maxLength={100}
                                textStyle="font-semibold text-gray-900"
                              />
                            </View>
                            <View className="ml-2 px-2 py-1 bg-gray-100 rounded-md">
                              <Text className="text-gray-600 text-xs font-medium">
                                {getFileTypeLabel(document.type, document.name)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      
                      <Text className="text-gray-600 text-sm">
                        {new Date(document.createdAt).toLocaleDateString()} at{' '}
                        {new Date(document.createdAt).toLocaleTimeString()}
                      </Text>
                      
                      {document.type.startsWith('url/') && (
                        <Text className="text-blue-600 text-xs mt-1" numberOfLines={1}>
                          🔗 {document.uri}
                        </Text>
                      )}
                      
                      {document.isProcessing && (
                        <Text className="text-emerald-500 text-sm mt-1">
                          Processing...
                        </Text>
                      )}
                      
                      {document.transcript && !document.isProcessing && !document.summary && 
                       document.transcript.length > 100 && (
                        <Text className="text-emerald-600 text-sm mt-1 font-medium">
                          ✓ Ready to summarize
                        </Text>
                      )}
                      
                      {document.transcript && !document.isProcessing && !document.summary && 
                       document.transcript.length > 100 && (
                        <View className="mt-2">
                          <SummarizeButton
                            content={document.transcript}
                            onSummaryGenerated={(summary) => updateDocument(document.id, { summary })}
                            contentType="document"
                            size="small"
                            variant="secondary"
                          />
                        </View>
                      )}
                      
                      {document.summary && (
                        <Text className="text-gray-700 text-sm mt-2 italic">
                          {document.summary}
                        </Text>
                      )}
                    </View>
                    
                    <Pressable
                      onPress={() => handleDeleteDocument(document)}
                      className="p-2 ml-4"
                    >
                      <Ionicons name="trash-outline" size={24} color="#EF4444" />
                    </Pressable>
                  </View>
                  
                  {document.transcript && (
                    <View className="mt-3 pt-3 border-t border-gray-200">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-600 text-xs font-medium uppercase tracking-wide">
                          Content
                        </Text>
                      </View>
                      <EditableText
                        text={document.transcript}
                        onSave={(newTranscript) => updateDocument(document.id, { transcript: newTranscript })}
                        multiline
                        placeholder="Document content"
                        textStyle="text-gray-800 text-sm leading-relaxed"
                        showEditIcon={true}
                      />
                      {document.transcript.includes('📄') && (
                        <Text className="text-emerald-600 text-xs mt-2 font-medium">
                          💡 Tap to edit content or add text manually
                        </Text>
                      )}
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
        
        {/* Upgrade Modal */}
        <UpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          context={{
            feature: 'Documents',
            limitation: 'Free users can only add 1 document total (even after deletion).',
            benefits: [
              'Upload up to 100 documents with Pro',
              'Unlimited documents with Premium',
              'Process large files faster',
            ],
          }}
        />
      </View>
    </SafeAreaView>
  );
};