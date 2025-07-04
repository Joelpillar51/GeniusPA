import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { useMeetingStore } from '../state/meetingStore';
import { UserPreferences } from '../types/auth';

export const ProfileScreen: React.FC = () => {
  const { user, signOut, updateUser, updatePreferences } = useAuthStore();
  const { recordings, documents, chatSessions } = useMeetingStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');

  if (!user) return null;

  const handleSaveName = () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    updateUser({ name: editName.trim() });
    setIsEditing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  const updatePreference = (key: keyof UserPreferences, value: any) => {
    updatePreferences({ [key]: value });
  };

  const updateNotificationPreference = (key: keyof UserPreferences['notifications'], value: boolean) => {
    updatePreferences({
      notifications: {
        ...user.preferences.notifications,
        [key]: value,
      }
    });
  };

  const showDataInfo = () => {
    Alert.alert(
      'Your GeniusPA Data',
      `Recordings: ${recordings.length}\nDocuments: ${documents.length}\nChat Sessions: ${chatSessions.length}\n\nAll data is stored securely on your device and protected with end-to-end encryption.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-8 pt-8 pb-8 bg-white">
          <View className="items-center">
            {/* Profile Avatar */}
            <View className="w-24 h-24 bg-emerald-100 rounded-full items-center justify-center mb-6 border-4 border-emerald-50">
              <View className="w-16 h-16 bg-emerald-500 rounded-full items-center justify-center">
                <Text className="text-white text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            
            {/* Name Editing */}
            {isEditing ? (
              <View className="flex-row items-center mb-4">
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  className="bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl text-center font-semibold text-lg mr-3 min-w-[200px]"
                  placeholder="Enter name"
                  placeholderTextColor="#9CA3AF"
                />
                <Pressable onPress={handleSaveName} className="w-12 h-12 bg-emerald-500 rounded-xl items-center justify-center mr-2">
                  <Ionicons name="checkmark" size={20} color="white" />
                </Pressable>
                <Pressable onPress={() => setIsEditing(false)} className="w-12 h-12 bg-gray-200 rounded-xl items-center justify-center">
                  <Ionicons name="close" size={20} color="#6B7280" />
                </Pressable>
              </View>
            ) : (
              <View className="flex-row items-center mb-2">
                <Text className="text-gray-900 text-2xl font-bold mr-3">{user.name}</Text>
                <Pressable onPress={() => setIsEditing(true)} className="w-10 h-10 bg-gray-100 rounded-lg items-center justify-center">
                  <Ionicons name="pencil" size={16} color="#6B7280" />
                </Pressable>
              </View>
            )}
            
            <Text className="text-gray-600 text-base mb-1">{user.email}</Text>
            <Text className="text-gray-500 text-sm">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </Text>
            
            {/* GeniusPA Badge */}
            <View className="mt-4 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
              <Text className="text-emerald-700 font-semibold text-sm">GeniusPA Member</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="px-8 py-6 mx-8 mb-6 bg-gray-50 rounded-2xl">
          <Text className="text-lg font-bold text-gray-900 mb-4 text-center">Your Activity</Text>
          <View className="flex-row justify-around">
            <Pressable onPress={showDataInfo} className="items-center">
              <View className="w-16 h-16 bg-emerald-100 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="mic" size={24} color="#10B981" />
              </View>
              <Text className="text-2xl font-bold text-emerald-600 mb-1">{recordings.length}</Text>
              <Text className="text-gray-600 text-sm font-medium">Recordings</Text>
            </Pressable>
            <Pressable onPress={showDataInfo} className="items-center">
              <View className="w-16 h-16 bg-blue-100 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="document-text" size={24} color="#3B82F6" />
              </View>
              <Text className="text-2xl font-bold text-blue-600 mb-1">{documents.length}</Text>
              <Text className="text-gray-600 text-sm font-medium">Documents</Text>
            </Pressable>
            <Pressable onPress={showDataInfo} className="items-center">
              <View className="w-16 h-16 bg-purple-100 rounded-2xl items-center justify-center mb-2">
                <Ionicons name="chatbubbles" size={24} color="#8B5CF6" />
              </View>
              <Text className="text-2xl font-bold text-purple-600 mb-1">{chatSessions.length}</Text>
              <Text className="text-gray-600 text-sm font-medium">Chats</Text>
            </Pressable>
          </View>
        </View>

        {/* Preferences */}
        <View className="px-8">
          <Text className="text-xl font-bold text-gray-900 mb-6">Settings & Preferences</Text>

          {/* Recording Quality */}
          <View className="mb-8 bg-white rounded-2xl p-6 border border-gray-100">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-emerald-100 rounded-xl items-center justify-center mr-3">
                <Ionicons name="settings" size={20} color="#10B981" />
              </View>
              <Text className="text-gray-900 font-semibold text-lg">Recording Quality</Text>
            </View>
            <View className="flex-row justify-between">
              {(['standard', 'high', 'lossless'] as const).map((quality) => (
                <Pressable
                  key={quality}
                  onPress={() => updatePreference('recordingQuality', quality)}
                  className={`px-4 py-3 rounded-xl flex-1 mx-1 ${
                    user.preferences.recordingQuality === quality
                      ? 'bg-emerald-500'
                      : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`font-semibold capitalize text-center ${
                      user.preferences.recordingQuality === quality
                        ? 'text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    {quality}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Auto Features */}
          <View className="mb-8 bg-white rounded-2xl p-6 border border-gray-100">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center mr-3">
                <Ionicons name="flash" size={20} color="#3B82F6" />
              </View>
              <Text className="text-gray-900 font-semibold text-lg">Automation</Text>
            </View>
            
            <View className="space-y-6">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium text-base">Auto Transcribe</Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    Automatically transcribe recordings when they finish
                  </Text>
                </View>
                <Switch
                  value={user.preferences.autoTranscribe}
                  onValueChange={(value) => updatePreference('autoTranscribe', value)}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor={user.preferences.autoTranscribe ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium text-base">Auto Summarize</Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    Generate AI summaries automatically after transcription
                  </Text>
                </View>
                <Switch
                  value={user.preferences.autoSummarize}
                  onValueChange={(value) => updatePreference('autoSummarize', value)}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor={user.preferences.autoSummarize ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
            </View>
          </View>

          {/* Notifications */}
          <View className="mb-8 bg-white rounded-2xl p-6 border border-gray-100">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-purple-100 rounded-xl items-center justify-center mr-3">
                <Ionicons name="notifications" size={20} color="#8B5CF6" />
              </View>
              <Text className="text-gray-900 font-semibold text-lg">Notifications</Text>
            </View>
            
            <View className="space-y-6">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium text-base">Transcription Complete</Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    Get notified when your recordings are transcribed
                  </Text>
                </View>
                <Switch
                  value={user.preferences.notifications.transcriptionComplete}
                  onValueChange={(value) => updateNotificationPreference('transcriptionComplete', value)}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor={user.preferences.notifications.transcriptionComplete ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium text-base">Weekly Digest</Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    Receive weekly summaries of your GeniusPA activity
                  </Text>
                </View>
                <Switch
                  value={user.preferences.notifications.weeklyDigest}
                  onValueChange={(value) => updateNotificationPreference('weeklyDigest', value)}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor={user.preferences.notifications.weeklyDigest ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
            </View>
          </View>

          {/* About GeniusPA */}
          <View className="mb-8 bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-emerald-500 rounded-xl items-center justify-center mr-3">
                <Ionicons name="information-circle" size={20} color="white" />
              </View>
              <Text className="text-emerald-900 font-semibold text-lg">About GeniusPA</Text>
            </View>
            <Text className="text-emerald-800 text-sm leading-relaxed mb-3">
              Your intelligent personal assistant for meetings and documents. GeniusPA uses advanced AI to transcribe, summarize, and help you interact with your content.
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text className="text-emerald-700 text-xs ml-2 font-medium">
                All data processed securely on device
              </Text>
            </View>
          </View>

          {/* Sign Out */}
          <Pressable
            onPress={handleSignOut}
            className="bg-red-50 border border-red-200 rounded-2xl p-6 items-center mb-8"
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text className="text-red-600 font-semibold text-lg ml-2">Sign Out</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};