import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { processUploadedDocument, ProcessedDocument, getSupportedFileTypes } from '../utils/simpleDocumentProcessor';
import { 
  createDocumentChatSession, 
  getDocumentChatSession, 
  addMessageToDocumentChat, 
  generateSuggestedQuestions,
  DocumentChatSession,
  DocumentChatMessage 
} from '../utils/documentChatSystem';

export const DocumentChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // State management
  const [currentDocument, setCurrentDocument] = useState<ProcessedDocument | null>(null);
  const [chatSession, setChatSession] = useState<DocumentChatSession | null>(null);
  const [inputText, setInputText] = useState('');
  const [isProcessingDocument, setIsProcessingDocument] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatSession && chatSession.messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatSession?.messages.length]);

  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('Selected file:', file.name, file.mimeType, file.size);
        
        setIsProcessingDocument(true);
        
        try {
          // Process the document and extract text
          const processedDoc = await processUploadedDocument(file);
          
          if (processedDoc.success && processedDoc.extractedText) {
            // Create chat session with extracted text
            const session = createDocumentChatSession(
              processedDoc.id,
              processedDoc.fileName,
              processedDoc.extractedText
            );
            
            setCurrentDocument(processedDoc);
            setChatSession(session);
            
            // Generate suggested questions
            try {
              const suggestions = await generateSuggestedQuestions(processedDoc.extractedText);
              setSuggestedQuestions(suggestions);
              setShowSuggestions(true);
            } catch (error) {
              console.error('Error generating suggestions:', error);
            }
            
            Alert.alert(
              'Document Processed Successfully!',
              `${processedDoc.fileName} has been processed and is ready for AI chat. I can now answer questions about its content.`,
              [{ text: 'Start Chatting', style: 'default' }]
            );
            
          } else {
            // Processing failed
            Alert.alert(
              'Document Processing Failed',
              processedDoc.error || 'Could not extract text from this document. Please try:\n\n• Converting to .txt format\n• Using a different document\n• Ensuring the file contains readable text',
              [{ text: 'Try Another File', style: 'default' }]
            );
          }
        } catch (error) {
          console.error('Document processing error:', error);
          Alert.alert(
            'Processing Error',
            'Failed to process the document. Please try again with a different file or format.',
            [{ text: 'OK', style: 'default' }]
          );
        } finally {
          setIsProcessingDocument(false);
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
      setIsProcessingDocument(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !chatSession || isSendingMessage) return;
    
    const message = inputText.trim();
    setInputText('');
    setIsSendingMessage(true);
    setShowSuggestions(false);
    
    try {
      await addMessageToDocumentChat(chatSession.documentId, message);
      
      // Refresh the chat session to get updated messages
      const updatedSession = getDocumentChatSession(chatSession.documentId);
      if (updatedSession) {
        setChatSession(updatedSession);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
    setShowSuggestions(false);
  };

  const handleNewDocument = () => {
    setCurrentDocument(null);
    setChatSession(null);
    setSuggestedQuestions([]);
    setShowSuggestions(false);
    setInputText('');
  };

  const renderMessage = (message: DocumentChatMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <View key={message.id} className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
        <View className={`max-w-[80%] p-3 rounded-2xl ${
          isUser 
            ? 'bg-emerald-500 rounded-br-md' 
            : 'bg-gray-100 rounded-bl-md'
        }`}>
          <Text className={`${isUser ? 'text-white' : 'text-gray-900'} text-base leading-relaxed`}>
            {message.content}
          </Text>
          <Text className={`text-xs mt-2 ${isUser ? 'text-emerald-100' : 'text-gray-500'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (isProcessingDocument) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-lg font-semibold text-gray-900 mt-4 text-center">
            Processing Document...
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            Extracting text and preparing for AI chat
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentDocument || !chatSession) {
    const supportedTypes = getSupportedFileTypes();
    
    return (
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">Document Chat</Text>
          <Text className="text-gray-600 mt-1">Upload a document to chat with AI about its content</Text>
        </View>

        <ScrollView className="flex-1 px-6">
          {/* Upload Section */}
          <View className="py-12 items-center">
            <View className="w-24 h-24 bg-emerald-100 rounded-full items-center justify-center mb-6">
              <Ionicons name="document-text" size={40} color="#10B981" />
            </View>
            
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              Upload Your Document
            </Text>
            <Text className="text-gray-600 text-center mb-8 leading-relaxed">
              Upload a document and I'll extract the text so you can chat with an AI about its content
            </Text>

            <Pressable
              onPress={handleDocumentUpload}
              className="bg-emerald-500 px-8 py-4 rounded-xl flex-row items-center"
            >
              <Ionicons name="cloud-upload" size={24} color="white" />
              <Text className="text-white font-semibold text-lg ml-2">Choose Document</Text>
            </Pressable>
          </View>

          {/* Supported Formats */}
          <View className="bg-gray-50 rounded-2xl p-6 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Supported Formats</Text>
            {supportedTypes.supported.map((type, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text className="text-gray-700 ml-2">{type.description}</Text>
              </View>
            ))}
          </View>

          {/* Tips */}
          <View className="bg-blue-50 rounded-2xl p-6">
            <Text className="text-lg font-bold text-blue-900 mb-4">💡 Tips for Best Results</Text>
            {supportedTypes.recommendations.map((tip, index) => (
              <Text key={index} className="text-blue-800 mb-2 leading-relaxed">
                • {tip}
              </Text>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Chat interface
  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="px-4 py-3 border-b border-gray-200 bg-white">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
                {currentDocument.fileName}
              </Text>
              <Text className="text-sm text-gray-600">
                AI Chat • {currentDocument.fileType.toUpperCase()} • {Math.round(currentDocument.extractedText.length / 1000)}k chars
              </Text>
            </View>
            <Pressable
              onPress={handleNewDocument}
              className="ml-4 px-3 py-2 bg-gray-100 rounded-lg"
            >
              <Ionicons name="document-text" size={20} color="#6B7280" />
            </Pressable>
          </View>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          showsVerticalScrollIndicator={false}
        >
          {chatSession.messages.map(renderMessage)}
          
          {isSendingMessage && (
            <View className="items-start mb-4">
              <View className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
                <ActivityIndicator size="small" color="#6B7280" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggested Questions */}
        {showSuggestions && suggestedQuestions.length > 0 && (
          <View className="px-4 py-2 border-t border-gray-100">
            <Text className="text-sm font-medium text-gray-700 mb-2">Suggested questions:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {suggestedQuestions.map((question, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleSuggestedQuestion(question)}
                  className="bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2 mr-2"
                >
                  <Text className="text-emerald-700 text-sm">{question}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View className="px-4 py-3 border-t border-gray-200 bg-white" style={{ paddingBottom: insets.bottom + 12 }}>
          <View className="flex-row items-end">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask a question about this document..."
              multiline
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 max-h-32 text-base"
              style={{ textAlignVertical: 'top' }}
            />
            <Pressable
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isSendingMessage}
              className={`ml-3 w-12 h-12 rounded-full items-center justify-center ${
                inputText.trim() && !isSendingMessage ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={inputText.trim() && !isSendingMessage ? 'white' : '#9CA3AF'} 
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};