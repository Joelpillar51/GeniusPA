import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../state/authStore';
import { useMeetingStore } from '../state/meetingStore';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { UserPreferences } from '../types/auth';
import { UpgradeModal } from '../components/UpgradeModal';
import { cn } from '../utils/cn';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, signOut, updateUser, updatePreferences } = useAuthStore();
  const { recordings, documents, chatSessions } = useMeetingStore();
  const { plan, limits, getTodayUsage, cancelSubscription } = useSubscriptionStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Update editName when user changes
  useEffect(() => {
    if (user?.name) {
      setEditName(user.name);
    }
  }, [user?.name]);

  if (!user) {
    console.log('ProfileScreen: No user found, redirecting...');
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
            navigation.goBack();
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

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      `Are you sure you want to cancel your ${plan} plan? You will lose access to premium features and your account will be downgraded to the free plan.`,
      [
        { text: 'Keep Subscription', style: 'cancel' },
        { 
          text: 'Cancel Subscription', 
          style: 'destructive', 
          onPress: () => {
            cancelSubscription();
            Alert.alert(
              'Subscription Cancelled',
              'Your subscription has been cancelled. You now have access to free plan features.',
              [{ text: 'OK' }]
            );
          }
        },
      ]
    );
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
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </Pressable>
          <Text className="text-2xl font-bold text-gray-900">Profile</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          {/* Profile Info */}
          <View className="items-center mb-8">
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
            
            {/* Subscription Badge */}
            <Pressable 
              onPress={() => plan === 'free' && navigation.navigate('Subscription' as never)}
              className={cn(
                "mt-4 px-4 py-2 rounded-full border",
                plan === 'free' 
                  ? "bg-orange-50 border-orange-200 border-2" 
                  : plan === 'pro'
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-purple-50 border-purple-200"
              )}
            >
              <Text className={cn(
                "font-semibold text-sm capitalize",
                plan === 'free' 
                  ? "text-orange-700" 
                  : plan === 'pro'
                  ? "text-emerald-700"
                  : "text-purple-700"
              )}>
                {plan === 'free' ? 'Free Plan • Tap to Upgrade' : `${plan} Plan`}
              </Text>
            </Pressable>
          </View>

          {/* Subscription Management */}
          {plan !== 'free' && (
            <View className="mb-8 bg-white rounded-2xl p-6 border border-gray-100">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-orange-100 rounded-xl items-center justify-center mr-3">
                  <Ionicons name="card" size={20} color="#F97316" />
                </View>
                <Text className="text-gray-900 font-semibold text-lg">Subscription Management</Text>
              </View>
              
              <View className="space-y-4">
                <View className="flex-row items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium text-base">
                      Current Plan: {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </Text>
                    <Text className="text-gray-600 text-sm mt-1">
                      {plan === 'pro' ? 'Extended features and higher limits' : 'Premium features with unlimited usage'}
                    </Text>
                  </View>
                  <View className={cn(
                    "px-3 py-1 rounded-full",
                    plan === 'pro' ? "bg-emerald-100" : "bg-purple-100"
                  )}>
                    <Text className={cn(
                      "text-xs font-medium",
                      plan === 'pro' ? "text-emerald-700" : "text-purple-700"
                    )}>
                      Active
                    </Text>
                  </View>
                </View>
                
                <Pressable
                  onPress={handleCancelSubscription}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 items-center"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                    <Text className="text-red-600 font-semibold text-base ml-2">
                      Cancel Subscription
                    </Text>
                  </View>
                  <Text className="text-red-500 text-xs mt-1 text-center">
                    Downgrade to free plan and lose premium features
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Usage Stats */}
          <View className="mb-8 bg-gray-50 rounded-2xl p-6">
            <Text className="text-lg font-bold text-gray-900 mb-4 text-center">Usage Overview</Text>
            <View className="flex-row justify-around mb-4">
              <Pressable onPress={showDataInfo} className="items-center">
                <View className="w-16 h-16 bg-emerald-100 rounded-2xl items-center justify-center mb-2">
                  <Ionicons name="mic" size={24} color="#10B981" />
                </View>
                <Text className="text-2xl font-bold text-emerald-600 mb-1">
                  {getTodayUsage().recordingsCount}
                </Text>
                <Text className="text-gray-600 text-xs font-medium">Today</Text>
                <Text className="text-gray-500 text-xs">
                  {limits.dailyRecordings === -1 ? 'Unlimited' : `${getTodayUsage().recordingsCount}/${limits.dailyRecordings}`}
                </Text>
              </Pressable>
              <Pressable onPress={showDataInfo} className="items-center">
                <View className="w-16 h-16 bg-blue-100 rounded-2xl items-center justify-center mb-2">
                  <Ionicons name="document-text" size={24} color="#3B82F6" />
                </View>
                <Text className="text-2xl font-bold text-blue-600 mb-1">{documents.length}</Text>
                <Text className="text-gray-600 text-xs font-medium">Total</Text>
                <Text className="text-gray-500 text-xs">
                  {limits.maxDocuments === -1 ? 'Unlimited' : `${documents.length}/${limits.maxDocuments}`}
                </Text>
              </Pressable>
              <Pressable onPress={showDataInfo} className="items-center">
                <View className="w-16 h-16 bg-purple-100 rounded-2xl items-center justify-center mb-2">
                  <Ionicons name="chatbubbles" size={24} color="#8B5CF6" />
                </View>
                <Text className="text-2xl font-bold text-purple-600 mb-1">{chatSessions.length}</Text>
                <Text className="text-gray-600 text-xs font-medium">Chats</Text>
                <Text className="text-gray-500 text-xs">
                  {limits.aiChatProjects === -1 ? 'Unlimited' : `Max ${limits.aiChatProjects}`}
                </Text>
              </Pressable>
            </View>
            
            {plan === 'free' && (
              <Pressable 
                onPress={() => navigation.navigate('Subscription' as never)}
                className="bg-emerald-500 rounded-xl py-3 items-center active:bg-emerald-600"
              >
                <View className="flex-row items-center">
                  <Ionicons name="star" size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">Upgrade for More</Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Settings */}
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
                  className={cn(
                    "px-4 py-3 rounded-xl flex-1 mx-1",
                    user.preferences.recordingQuality === quality
                      ? 'bg-emerald-500'
                      : 'bg-gray-100'
                  )}
                >
                  <Text
                    className={cn(
                      "font-semibold capitalize text-center",
                      user.preferences.recordingQuality === quality
                        ? 'text-white'
                        : 'text-gray-700'
                    )}
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
      
      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        context={{
          feature: 'Subscription',
          limitation: 'You are currently on the free plan with limited features.',
          benefits: [
            'Longer recording limits',
            'More daily recordings',
            'Multiple documents and AI chats',
            'All export formats',
          ],
        }}
      />
    </SafeAreaView>
  );
};