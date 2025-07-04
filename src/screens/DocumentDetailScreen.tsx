import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMeetingStore } from '../state/meetingStore';
import { EditableText } from '../components/EditableText';
import { SummarizeButton } from '../components/SummarizeButton';
import { ExportOptions } from '../components/ExportOptions';
import { Document } from '../types/meeting';
import { getOpenAIChatResponse } from '../api/chat-service';

interface DocumentDetailScreenProps {
  route: {
    params: {
      documentId: string;
    };
  };
  navigation: any;
}

export const DocumentDetailScreen: React.FC<DocumentDetailScreenProps> = ({ route, navigation }) => {
  const { documentId } = route.params;
  const { documents, updateDocument, deleteDocument } = useMeetingStore();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const document = documents.find(d => d.id === documentId);

  if (!document) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Document not found</Text>
      </SafeAreaView>
    );
  }

  const regenerateSummary = async () => {
    if (!document.transcript) {
      Alert.alert('No Content', 'Please add content first to generate a summary.');
      return;
    }

    setIsSummarizing(true);
    try {
      const summaryResponse = await getOpenAIChatResponse(
        `Please provide a detailed summary of this document. Include key topics, main points, and any important details:\n\n${document.transcript}`
      );

      updateDocument(document.id, {
        summary: summaryResponse.content,
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      Alert.alert('Error', 'Failed to generate summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDelete = () => {
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
            navigation.goBack();
          },
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
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
              <Ionicons name="arrow-back" size={24} color="#6B7280" />
            </Pressable>
            
            <View className="flex-row">
              <Pressable onPress={() => setExportModalVisible(true)} className="p-2 mr-2">
                <Ionicons name="share-outline" size={24} color="#10B981" />
              </Pressable>
              <Pressable onPress={handleDelete} className="p-2">
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </Pressable>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1">
          <View className="px-6 py-4">
            {/* Title with Icon */}
            <View className="flex-row items-center mb-4">
              <Ionicons
                name={getFileIcon(document.type)}
                size={28}
                color="#6B7280"
              />
              <View className="ml-3 flex-1">
                <EditableText
                  text={document.name}
                  onSave={(newName) => updateDocument(document.id, { name: newName })}
                  placeholder="Document name"
                  maxLength={100}
                  textStyle="text-2xl font-bold text-gray-900"
                />
              </View>
            </View>

            {/* Metadata */}
            <View className="mb-6">
              <Text className="text-gray-600 text-sm">
                Uploaded on {new Date(document.createdAt).toLocaleDateString()} at{' '}
                {new Date(document.createdAt).toLocaleTimeString()}
              </Text>
              <Text className="text-gray-600 text-sm">
                Type: {document.type}
              </Text>
            </View>

            {/* Summary Section */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-gray-900">Summary</Text>
                <Pressable
                  onPress={regenerateSummary}
                  disabled={isSummarizing}
                  className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2"
                >
                  <Ionicons 
                    name="refresh" 
                    size={16} 
                    color={isSummarizing ? "#9CA3AF" : "#6B7280"} 
                  />
                  <Text className={`ml-1 text-sm ${isSummarizing ? "text-gray-400" : "text-gray-600"}`}>
                    {isSummarizing ? "Generating..." : "Regenerate"}
                  </Text>
                </Pressable>
              </View>
              
              {document.summary ? (
                <EditableText
                  text={document.summary}
                  onSave={(newSummary) => updateDocument(document.id, { summary: newSummary })}
                  multiline
                  placeholder="No summary available"
                  textStyle="text-gray-700 leading-relaxed"
                />
              ) : document.transcript && !document.isProcessing && 
                 document.transcript !== "PDF content extraction is not available in this demo. Please upload text files for full functionality." ? (
                <SummarizeButton
                  content={document.transcript}
                  onSummaryGenerated={(summary) => updateDocument(document.id, { summary })}
                  contentType="document"
                  size="medium"
                  variant="primary"
                />
              ) : (
                <Text className="text-gray-500 italic">
                  No summary available. {document.transcript ? "Tap regenerate to create one." : "Add content first."}
                </Text>
              )}
            </View>

            {/* Content Section */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Content</Text>
              
              {document.isProcessing ? (
                <Text className="text-blue-500 italic">Processing...</Text>
              ) : document.transcript ? (
                document.transcript === "PDF content extraction is not available in this demo. Please upload text files for full functionality." ? (
                  <Text className="text-gray-500 italic">
                    {document.transcript}
                  </Text>
                ) : (
                  <EditableText
                    text={document.transcript}
                    onSave={(newTranscript) => updateDocument(document.id, { transcript: newTranscript })}
                    multiline
                    placeholder="No content available"
                    textStyle="text-gray-800 leading-relaxed"
                  />
                )
              ) : (
                <Text className="text-gray-500 italic">
                  No content available. The document may still be processing.
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
        
        {/* Export Modal */}
        <ExportOptions
          visible={exportModalVisible}
          onClose={() => setExportModalVisible(false)}
          data={document}
          type="document"
        />
      </View>
    </SafeAreaView>
  );
};