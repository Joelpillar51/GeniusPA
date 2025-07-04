import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
      'Your Data',
      `Recordings: ${recordings.length}\nDocuments: ${documents.length}\nChat Sessions: ${chatSessions.length}\n\nAll data is stored securely on your device.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Header */}
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6']}
          className="px-6 py-6"
        >
          <View className="items-center">
            <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            
            {isEditing ? (
              <View className="flex-row items-center">
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  className="bg-white/20 text-white px-4 py-2 rounded-lg text-center font-semibold text-lg mr-2"
                  placeholder="Enter name"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                />
                <Pressable onPress={handleSaveName} className="p-2">
                  <Ionicons name="checkmark" size={24} color="white" />
                </Pressable>
                <Pressable onPress={() => setIsEditing(false)} className="p-2">
                  <Ionicons name="close" size={24} color="white" />
                </Pressable>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Text className="text-white text-xl font-bold mr-2">{user.name}</Text>
                <Pressable onPress={() => setIsEditing(true)} className="p-1">
                  <Ionicons name="pencil" size={16} color="rgba(255,255,255,0.8)" />
                </Pressable>
              </View>
            )}
            
            <Text className="text-white/80 mt-1">{user.email}</Text>
            <Text className="text-white/60 text-sm mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View className="px-6 py-4 border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Your Activity</Text>
          <View className="flex-row justify-around">
            <Pressable onPress={showDataInfo} className="items-center">
              <Text className="text-2xl font-bold text-blue-500">{recordings.length}</Text>
              <Text className="text-gray-600 text-sm">Recordings</Text>
            </Pressable>
            <Pressable onPress={showDataInfo} className="items-center">
              <Text className="text-2xl font-bold text-green-500">{documents.length}</Text>
              <Text className="text-gray-600 text-sm">Documents</Text>
            </Pressable>
            <Pressable onPress={showDataInfo} className="items-center">
              <Text className="text-2xl font-bold text-purple-500">{chatSessions.length}</Text>
              <Text className="text-gray-600 text-sm">Chats</Text>
            </Pressable>
          </View>
        </View>

        {/* Preferences */}
        <View className="px-6 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Preferences</Text>

          {/* Recording Quality */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-3">Recording Quality</Text>
            <View className="flex-row justify-around">
              {(['standard', 'high', 'lossless'] as const).map((quality) => (
                <Pressable
                  key={quality}
                  onPress={() => updatePreference('recordingQuality', quality)}
                  className={`px-4 py-2 rounded-lg ${
                    user.preferences.recordingQuality === quality
                      ? 'bg-blue-500'
                      : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`font-medium capitalize ${
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
          <View className="space-y-4 mb-6">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-900 font-medium">Auto Transcribe</Text>
                <Text className="text-gray-600 text-sm">
                  Automatically transcribe recordings
                </Text>
              </View>
              <Switch
                value={user.preferences.autoTranscribe}
                onValueChange={(value) => updatePreference('autoTranscribe', value)}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={user.preferences.autoTranscribe ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-gray-900 font-medium">Auto Summarize</Text>
                <Text className="text-gray-600 text-sm">
                  Generate summaries automatically
                </Text>
              </View>
              <Switch
                value={user.preferences.autoSummarize}
                onValueChange={(value) => updatePreference('autoSummarize', value)}
                trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                thumbColor={user.preferences.autoSummarize ? '#FFFFFF' : '#9CA3AF'}
              />
            </View>
          </View>

          {/* Notifications */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-3">Notifications</Text>
            <View className="space-y-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-900 font-medium">Transcription Complete</Text>
                  <Text className="text-gray-600 text-sm">
                    Notify when transcription is ready
                  </Text>
                </View>
                <Switch
                  value={user.preferences.notifications.transcriptionComplete}
                  onValueChange={(value) => updateNotificationPreference('transcriptionComplete', value)}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor={user.preferences.notifications.transcriptionComplete ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-900 font-medium">Weekly Digest</Text>
                  <Text className="text-gray-600 text-sm">
                    Weekly summary of your activity
                  </Text>
                </View>
                <Switch
                  value={user.preferences.notifications.weeklyDigest}
                  onValueChange={(value) => updateNotificationPreference('weeklyDigest', value)}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor={user.preferences.notifications.weeklyDigest ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
            </View>
          </View>

          {/* Sign Out */}
          <Pressable
            onPress={handleSignOut}
            className="bg-red-50 border border-red-200 rounded-lg p-4 items-center mt-8"
          >
            <Text className="text-red-600 font-semibold">Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};