import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { useMeetingStore } from '../state/meetingStore';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { UserPreferences } from '../types/auth';
import { UpgradeModal } from './UpgradeModal';
import { SubscriptionModal } from './SubscriptionModal';
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
  const [editName, setEditName] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('ProfileModal render:', { visible, user: user?.name, plan });
  }, [visible, user, plan]);

  // Update editName when user changes or modal opens
  useEffect(() => {
    if (user?.name) {
      setEditName(user.name);
    }
  }, [user?.name, visible]);

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
    if (user) {
      updatePreferences({
        notifications: {
          ...user.preferences.notifications,
          [key]: value,
        }
      });
    }
  };

  const showDataInfo = () => {
    Alert.alert(
      'Your GeniusPA Data',
      `Recordings: ${recordings.length}\nDocuments: ${documents.length}\nChat Sessions: ${chatSessions.length}\n\nAll data is stored securely on your device and protected with end-to-end encryption.`,
      [{ text: 'OK' }]
    );
  };

  // Don't render if no user
  if (!user) {
    return null;
  }

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        presentationStyle="overFullScreen"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ 
            backgroundColor: 'white', 
            borderTopLeftRadius: 24, 
            borderTopRightRadius: 24, 
            maxHeight: '90%',
            minHeight: '50%'
          }}>
            {/* Header */}
            <View style={{ 
              paddingHorizontal: 24, 
              paddingVertical: 16, 
              borderBottomWidth: 1, 
              borderBottomColor: '#E5E7EB',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Profile</Text>
              <Pressable onPress={onClose} style={{ padding: 8, marginRight: -8 }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <View style={{ padding: 24 }}>
                {/* Profile Info */}
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                  <View style={{ 
                    width: 80, 
                    height: 80, 
                    backgroundColor: '#ECFDF5', 
                    borderRadius: 40, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: 16,
                    borderWidth: 4,
                    borderColor: '#D1FAE5'
                  }}>
                    <View style={{ 
                      width: 56, 
                      height: 56, 
                      backgroundColor: '#10B981', 
                      borderRadius: 28, 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Name Display/Edit */}
                  {isEditing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                      <TextInput
                        value={editName}
                        onChangeText={setEditName}
                        style={{
                          backgroundColor: '#F9FAFB',
                          borderWidth: 1,
                          borderColor: '#E5E7EB',
                          color: '#111827',
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderRadius: 12,
                          textAlign: 'center',
                          fontWeight: '600',
                          fontSize: 18,
                          marginRight: 12,
                          minWidth: 200
                        }}
                        placeholder="Enter name"
                        placeholderTextColor="#9CA3AF"
                      />
                      <Pressable 
                        onPress={handleSaveName} 
                        style={{ 
                          width: 48, 
                          height: 48, 
                          backgroundColor: '#10B981', 
                          borderRadius: 12, 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          marginRight: 8 
                        }}
                      >
                        <Ionicons name="checkmark" size={20} color="white" />
                      </Pressable>
                      <Pressable 
                        onPress={() => setIsEditing(false)} 
                        style={{ 
                          width: 48, 
                          height: 48, 
                          backgroundColor: '#E5E7EB', 
                          borderRadius: 12, 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}
                      >
                        <Ionicons name="close" size={20} color="#6B7280" />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ color: '#111827', fontSize: 20, fontWeight: 'bold', marginRight: 12 }}>
                        {user.name}
                      </Text>
                      <Pressable 
                        onPress={() => setIsEditing(true)} 
                        style={{ 
                          width: 32, 
                          height: 32, 
                          backgroundColor: '#F3F4F6', 
                          borderRadius: 8, 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}
                      >
                        <Ionicons name="pencil" size={14} color="#6B7280" />
                      </Pressable>
                    </View>
                  )}
                  
                  <Text style={{ color: '#6B7280', fontSize: 16, marginBottom: 4 }}>{user.email}</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                {/* Usage Stats */}
                <View style={{ 
                  marginBottom: 32, 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: 16, 
                  padding: 24 
                }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16, textAlign: 'center' }}>
                    Usage Overview
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
                    <Pressable onPress={showDataInfo} style={{ alignItems: 'center' }}>
                      <View style={{ 
                        width: 56, 
                        height: 56, 
                        backgroundColor: '#ECFDF5', 
                        borderRadius: 16, 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginBottom: 8 
                      }}>
                        <Ionicons name="mic" size={20} color="#10B981" />
                      </View>
                      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#10B981', marginBottom: 4 }}>
                        {getTodayUsage().recordingsCount}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '500' }}>Today</Text>
                      <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
                        {limits.dailyRecordings === -1 ? 'Unlimited' : `${getTodayUsage().recordingsCount}/${limits.dailyRecordings}`}
                      </Text>
                    </Pressable>
                    
                    <Pressable onPress={showDataInfo} style={{ alignItems: 'center' }}>
                      <View style={{ 
                        width: 56, 
                        height: 56, 
                        backgroundColor: '#EFF6FF', 
                        borderRadius: 16, 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginBottom: 8 
                      }}>
                        <Ionicons name="document-text" size={20} color="#3B82F6" />
                      </View>
                      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#3B82F6', marginBottom: 4 }}>
                        {documents.length}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '500' }}>Total</Text>
                      <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
                        {limits.maxDocuments === -1 ? 'Unlimited' : `${documents.length}/${limits.maxDocuments}`}
                      </Text>
                    </Pressable>
                    
                    <Pressable onPress={showDataInfo} style={{ alignItems: 'center' }}>
                      <View style={{ 
                        width: 56, 
                        height: 56, 
                        backgroundColor: '#F3E8FF', 
                        borderRadius: 16, 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginBottom: 8 
                      }}>
                        <Ionicons name="chatbubbles" size={20} color="#8B5CF6" />
                      </View>
                      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#8B5CF6', marginBottom: 4 }}>
                        {chatSessions.length}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '500' }}>Chats</Text>
                      <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
                        {limits.aiChatProjects === -1 ? 'Unlimited' : `Max ${limits.aiChatProjects}`}
                      </Text>
                    </Pressable>
                  </View>
                  
                  {/* Subscription Status */}
                  <View style={{ 
                    marginTop: 16, 
                    padding: 16, 
                    borderRadius: 12, 
                    borderWidth: 1,
                    backgroundColor: plan === 'free' ? '#F9FAFB' : plan === 'pro' ? '#ECFDF5' : '#F3E8FF',
                    borderColor: plan === 'free' ? '#E5E7EB' : plan === 'pro' ? '#D1FAE5' : '#E9D5FF'
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View>
                        <Text style={{ 
                          fontWeight: '600', 
                          textTransform: 'capitalize',
                          color: plan === 'free' ? '#111827' : plan === 'pro' ? '#065F46' : '#581C87'
                        }}>
                          {plan} Plan
                        </Text>
                        <Text style={{ color: '#6B7280', fontSize: 14 }}>
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
                          onPress={() => setShowSubscriptionModal(true)}
                          style={{ backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                        >
                          <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Upgrade</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>

                {/* Quick Settings */}
                <View style={{ 
                  marginBottom: 32, 
                  backgroundColor: 'white', 
                  borderRadius: 16, 
                  padding: 24, 
                  borderWidth: 1, 
                  borderColor: '#E5E7EB' 
                }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
                    Quick Settings
                  </Text>
                  
                  <View>
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      marginBottom: 16 
                    }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#111827', fontWeight: '500' }}>Auto Transcribe</Text>
                        <Text style={{ color: '#6B7280', fontSize: 14 }}>
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

                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      marginBottom: 16 
                    }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#111827', fontWeight: '500' }}>Auto Summarize</Text>
                        <Text style={{ color: '#6B7280', fontSize: 14 }}>
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

                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      justifyContent: 'space-between' 
                    }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#111827', fontWeight: '500' }}>Notifications</Text>
                        <Text style={{ color: '#6B7280', fontSize: 14 }}>
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
                  style={{ 
                    backgroundColor: '#FEF2F2', 
                    borderWidth: 1, 
                    borderColor: '#FECACA', 
                    borderRadius: 16, 
                    padding: 24, 
                    alignItems: 'center', 
                    marginBottom: 24 
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 18, marginLeft: 8 }}>
                      Sign Out
                    </Text>
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

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
          onClose();
        }}
      />
    </>
  );
};