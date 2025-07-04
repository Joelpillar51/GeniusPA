import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useMeetingStore } from '../state/meetingStore';
import { Document } from '../types/meeting';
import { getOpenAIChatResponse, getOpenAITextResponse } from '../api/chat-service';

export const DocumentsScreen: React.FC = () => {
  const { documents, addDocument, updateDocument, deleteDocument } = useMeetingStore();

  const sortedDocuments = documents.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await processDocument(file);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
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

    addDocument(newDocument);

    try {
      // Read file content
      let content = '';
      
      if (file.mimeType?.includes('text')) {
        content = await FileSystem.readAsStringAsync(file.uri);
      } else if (file.mimeType?.includes('pdf')) {
        // For PDF, we'll use a mock since we don't have a PDF parser
        content = "PDF content extraction is not available in this demo. Please upload text files for full functionality.";
      } else {
        throw new Error('Unsupported file type');
      }

      // Generate summary using AI
      const summaryResponse = await getOpenAIChatResponse(
        `Please provide a concise summary of this document in 2-3 sentences:\n\n${content.substring(0, 4000)}`
      );

      // Update document with content and summary
      updateDocument(newDocument.id, {
        transcript: content,
        summary: summaryResponse.content,
        isProcessing: false,
      });

    } catch (error) {
      console.error('Error processing document:', error);
      updateDocument(newDocument.id, {
        isProcessing: false,
      });
      Alert.alert(
        'Processing Failed', 
        'Failed to process document. Please try uploading a text file.'
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
          onPress: () => deleteDocument(document.id),
        },
      ]
    );
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'document-text';
    if (mimeType.includes('text')) return 'document-outline';
    return 'document';
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
            className="w-20 h-20 rounded-full bg-green-500 items-center justify-center"
          >
            <Ionicons name="add" size={32} color="white" />
          </Pressable>
          <Text className="mt-4 text-gray-600 text-center px-6">
            Upload a document to transcribe and analyze
          </Text>
          <Text className="text-gray-500 text-sm text-center px-6 mt-2">
            Supports text files and PDFs
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
                <View key={document.id} className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <Ionicons
                          name={getFileIcon(document.type)}
                          size={20}
                          color="#6B7280"
                        />
                        <Text className="font-semibold text-gray-900 ml-2 flex-1">
                          {document.name}
                        </Text>
                      </View>
                      
                      <Text className="text-gray-600 text-sm">
                        {new Date(document.createdAt).toLocaleDateString()} at{' '}
                        {new Date(document.createdAt).toLocaleTimeString()}
                      </Text>
                      
                      {document.isProcessing && (
                        <Text className="text-blue-500 text-sm mt-1">
                          Processing...
                        </Text>
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
                  
                  {document.transcript && document.transcript !== "PDF content extraction is not available in this demo. Please upload text files for full functionality." && (
                    <View className="mt-3 pt-3 border-t border-gray-200">
                      <Text className="text-gray-800 text-sm leading-relaxed">
                        {document.transcript.length > 200
                          ? `${document.transcript.substring(0, 200)}...`
                          : document.transcript}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};