import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMeetingStore } from '../state/meetingStore';
import { ChatSession, ChatMessage, Recording, Document } from '../types/meeting';
import { getOpenAIChatResponse } from '../api/chat-service';
import { exportChatToPDF } from '../utils/pdfExport';
import { cn } from '../utils/cn';

export const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { recordings, documents, chatSessions, createChatSession, addMessageToSession } = useMeetingStore();
  const [inputText, setInputText] = useState('');
  const [selectedItem, setSelectedItem] = useState<{id: string, type: 'recording' | 'document', title: string} | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const allItems = [
    ...recordings.map(r => ({ id: r.id, type: 'recording' as const, title: r.title, hasContent: !!r.transcript })),
    ...documents.map(d => ({ id: d.id, type: 'document' as const, title: d.name, hasContent: !!d.transcript }))
  ].filter(item => item.hasContent);

  useEffect(() => {
    if (selectedItem) {
      // Always get the latest session from the store
      const existingSession = chatSessions.find(s => s.relatedItemId === selectedItem.id);
      if (existingSession) {
        setCurrentSession(existingSession);
      } else {
        const newSession: ChatSession = {
          id: `chat_${selectedItem.id}_${Date.now()}`,
          title: `Chat about ${selectedItem.title}`,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          relatedItemId: selectedItem.id,
          relatedItemType: selectedItem.type,
        };
        createChatSession(newSession);
        setCurrentSession(newSession);
      }
    } else {
      setCurrentSession(null);
    }
  }, [selectedItem]);

  // Update current session when chatSessions change
  useEffect(() => {
    if (selectedItem && currentSession) {
      const updatedSession = chatSessions.find(s => s.id === currentSession.id);
      if (updatedSession) {
        setCurrentSession(updatedSession);
      }
    }
  }, [chatSessions, selectedItem, currentSession?.id]);

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedItem || !currentSession) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
      relatedItemId: selectedItem.id,
    };

    addMessageToSession(currentSession.id, userMessage);
    setInputText('');
    setIsLoading(true);

    try {
      // Get the content for context
      const item = selectedItem.type === 'recording' 
        ? recordings.find(r => r.id === selectedItem.id)
        : documents.find(d => d.id === selectedItem.id);

      const content = item?.transcript || '';
      
      // Build context prompt
      const contextPrompt = `You are an AI assistant helping analyze ${selectedItem.type === 'recording' ? 'a meeting/class recording' : 'a document'}. Here is the content:

${content}

Now please answer the following question about this content: ${inputText.trim()}

Please provide a helpful and accurate response based only on the content provided.`;

      const response = await getOpenAIChatResponse(contextPrompt);

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        relatedItemId: selectedItem.id,
      };

      addMessageToSession(currentSession.id, assistantMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuestions = async () => {
    if (!selectedItem || !currentSession) return;

    setIsLoading(true);
    try {
      const item = selectedItem.type === 'recording' 
        ? recordings.find(r => r.id === selectedItem.id)
        : documents.find(d => d.id === selectedItem.id);

      const content = item?.transcript || '';
      
      const prompt = `Based on this ${selectedItem.type} content, generate 3 thoughtful questions that would help someone better understand or test their knowledge of this material:

${content}

Please format as a numbered list with clear, specific questions.`;

      const response = await getOpenAIChatResponse(prompt);

      const questionsMessage: ChatMessage = {
        id: `msg_${Date.now()}_questions`,
        role: 'assistant',
        content: `Here are some questions to help you engage with this content:\n\n${response.content}`,
        timestamp: new Date(),
        relatedItemId: selectedItem.id,
      };

      addMessageToSession(currentSession.id, questionsMessage);
    } catch (error) {
      console.error('Error generating questions:', error);
      Alert.alert('Error', 'Failed to generate questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportChat = async () => {
    if (!currentSession) return;

    try {
      await exportChatToPDF(currentSession);
    } catch (error) {
      console.error('Error exporting chat:', error);
      Alert.alert('Error', 'Failed to export chat. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">AI Chat</Text>
          <Text className="text-gray-600 mt-1">Ask questions about your content</Text>
        </View>

        {!selectedItem ? (
          /* Item Selection */
          <ScrollView className="flex-1">
            <View className="px-6 py-4">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Choose content to discuss:
              </Text>
              
              {allItems.length === 0 ? (
                <View className="items-center py-12">
                  <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
                  <Text className="text-gray-500 text-lg mt-4">No content available</Text>
                  <Text className="text-gray-400 text-center mt-2 px-6">
                    Record audio or upload documents first to start chatting
                  </Text>
                </View>
              ) : (
                allItems.map((item) => (
                  <Pressable
                    key={`${item.type}_${item.id}`}
                    onPress={() => setSelectedItem(item)}
                    className="mb-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <View className="flex-row items-center">
                      <Ionicons
                        name={item.type === 'recording' ? 'mic' : 'document-text'}
                        size={24}
                        color="#6B7280"
                      />
                      <Text className="ml-3 font-medium text-gray-900 flex-1">
                        {item.title}
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </ScrollView>
        ) : (
          /* Chat Interface */
          <View className="flex-1">
            {/* Selected Item Header */}
            <View className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <View className="flex-row items-center">
                <Pressable onPress={() => setSelectedItem(null)} className="mr-3">
                  <Ionicons name="arrow-back" size={24} color="#6B7280" />
                </Pressable>
                <Ionicons
                  name={selectedItem.type === 'recording' ? 'mic' : 'document-text'}
                  size={20}
                  color="#6B7280"
                />
                <Text className="ml-2 font-medium text-gray-900 flex-1">
                  {selectedItem.title}
                </Text>
                <Pressable onPress={generateQuestions} disabled={isLoading} className="p-2">
                  <Ionicons name="help-circle-outline" size={24} color="#3B82F6" />
                </Pressable>
                {currentSession && currentSession.messages.length > 0 && (
                  <Pressable onPress={exportChat} className="p-2">
                    <Ionicons name="share-outline" size={24} color="#10B981" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-6"
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {!currentSession || currentSession.messages.length === 0 ? (
                <View className="flex-1 items-center justify-center py-12">
                  <Ionicons name="chatbubble-outline" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 text-lg mt-4">Start a conversation</Text>
                  <Text className="text-gray-400 text-center mt-2 px-6">
                    Ask questions about this {selectedItem.type}
                  </Text>
                </View>
              ) : (
                <View className="py-4">
                  {currentSession.messages.map((message) => (
                    <View
                      key={message.id}
                      className={cn(
                        "mb-4 p-3 rounded-lg max-w-[80%]",
                        message.role === 'user'
                          ? "self-end bg-blue-500"
                          : "self-start bg-gray-200"
                      )}
                    >
                      <Text
                        className={cn(
                          "text-base",
                          message.role === 'user' ? "text-white" : "text-gray-900"
                        )}
                      >
                        {message.content}
                      </Text>
                      <Text
                        className={cn(
                          "text-xs mt-1",
                          message.role === 'user' ? "text-blue-100" : "text-gray-500"
                        )}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                  ))}
                  
                  {isLoading && (
                    <View className="self-start bg-gray-200 p-3 rounded-lg mb-4">
                      <Text className="text-gray-600">AI is thinking...</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View className="px-6 py-4 border-t border-gray-200">
              <View className="flex-row items-center">
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask a question..."
                  multiline
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 mr-3 max-h-24"
                />
                <Pressable
                  onPress={sendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className={cn(
                    "w-12 h-12 rounded-full items-center justify-center",
                    inputText.trim() && !isLoading ? "bg-blue-500" : "bg-gray-300"
                  )}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color="white"
                  />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};