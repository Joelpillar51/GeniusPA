import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMeetingStore } from '../state/meetingStore';

export const SettingsScreen: React.FC = () => {
  const { recordings, documents, chatSessions } = useMeetingStore();

  const showAbout = () => {
    Alert.alert(
      'Meeting Assistant AI',
      'Version 1.0\n\nA powerful AI-powered meeting assistant that helps you record, transcribe, and analyze your meetings and documents.\n\nFeatures:\n• Audio recording with automatic transcription\n• Document upload and processing\n• AI-powered Q&A about your content\n• Export conversations to HTML\n• Secure local storage',
      [{ text: 'OK' }]
    );
  };

  const showStorage = () => {
    Alert.alert(
      'Storage Information',
      `Recordings: ${recordings.length}\nDocuments: ${documents.length}\nChat Sessions: ${chatSessions.length}\n\nAll data is stored locally on your device and is not shared with external services except for AI processing.`,
      [{ text: 'OK' }]
    );
  };

  const showHelp = () => {
    Alert.alert(
      'How to Use',
      '1. RECORDINGS: Tap the record button to start recording meetings or classes. The app will automatically transcribe and summarize the audio.\n\n2. DOCUMENTS: Upload text files or PDFs to analyze and summarize their content.\n\n3. AI CHAT: Select any recorded or uploaded content to start a conversation with AI. Ask questions or request study questions.\n\n4. EXPORT: Use the share button to export transcripts or chat conversations.\n\nTips:\n• Ensure good audio quality for better transcription\n• Keep recordings focused for better summaries\n• Ask specific questions for better AI responses',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">Settings</Text>
        </View>

        <ScrollView className="flex-1">
          <View className="px-6 py-4">
            {/* Storage Section */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Storage</Text>
              <Pressable
                onPress={showStorage}
                className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <View className="flex-row items-center">
                  <Ionicons name="folder-outline" size={24} color="#6B7280" />
                  <Text className="ml-3 text-gray-900 font-medium">View Storage Info</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Help Section */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Support</Text>
              
              <Pressable
                onPress={showHelp}
                className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg mb-3"
              >
                <View className="flex-row items-center">
                  <Ionicons name="help-circle-outline" size={24} color="#6B7280" />
                  <Text className="ml-3 text-gray-900 font-medium">How to Use</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>

              <Pressable
                onPress={showAbout}
                className="flex-row items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <View className="flex-row items-center">
                  <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
                  <Text className="ml-3 text-gray-900 font-medium">About</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Privacy Section */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Privacy</Text>
              <View className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <View className="flex-row items-start">
                  <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
                  <View className="ml-3 flex-1">
                    <Text className="text-blue-900 font-medium mb-1">Your Privacy Matters</Text>
                    <Text className="text-blue-800 text-sm leading-relaxed">
                      All recordings and documents are stored locally on your device. Only transcription and AI processing require internet connection to provide you with the best experience.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};