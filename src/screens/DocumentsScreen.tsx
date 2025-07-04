import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMeetingStore } from '../state/meetingStore';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { EditableText } from '../components/EditableText';
import { SummarizeButton } from '../components/SummarizeButton';
import { UpgradeModal } from '../components/UpgradeModal';
import { AILoadingIndicator } from '../components/AILoadingIndicator';
import { TruncatedText } from '../components/TruncatedText';
import { CircularDotSpinner } from '../components/CircularDotSpinner';
import { Document } from '../types/meeting';
import { getOpenAIChatResponse, getOpenAITextResponse } from '../api/chat-service';
import { processDocumentFromUrl, getSupportedUrlTypes } from '../utils/urlDocumentProcessor';

export const DocumentsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { documents, addDocument, updateDocument, deleteDocument } = useMeetingStore();
  const { canAddDocument, addDocumentUsage, removeDocumentUsage } = useSubscriptionStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

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
    setProcessingMessage('Fetching URL content...');
    setProcessingProgress(25);
    
    try {
      // Process the URL and extract content
      setProcessingMessage('Extracting and analyzing content...');
      setProcessingProgress(50);
      const processedUrl = await processDocumentFromUrl(urlInput.trim());
      setProcessingProgress(75);
      
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
        setProcessingMessage('');
        setProcessingProgress(100);
        
        Alert.alert(
          'URL Processed Successfully!',
          `Content from "${processedUrl.title}" has been extracted and added to your documents.`,
          [{ text: 'OK' }]
        );
        
      } else {
        // Processing failed
        Alert.alert(
          'URL Processing Failed',
          processedUrl.error || 'Could not extract content from this URL. Please try:\n\n• Checking the URL is correct and accessible\n• Using a different webpage or document URL\n• Try a different URL',
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
      setProcessingMessage('');
      setProcessingProgress(0);
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

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('url/')) {
      return 'link';
    }
    return 'document-outline';
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith('url/')) {
      const urlType = mimeType.split('/')[1];
      return urlType === 'webpage' ? 'Web Page' : 
             urlType === 'text' ? 'Web Text' :
             urlType === 'pdf' ? 'Web PDF' :
             'Web Content';
    }
    return 'Document';
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">Documents</Text>
          <Text className="text-gray-600 mt-1">{documents.length} documents from URLs</Text>
        </View>

        {/* Static URL Input Section */}
        <View className="px-6 py-3 border-b border-gray-200 bg-white">
          <View className="flex-row items-center mb-2">
            <View className="w-6 h-6 bg-blue-100 rounded-full items-center justify-center mr-2">
              <Ionicons name="link" size={14} color="#3B82F6" />
            </View>
            <Text className="text-base font-semibold text-gray-900">Add from URL</Text>
          </View>
          
          <View className="flex-row items-center">
            <TextInput
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="Paste article or document URL here"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm mr-2"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isProcessingUrl}
            />
            <Pressable
              onPress={processUrl}
              disabled={!urlInput.trim() || isProcessingUrl}
              className={`px-4 py-2 rounded-lg ${
                urlInput.trim() && !isProcessingUrl ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              {isProcessingUrl ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                </View>
              ) : (
                <Text className="text-white font-medium text-sm">Add</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Info Section */}
          <View className="px-6 py-3">
            {/* Supported URL Types */}
            <View className="bg-blue-50 rounded-lg p-3 mb-3">
              <Text className="text-blue-900 font-medium mb-1 text-sm">✅ Works Great With:</Text>
              <Text className="text-blue-800 text-xs">• Web articles • Documentation • Wikipedia • GitHub</Text>
            </View>

            {/* Example URLs */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2 text-sm">💡 Try these examples:</Text>
              {[
                'https://en.wikipedia.org/wiki/Artificial_intelligence',
                'https://docs.expo.dev/guides/overview/',
                'https://github.com/facebook/react-native/blob/main/README.md'
              ].map((exampleUrl, index) => (
                <Pressable
                  key={index}
                  onPress={() => setUrlInput(exampleUrl)}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-2 mb-1"
                >
                  <Text className="text-blue-600 text-xs">{exampleUrl}</Text>
                </Pressable>
              ))}
            </View>

            {/* Processing Status */}
            {isProcessingUrl && (
              <View className="mb-4">
                <AILoadingIndicator 
                  message={processingMessage} 
                  progress={processingProgress}
                />
              </View>
            )}
          </View>

            {/* Documents Section */}
            <View className="px-6">
              {sortedDocuments.length > 0 && (
                <View className="border-t border-gray-200 pt-3 mb-3">
                  <Text className="text-base font-semibold text-gray-900">Your Documents ({sortedDocuments.length})</Text>
                </View>
              )}
              
              {sortedDocuments.length === 0 ? (
                <View className="items-center py-8 border-t border-gray-200">
                  <Ionicons name="link-outline" size={32} color="#9CA3AF" />
                  <Text className="text-gray-500 text-sm mt-2">No documents yet</Text>
                  <Text className="text-gray-400 text-center mt-1 text-xs">
                    Add your first document from a URL above
                  </Text>
                </View>
              ) : (
                <View className="pb-4">
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
                          name={getFileIcon(document.type)}
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
                            <View className="ml-2 px-2 py-1 bg-blue-100 rounded-md">
                              <Text className="text-blue-600 text-xs font-medium">
                                {getFileTypeLabel(document.type)}
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
                        <View className="mt-2">
                          <TruncatedText
                            text={document.summary}
                            wordLimit={15}
                            textStyle="text-gray-700 text-sm italic"
                            showEditIcon={false}
                            label="Summary"
                            useMarkdown={true}
                          />
                        </View>
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
                      <TruncatedText
                        text={document.transcript}
                        wordLimit={10}
                        onSave={(newTranscript) => updateDocument(document.id, { transcript: newTranscript })}
                        multiline
                        placeholder="Document content"
                        textStyle="text-gray-800 text-sm leading-relaxed"
                        showEditIcon={true}
                        label="Content"
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
          </View>
        </ScrollView>
        
        {/* Upgrade Modal */}
        <UpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          context={{
            feature: 'Documents',
            limitation: 'Free users can only add 1 document total (even after deletion).',
            benefits: [
              'Add up to 100 documents with Pro',
              'Unlimited documents with Premium',
              'Process larger web content faster',
              'Access to premium URL processing features',
            ],
          }}
        />
      </View>
    </SafeAreaView>
  );
};