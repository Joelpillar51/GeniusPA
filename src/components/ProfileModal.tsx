import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { useMeetingStore } from '../state/meetingStore';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { UserPreferences } from '../types/auth';
import { UpgradeModal } from './UpgradeModal';
import { cn } from '../utils/cn';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const { user, signOut, updateUser, updatePreferences } = useAuthStore();
  const { recordings, documents, chatSessions } = useMeetingStore();
  const { plan, limits, getTodayUsage } = useSubscriptionStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!user) {
    console.log('ProfileModal: No user found');
    return null;
  }

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
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: () => {
            console.log('Signing out user...');
            signOut();
            onClose();
          }
        },
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
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[90%]">
            {/* Header */}
            <View className="px-6 py-4 border-b border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-gray-900">Profile</Text>
                <Pressable onPress={onClose} className="p-2 -mr-2">
                  <Ionicons name="close" size={24} color="#6B7280" />
                </Pressable>
              </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="px-6 py-6">
                {/* Profile Info */}
                <View className="items-center mb-8">
                  <View className="w-20 h-20 bg-emerald-100 rounded-full items-center justify-center mb-4 border-4 border-emerald-50">
                    <View className="w-14 h-14 bg-emerald-500 rounded-full items-center justify-center">
                      <Text className="text-white text-xl font-bold">
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
                      <Text className="text-gray-900 text-xl font-bold mr-3">{user.name}</Text>
                      <Pressable onPress={() => setIsEditing(true)} className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center">
                        <Ionicons name="pencil" size={14} color="#6B7280" />
                      </Pressable>
                    </View>
                  )}
                  
                  <Text className="text-gray-600 text-base mb-1">{user.email}</Text>
                  <Text className="text-gray-500 text-sm">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                {/* Usage Stats */}
                <View className="mb-8 bg-gray-50 rounded-2xl p-6">
                  <Text className="text-lg font-bold text-gray-900 mb-4 text-center">Usage Overview</Text>
                  <View className="flex-row justify-around mb-4">
                    <Pressable onPress={showDataInfo} className="items-center">
                      <View className="w-14 h-14 bg-emerald-100 rounded-2xl items-center justify-center mb-2">
                        <Ionicons name="mic" size={20} color="#10B981" />
                      </View>
                      <Text className="text-xl font-bold text-emerald-600 mb-1">{getTodayUsage().recordingsCount}</Text>
                      <Text className="text-gray-600 text-xs font-medium">Today</Text>
                      <Text className="text-gray-500 text-xs">
                        {limits.dailyRecordings === -1 ? 'Unlimited' : `${getTodayUsage().recordingsCount}/${limits.dailyRecordings}`}
                      </Text>
                    </Pressable>
                    <Pressable onPress={showDataInfo} className="items-center">
                      <View className="w-14 h-14 bg-blue-100 rounded-2xl items-center justify-center mb-2">
                        <Ionicons name="document-text" size={20} color="#3B82F6" />
                      </View>
                      <Text className="text-xl font-bold text-blue-600 mb-1">{documents.length}</Text>
                      <Text className="text-gray-600 text-xs font-medium">Total</Text>
                      <Text className="text-gray-500 text-xs">
                        {limits.maxDocuments === -1 ? 'Unlimited' : `${documents.length}/${limits.maxDocuments}`}
                      </Text>
                    </Pressable>
                    <Pressable onPress={showDataInfo} className="items-center">
                      <View className="w-14 h-14 bg-purple-100 rounded-2xl items-center justify-center mb-2">
                        <Ionicons name="chatbubbles" size={20} color="#8B5CF6" />
                      </View>
                      <Text className="text-xl font-bold text-purple-600 mb-1">{chatSessions.length}</Text>
                      <Text className="text-gray-600 text-xs font-medium">Chats</Text>
                      <Text className="text-gray-500 text-xs">
                        {limits.aiChatProjects === -1 ? 'Unlimited' : `Max ${limits.aiChatProjects}`}
                      </Text>
                    </Pressable>
                  </View>
                  
                  {/* Subscription Status */}
                  <View className={cn(
                    "mt-4 p-4 rounded-xl border",
                    plan === 'free' 
                      ? "bg-gray-50 border-gray-200" 
                      : plan === 'pro'
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-purple-50 border-purple-200"
                  )}>
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className={cn(
                          "font-semibold capitalize",
                          plan === 'free' ? "text-gray-900" : plan === 'pro' ? "text-emerald-900" : "text-purple-900"
                        )}>
                          {plan} Plan
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          {plan === 'free' 
                            ? '5 min recordings • 3/day • 1 document' 
                            : plan === 'pro'
                            ? '1 hour recordings • 50/day • 100 documents'
                            : 'Unlimited everything'
                          }
                        </Text>
                      </View>
                      {plan === 'free' && (
                        <Pressable 
                          onPress={() => setShowUpgradeModal(true)}
                          className="bg-emerald-500 px-4 py-2 rounded-lg"
                        >
                          <Text className="text-white font-semibold text-sm">Upgrade</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>

                {/* Quick Settings */}
                <View className="mb-8 bg-white rounded-2xl p-6 border border-gray-100">
                  <Text className="text-lg font-bold text-gray-900 mb-4">Quick Settings</Text>
                  
                  <View className="space-y-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-gray-900 font-medium">Auto Transcribe</Text>
                        <Text className="text-gray-600 text-sm">
                          Automatically transcribe recordings
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
                        <Text className="text-gray-900 font-medium">Auto Summarize</Text>
                        <Text className="text-gray-600 text-sm">
                          Generate summaries automatically
                        </Text>
                      </View>
                      <Switch
                        value={user.preferences.autoSummarize}
                        onValueChange={(value) => updatePreference('autoSummarize', value)}
                        trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                        thumbColor={user.preferences.autoSummarize ? '#FFFFFF' : '#9CA3AF'}
                      />
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-gray-900 font-medium">Notifications</Text>
                        <Text className="text-gray-600 text-sm">
                          Get notified when transcription completes
                        </Text>
                      </View>
                      <Switch
                        value={user.preferences.notifications.transcriptionComplete}
                        onValueChange={(value) => updateNotificationPreference('transcriptionComplete', value)}
                        trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                        thumbColor={user.preferences.notifications.transcriptionComplete ? '#FFFFFF' : '#9CA3AF'}
                      />
                    </View>
                  </View>
                </View>

                {/* Sign Out */}
                <Pressable
                  onPress={handleSignOut}
                  className="bg-red-50 border border-red-200 rounded-2xl p-6 items-center mb-6"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    <Text className="text-red-600 font-semibold text-lg ml-2">Sign Out</Text>
                  </View>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        context={{
          feature: 'Profile',
          limitation: 'You are currently on the free plan with limited features.',
          benefits: [
            'Longer recording limits',
            'More daily recordings',
            'Multiple documents and AI chats',
            'All export formats',
          ],
        }}
      />
    </>
  );
};