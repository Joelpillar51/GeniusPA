import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMeetingStore } from '../state/meetingStore';
import { ChatSession, ChatMessage, Recording, Document } from '../types/meeting';
import { getOpenAIChatResponse } from '../api/chat-service';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { ExportOptions } from '../components/ExportOptions';
import { UpgradeModal } from '../components/UpgradeModal';
import { AILoadingIndicator } from '../components/AILoadingIndicator';
import { cn } from '../utils/cn';

export const ChatScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { recordings, documents, chatSessions, createChatSession, addMessageToSession } = useMeetingStore();
  const { canUseAIChat, setChatProject } = useSubscriptionStore();
  const [inputText, setInputText] = useState('');
  const [selectedItem, setSelectedItem] = useState<{id: string, type: 'recording' | 'document', title: string} | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [directChatMode, setDirectChatMode] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const allItems = [
    ...recordings.map(r => ({ id: r.id, type: 'recording' as const, title: r.title, hasContent: !!r.transcript, createdAt: r.createdAt })),
    ...documents.map(d => ({ id: d.id, type: 'document' as const, title: d.name, hasContent: !!d.transcript, createdAt: d.createdAt }))
  ].filter(item => item.hasContent)
   .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first

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
      if (updatedSession && updatedSession.messages.length !== currentSession.messages.length) {
        setCurrentSession(updatedSession);
      }
    } else if (directChatMode && currentSession) {
      // For direct chat mode
      const directChatId = 'direct_chat_general';
      const updatedDirectSession = chatSessions.find(s => s.id === directChatId);
      if (updatedDirectSession && updatedDirectSession.messages.length !== currentSession.messages.length) {
        setCurrentSession(updatedDirectSession);
      }
    }
  }, [chatSessions, selectedItem, currentSession?.id, currentSession?.messages?.length, directChatMode]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (currentSession?.messages?.length) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentSession?.messages?.length]);

  // Handle direct AI chat mode
  const startDirectChat = () => {
    setDirectChatMode(true);
    setSelectedItem(null);
    
    // Create or get direct chat session
    const directChatId = 'direct_chat_general';
    const existingDirectSession = chatSessions.find(s => s.id === directChatId);
    
    if (existingDirectSession) {
      setCurrentSession(existingDirectSession);
    } else {
      const newDirectSession: ChatSession = {
        id: directChatId,
        title: 'AI Chat',
        messages: [{
          id: `welcome_${Date.now()}`,
          role: 'assistant',
          content: `Hello! I'm your AI assistant. I can help you with a wide range of topics including:

• Answering questions and providing explanations
• Writing and editing assistance
• Analysis and research help
• Creative brainstorming
• Technical guidance
• General conversation

What would you like to chat about today?`,
          timestamp: new Date(),
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
        relatedItemId: null,
        relatedItemType: null,
      };
      
      createChatSession(newDirectSession);
      setCurrentSession(newDirectSession);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !currentSession) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
      relatedItemId: selectedItem?.id || null,
    };

    // Add user message and immediately update local state
    addMessageToSession(currentSession.id, userMessage);
    
    // Force update current session with the new message immediately for better UX
    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
      updatedAt: new Date()
    };
    setCurrentSession(updatedSession);
    
    setInputText('');
    setIsLoading(true);
    setLoadingMessage('');
    setLoadingProgress(0);

    try {
      let contextPrompt = '';
      
      if (directChatMode || !selectedItem) {
        // Direct AI chat mode - no document context
        setLoadingMessage('Preparing response...');
        setLoadingProgress(25);
        
        contextPrompt = `You are a helpful AI assistant. Please provide a comprehensive and helpful response to the user's question or request.

User's message: ${inputText.trim()}

Please provide a thoughtful, accurate, and helpful response. You can use your general knowledge to assist the user.`;
      } else {
        // Document/recording-based chat mode
        
        // Check if the question is about the current project's content for free users
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
          setIsLoading(false);
          
          setTimeout(() => {
            setShowUpgradeModal(true);
          }, 1000);
          return;
        }

        // Get the content for context
        setLoadingMessage('Accessing document content...');
        setLoadingProgress(20);
        
        const item = selectedItem.type === 'recording' 
          ? recordings.find(r => r.id === selectedItem.id)
          : documents.find(d => d.id === selectedItem.id);

        const content = item?.transcript || '';
        
        // Debug logging to see what content we're working with
        console.log('Chat content length:', content.length);
        console.log('Chat content preview:', content.substring(0, 200));
        
        setLoadingMessage('Analyzing content...');
        setLoadingProgress(40);
        
        // Check if the document content is actually extractable or just a placeholder
        const isPlaceholderContent = content.includes('📄') || 
                                     content.includes('PDF document') || 
                                     content.includes('uploaded successfully') ||
                                     content.includes('manual text extraction') ||
                                     content.includes('cannot directly read') ||
                                     content.includes('However, you can use the AI Chat') ||
                                     content.includes('AI Chat integration') ||
                                     content.includes('Copy and paste specific text sections');
        
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
      }

      setLoadingMessage('Generating AI response...');
      setLoadingProgress(70);
      const response = await getOpenAIChatResponse(contextPrompt);
      setLoadingProgress(90);

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        relatedItemId: selectedItem?.id || null,
      };

      addMessageToSession(currentSession.id, assistantMessage);
      
      // Force update current session with the new AI message
      // Get the latest session state to avoid race conditions
      const latestSession = chatSessions.find(s => s.id === currentSession.id) || currentSession;
      const finalUpdatedSession = {
        ...latestSession,
        messages: [...latestSession.messages],
        updatedAt: new Date()
      };
      setCurrentSession(finalUpdatedSession);
      
      setLoadingProgress(100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      setLoadingProgress(0);
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
    setLoadingMessage('Analyzing content for questions...');
    setLoadingProgress(25);
    
    try {
      const item = selectedItem.type === 'recording' 
        ? recordings.find(r => r.id === selectedItem.id)
        : documents.find(d => d.id === selectedItem.id);

      const content = item?.transcript || '';
      
      setLoadingMessage('Generating thoughtful questions...');
      setLoadingProgress(60);
      
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
      
      // Force update current session with the new questions message
      // Get the latest session state to avoid race conditions
      const latestSession = chatSessions.find(s => s.id === currentSession.id) || currentSession;
      const updatedSessionWithQuestions = {
        ...latestSession,
        messages: [...latestSession.messages],
        updatedAt: new Date()
      };
      setCurrentSession(updatedSessionWithQuestions);
      
      setLoadingProgress(100);
    } catch (error) {
      console.error('Error generating questions:', error);
      Alert.alert('Error', 'Failed to generate questions. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      setLoadingProgress(0);
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

        {!selectedItem && !directChatMode ? (
          /* Item Selection */
          <ScrollView className="flex-1">
            <View className="px-6 py-4">
              {/* Direct AI Chat Option */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  Start a conversation:
                </Text>
                
                <Pressable
                  onPress={startDirectChat}
                  className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200"
                  style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-4">
                      <Ionicons name="chatbubbles" size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-blue-900 text-lg">Chat with AI</Text>
                      <Text className="text-blue-700 text-sm">Ask questions, get help, or have a conversation</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#3B82F6" />
                  </View>
                </Pressable>
              </View>

              {/* Document/Recording Selection */}
              <View>
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  Or chat about your content:
                </Text>
                
                {allItems.length === 0 ? (
                  <View className="items-center py-8 bg-gray-50 rounded-xl">
                    <Ionicons name="document-outline" size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 text-base mt-3">No content available</Text>
                    <Text className="text-gray-400 text-center mt-1 px-6 text-sm">
                      Add documents from URLs first to chat about them
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
                        setDirectChatMode(false);
                      }}
                      className="mb-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name={item.type === 'recording' ? 'mic' : 'link'}
                          size={24}
                          color="#6B7280"
                        />
                        <Text className="ml-3 font-medium text-gray-900 flex-1" numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text className="text-gray-500 text-xs mr-2 capitalize">
                          {item.type === 'recording' ? 'Recording' : 'Document'}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        ) : (
          /* Chat Interface */
          <View className="flex-1">
            {/* Chat Header */}
            <View className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <View className="flex-row items-center">
                <Pressable 
                  onPress={() => {
                    setSelectedItem(null);
                    setDirectChatMode(false);
                  }} 
                  className="mr-3"
                >
                  <Ionicons name="arrow-back" size={24} color="#6B7280" />
                </Pressable>
                
                {directChatMode ? (
                  <>
                    <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-3">
                      <Ionicons name="chatbubbles" size={16} color="white" />
                    </View>
                    <Text className="font-medium text-gray-900 flex-1">AI Chat</Text>
                  </>
                ) : selectedItem ? (
                  <>
                    <Ionicons
                      name={selectedItem.type === 'recording' ? 'mic' : 'link'}
                      size={20}
                      color="#6B7280"
                    />
                    <Text className="ml-2 font-medium text-gray-900 flex-1" numberOfLines={1}>
                      {selectedItem.title}
                    </Text>
                    <Pressable onPress={generateQuestions} disabled={isLoading} className="p-2">
                      <Ionicons name="help-circle-outline" size={24} color="#10B981" />
                    </Pressable>
                  </>
                ) : null}
                
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
              key={`chat-${currentSession?.id}-${currentSession?.messages?.length || 0}`}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {!currentSession || currentSession.messages.length === 0 ? (
                <View className="flex-1 items-center justify-center py-12">
                  <Ionicons name="chatbubble-outline" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 text-lg mt-4">Start a conversation</Text>
                  <Text className="text-gray-400 text-center mt-2 px-6">
                    {directChatMode 
                      ? "Ask me anything - I'm here to help!"
                      : selectedItem 
                        ? `Ask questions about this ${selectedItem.type}`
                        : "Start chatting"
                    }
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
                    <AILoadingIndicator 
                      message={loadingMessage} 
                      progress={loadingProgress}
                    />
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
                  placeholder={isLoading ? "AI is responding..." : "Ask a question..."}
                  multiline
                  editable={!isLoading}
                  className={cn(
                    "flex-1 border rounded-lg px-4 py-3 mr-3 max-h-24",
                    isLoading ? "border-gray-200 bg-gray-50" : "border-gray-300 bg-white"
                  )}
                />
                <Pressable
                  onPress={sendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className={cn(
                    "w-12 h-12 rounded-full items-center justify-center",
                    inputText.trim() && !isLoading ? "bg-emerald-500" : "bg-gray-300"
                  )}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons
                      name="send"
                      size={20}
                      color="white"
                    />
                  )}
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