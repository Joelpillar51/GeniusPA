import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { useMeetingStore } from '../state/meetingStore';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { UpgradeModal } from '../components/UpgradeModal';
import { RecordingButton } from '../components/RecordingButton';
import { cn } from '../utils/cn';

export const OverviewScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { recordings, documents, chatSessions } = useMeetingStore();
  const { plan, limits, getTodayUsage } = useSubscriptionStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const todayUsage = getTodayUsage();
  const recentRecordings = recordings
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  const recentDocuments = documents
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getWeekdayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with Profile */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
            </Text>
            <Text className="text-gray-600 mt-1">
              {getWeekdayName()}, {formatDate()}
            </Text>
          </View>
          
          {/* Profile Avatar */}
          <Pressable
            onPress={() => navigation.navigate('Profile')}
            className="w-12 h-12 bg-emerald-100 rounded-full items-center justify-center border-2 border-emerald-50"
          >
            <Text className="text-emerald-700 font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </Pressable>
        </View>
        
        {/* Subscription Badge */}
        <Pressable 
          onPress={() => plan === 'free' && setShowUpgradeModal(true)}
          className={cn(
            "mt-3 self-start px-3 py-1 rounded-full",
            plan === 'free' 
              ? "bg-gray-100" 
              : plan === 'pro'
              ? "bg-emerald-100"
              : "bg-purple-100"
          )}
        >
          <Text className={cn(
            "font-semibold text-xs",
            plan === 'free' 
              ? "text-gray-700" 
              : plan === 'pro'
              ? "text-emerald-700"
              : "text-purple-700"
          )}>
            {plan === 'free' ? 'Free Plan' : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`}
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Quick Recording */}
        <View className="px-6 py-8 items-center bg-emerald-50">
          <Text className="text-xl font-bold text-gray-900 mb-2">Ready to Record?</Text>
          <Text className="text-gray-600 text-center mb-6">
            Tap to start recording your meeting or class
          </Text>
          <RecordingButton />
        </View>

        {/* Today's Usage Stats */}
        <View className="px-6 py-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">Today's Activity</Text>
          
          <View className="flex-row justify-between mb-6">
            <View className="flex-1 bg-emerald-50 rounded-2xl p-4 mr-2">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="mic" size={24} color="#10B981" />
                <Text className="text-emerald-600 font-bold text-2xl">
                  {todayUsage.recordingsCount}
                </Text>
              </View>
              <Text className="text-gray-700 font-medium">Recordings</Text>
              <Text className="text-gray-500 text-sm">
                {limits.dailyRecordings === -1 ? 'Unlimited' : `${todayUsage.recordingsCount}/${limits.dailyRecordings} today`}
              </Text>
            </View>
            
            <View className="flex-1 bg-blue-50 rounded-2xl p-4 ml-2">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="document-text" size={24} color="#3B82F6" />
                <Text className="text-blue-600 font-bold text-2xl">
                  {documents.length}
                </Text>
              </View>
              <Text className="text-gray-700 font-medium">Documents</Text>
              <Text className="text-gray-500 text-sm">
                {limits.maxDocuments === -1 ? 'Unlimited' : `${documents.length}/${limits.maxDocuments} total`}
              </Text>
            </View>
          </View>

          {/* Upgrade prompt for free users */}
          {plan === 'free' && (
            <Pressable 
              onPress={() => setShowUpgradeModal(true)}
              className="bg-emerald-500 rounded-2xl p-4 mb-6"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg">Unlock More Features</Text>
                  <Text className="text-white/90 text-sm">
                    Upgrade to Pro for unlimited recordings and documents
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color="white" />
              </View>
            </Pressable>
          )}
        </View>

        {/* Recent Recordings */}
        {recentRecordings.length > 0 && (
          <View className="px-6 py-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Recent Recordings</Text>
              <Pressable onPress={() => navigation.navigate('Recordings')}>
                <Text className="text-emerald-600 font-medium">View All</Text>
              </Pressable>
            </View>
            
            <View className="space-y-3">
              {recentRecordings.map((recording) => (
                <View key={recording.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 mb-1">
                        {recording.title}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        {new Date(recording.createdAt).toLocaleDateString()} • {Math.floor(recording.duration / 60)}m {recording.duration % 60}s
                      </Text>
                      {recording.isTranscribing && (
                        <Text className="text-emerald-500 text-sm mt-1">Transcribing...</Text>
                      )}
                      {recording.transcript && !recording.isTranscribing && !recording.summary && (
                        <Text className="text-emerald-600 text-sm mt-1 font-medium">✓ Ready to summarize</Text>
                      )}
                    </View>
                    <View className="w-10 h-10 bg-emerald-100 rounded-full items-center justify-center">
                      <Ionicons name="mic" size={18} color="#10B981" />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Documents */}
        {recentDocuments.length > 0 && (
          <View className="px-6 py-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Recent Documents</Text>
              <Pressable onPress={() => navigation.navigate('Documents')}>
                <Text className="text-emerald-600 font-medium">View All</Text>
              </Pressable>
            </View>
            
            <View className="space-y-3">
              {recentDocuments.map((document) => (
                <View key={document.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="font-semibold text-gray-900 mb-1">
                        {document.name}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        {new Date(document.createdAt).toLocaleDateString()}
                      </Text>
                      {document.isProcessing && (
                        <Text className="text-emerald-500 text-sm mt-1">Processing...</Text>
                      )}
                      {document.transcript && !document.isProcessing && !document.summary && (
                        <Text className="text-emerald-600 text-sm mt-1 font-medium">✓ Ready to summarize</Text>
                      )}
                    </View>
                    <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                      <Ionicons name="document-text" size={18} color="#3B82F6" />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Getting Started - for new users */}
        {recordings.length === 0 && documents.length === 0 && (
          <View className="px-6 py-8">
            <Text className="text-xl font-bold text-gray-900 mb-4 text-center">
              Welcome to GeniusPA! 🎉
            </Text>
            
            <View className="space-y-4">
              <View className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
                <View className="flex-row items-center mb-2">
                  <View className="w-8 h-8 bg-emerald-500 rounded-full items-center justify-center mr-3">
                    <Text className="text-white font-bold">1</Text>
                  </View>
                  <Text className="font-semibold text-emerald-900">Record Your First Meeting</Text>
                </View>
                <Text className="text-emerald-800 text-sm leading-relaxed ml-11">
                  Tap the record button above to start capturing your meetings or classes with automatic transcription.
                </Text>
              </View>
              
              <View className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                <View className="flex-row items-center mb-2">
                  <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-3">
                    <Text className="text-white font-bold">2</Text>
                  </View>
                  <Text className="font-semibold text-blue-900">Upload Documents</Text>
                </View>
                <Text className="text-blue-800 text-sm leading-relaxed ml-11">
                  Visit the Documents tab to upload and analyze your text files and PDFs.
                </Text>
              </View>
              
              <View className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                <View className="flex-row items-center mb-2">
                  <View className="w-8 h-8 bg-purple-500 rounded-full items-center justify-center mr-3">
                    <Text className="text-white font-bold">3</Text>
                  </View>
                  <Text className="font-semibold text-purple-900">Chat with AI</Text>
                </View>
                <Text className="text-purple-800 text-sm leading-relaxed ml-11">
                  Use the AI Chat tab to ask questions about your recordings and documents.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Profile Modal */}
      <TestProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
      
      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        context={{
          feature: 'Overview',
          limitation: 'You are currently on the free plan with limited features.',
          benefits: [
            'Unlimited recordings and documents',
            'Advanced AI features',
            'Priority support',
            'Export to all formats',
          ],
        }}
      />
    </SafeAreaView>
  );
};