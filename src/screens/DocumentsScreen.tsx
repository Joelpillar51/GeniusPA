import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
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
import { processDocumentContent } from '../utils/documentProcessor';

export const DocumentsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { documents, addDocument, updateDocument, deleteDocument } = useMeetingStore();
  const { canAddDocument, addDocumentUsage, removeDocumentUsage } = useSubscriptionStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const sortedDocuments = documents.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

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
        type: ['text/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Show processing alert for large files
        if (file.size && file.size > 1024 * 1024) { // 1MB
          Alert.alert(
            'Processing Large File',
            `Processing "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)} MB). This may take a moment.`,
            [{ text: 'OK', onPress: () => processDocument(file) }]
          );
        } else {
          await processDocument(file);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert(
        'Document Error', 
        'Failed to load document. Please try again or choose a different file format.'
      );
    }
  };

  const processDocument = async (file: DocumentPicker.DocumentPickerAsset) => {
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
      // Process document using the utility function
      const result = await processDocumentContent(file.uri, file.name, file.mimeType);
      
      // Update document with processed content
      updateDocument(newDocument.id, {
        transcript: result.content,
        isProcessing: false,
      });

      // Show success message for successful processing
      if (result.success && result.message) {
        setTimeout(() => {
          Alert.alert('Document Processed', result.message, [{ text: 'OK' }]);
        }, 500);
      }

    } catch (error) {
      console.error('Error processing document:', error);
      updateDocument(newDocument.id, {
        transcript: `Document "${file.name}" encountered an error during processing.

Error details: ${error instanceof Error ? error.message : 'Unknown error'}

The document has been saved to your library. You can:
1. Try uploading the document again
2. Convert to a text format for better compatibility
3. Use the AI Chat feature to ask questions about this document

Supported formats work best: .txt, .md, .csv, and some PDFs.`,
        isProcessing: false,
      });
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
    
    if (mimeType.includes('pdf') || extension === 'pdf') return 'document-text';
    if (mimeType.includes('text') || ['txt', 'md', 'csv'].includes(extension)) return 'document-outline';
    if (mimeType.includes('word') || ['doc', 'docx'].includes(extension)) return 'document';
    return 'document-outline';
  };

  const getFileTypeLabel = (mimeType: string, fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    
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

        {/* Upload Button */}
        <View className="py-8 items-center border-b border-gray-200">
          <Pressable
            onPress={pickDocument}
            className="w-20 h-20 rounded-full bg-emerald-500 items-center justify-center"
          >
            <Ionicons name="add" size={32} color="white" />
          </Pressable>
          <Text className="mt-4 text-gray-600 text-center px-6 font-medium">
            Upload a document to analyze with AI
          </Text>
          <Text className="text-gray-500 text-sm text-center px-6 mt-2">
            Supports text files (.txt, .md, .csv) and PDFs
          </Text>
          <Text className="text-gray-400 text-xs text-center px-6 mt-1">
            Text files work best • PDFs will be processed automatically
          </Text>
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
                      
                      {document.isProcessing && (
                        <Text className="text-emerald-500 text-sm mt-1">
                          Processing...
                        </Text>
                      )}
                      
                      {document.transcript && !document.isProcessing && !document.summary && 
                       document.transcript !== "PDF content extraction is not available in this demo. Please upload text files for full functionality." && (
                        <Text className="text-emerald-600 text-sm mt-1 font-medium">
                          ✓ Ready to summarize
                        </Text>
                      )}
                      
                      {document.transcript && !document.isProcessing && !document.summary && 
                       document.transcript !== "PDF content extraction is not available in this demo. Please upload text files for full functionality." && (
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