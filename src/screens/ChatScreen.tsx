import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMeetingStore } from '../state/meetingStore';
import { ChatSession, ChatMessage, Recording, Document } from '../types/meeting';
import { getOpenAIChatResponse } from '../api/chat-service';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { ExportOptions } from '../components/ExportOptions';
import { UpgradeModal } from '../components/UpgradeModal';
import { cn } from '../utils/cn';

export const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { recordings, documents, chatSessions, createChatSession, addMessageToSession } = useMeetingStore();
  const { canUseAIChat, setChatProject } = useSubscriptionStore();
  const [inputText, setInputText] = useState('');
  const [selectedItem, setSelectedItem] = useState<{id: string, type: 'recording' | 'document', title: string} | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
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
        
        // Add welcome message for documents that might need manual content input
        if (selectedItem.type === 'document') {
          const item = documents.find(d => d.id === selectedItem.id);
          const content = item?.transcript || '';
          const isPlaceholderContent = content.includes('📄') || 
                                     content.includes('PDF document') || 
                                     content.includes('Copy & Paste Method') ||
                                     content.length < 100;
          
          if (isPlaceholderContent) {
            const welcomeMessage: ChatMessage = {
              id: `msg_welcome_${Date.now()}`,
              role: 'assistant',
              content: `👋 Hi! I'm ready to help you analyze "${selectedItem.title}".

I notice this is a PDF or document that may need manual text input for the best AI analysis. Here's how we can work together:

🔍 **To analyze specific content:**
Copy text from your document and ask: "Analyze this content: [paste text here]"

📝 **To get general help:**
Ask questions like:
• "What type of document is this likely to be?"
• "How should I approach analyzing this content?"
• "What questions should I ask about this material?"

✏️ **To enable full document analysis:**
Edit this document and add the text content, then I can analyze the entire document.

What would you like to explore about this document?`,
              timestamp: new Date(),
              relatedItemId: selectedItem.id,
            };
            newSession.messages.push(welcomeMessage);
          }
        }
        
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

    // Check if the question is about the current project's content
    const isOffTopicQuestion = checkIfOffTopic(inputText.trim());
    if (isOffTopicQuestion) {
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_upgrade`,
        role: 'assistant',
        content: "Please upgrade your plan to proceed. Free users can only ask questions about their selected recording or document content.",
        timestamp: new Date(),
        relatedItemId: selectedItem.id,
      };
      addMessageToSession(currentSession.id, assistantMessage);
      
      setTimeout(() => {
        setShowUpgradeModal(true);
      }, 1000);
      return;
    }

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
      
      // Debug logging to see what content we're working with
      console.log('Chat content length:', content.length);
      console.log('Chat content preview:', content.substring(0, 200));
      
      // Check if the document content is actually extractable or just a placeholder
      const isPlaceholderContent = content.includes('📄') || 
                                   content.includes('PDF document') || 
                                   content.includes('uploaded successfully') ||
                                   content.includes('manual text extraction') ||
                                   content.includes('cannot directly read') ||
                                   content.includes('However, you can use the AI Chat') ||
                                   content.includes('AI Chat integration') ||
                                   content.includes('Copy and paste specific text sections');
      
      let contextPrompt = '';
      
      if (isPlaceholderContent || !content.trim() || content.length < 50) {
        // Handle cases where we don't have actual extractable content
        const fileName = selectedItem.title.toLowerCase();
        let topicHint = '';
        
        // Try to provide helpful context based on filename
        if (fileName.includes('secret') || fileName.includes('pro')) {
          topicHint = ' This appears to be a professional or confidential document.';
        } else if (fileName.includes('report') || fileName.includes('analysis')) {
          topicHint = ' This seems to be a report or analysis document.';
        } else if (fileName.includes('guide') || fileName.includes('manual')) {
          topicHint = ' This looks like a guide or manual.';
        } else if (fileName.includes('contract') || fileName.includes('agreement')) {
          topicHint = ' This appears to be a contract or agreement.';
        }

        contextPrompt = `I can see you're asking about the ${selectedItem.type === 'recording' ? 'recording' : 'document'} "${selectedItem.title}".${topicHint}

However, I cannot directly access the content of this file for detailed analysis. This is common with PDFs and certain document formats.

Your question: "${inputText.trim()}"

Here's how I can help you right now:

**🔍 For immediate analysis:**
Copy and paste the specific text you want me to analyze, and I'll provide detailed insights.

**📋 General assistance:**
I can offer general guidance about ${fileName.includes('report') ? 'report analysis' : fileName.includes('contract') ? 'contract review' : fileName.includes('guide') ? 'using guides effectively' : 'document analysis'} techniques and what to look for.

**💡 To enable full document analysis:**
Edit the document in the Documents tab and add the text content - then I'll be able to analyze the entire document.

Would you like to share some specific text for analysis, or would you prefer general guidance about working with this type of document?`;
      } else {
        // We have actual content to analyze
        contextPrompt = `You are an AI assistant analyzing ${selectedItem.type === 'recording' ? 'a meeting/class recording' : 'a document'} titled "${selectedItem.title}". 

Here is the extracted content:

${content}

User's question: ${inputText.trim()}

Please provide a comprehensive and helpful response based on the content provided. Be specific and reference details from the content when answering. If the question is not directly related to the provided content, politely redirect to ask questions about the specific material.`;
      }

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

  // Simple check for off-topic questions
  const checkIfOffTopic = (question: string): boolean => {
    const offTopicKeywords = [
      'weather', 'news', 'joke', 'recipe', 'movie', 'game', 'sport',
      'travel', 'restaurant', 'shopping'
    ];
    
    const lowerQuestion = question.toLowerCase();
    
    // Allow analysis and content-related questions
    const isContentRelated = lowerQuestion.includes('document') || 
                            lowerQuestion.includes('recording') ||
                            lowerQuestion.includes('transcript') ||
                            lowerQuestion.includes('meeting') ||
                            lowerQuestion.includes('content') ||
                            lowerQuestion.includes('analyze') ||
                            lowerQuestion.includes('summary') ||
                            lowerQuestion.includes('summarize') ||
                            lowerQuestion.includes('explain') ||
                            lowerQuestion.includes('what') ||
                            lowerQuestion.includes('how') ||
                            lowerQuestion.includes('why') ||
                            lowerQuestion.includes('main points') ||
                            lowerQuestion.includes('key') ||
                            lowerQuestion.includes('about');
    
    if (isContentRelated) {
      return false; // Allow content-related questions
    }
    
    return offTopicKeywords.some(keyword => lowerQuestion.includes(keyword));
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

  const exportChat = () => {
    if (!currentSession) return;
    setExportModalVisible(true);
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
                    onPress={() => {
                      const chatCheck = canUseAIChat(item.id);
                      if (!chatCheck.allowed) {
                        Alert.alert('Upgrade Required', chatCheck.reason!, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Upgrade', onPress: () => setShowUpgradeModal(true) },
                        ]);
                        return;
                      }
                      setChatProject(item.id, item.type);
                      setSelectedItem(item);
                    }}
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
                  <Ionicons name="help-circle-outline" size={24} color="#10B981" />
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
                          ? "self-end bg-emerald-500"
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
                          message.role === 'user' ? "text-emerald-100" : "text-gray-500"
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
                    inputText.trim() && !isLoading ? "bg-emerald-500" : "bg-gray-300"
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
        
        {/* Export Modal */}
        {currentSession && (
          <ExportOptions
            visible={exportModalVisible}
            onClose={() => setExportModalVisible(false)}
            data={currentSession}
            type="chat"
          />
        )}
        
        {/* Upgrade Modal */}
        <UpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          context={{
            feature: 'AI Chat',
            limitation: 'Free users can only chat about one project and must ask questions related to that content.',
            benefits: [
              'Chat about 10 projects with Pro',
              'Unlimited AI conversations with Premium',
              'Ask general questions beyond your content',
            ],
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};