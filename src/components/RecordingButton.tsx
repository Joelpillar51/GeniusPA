import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useMeetingStore } from '../state/meetingStore';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { Recording } from '../types/meeting';
import { transcribeAudio } from '../api/transcribe-audio';
import { getOpenAIChatResponse } from '../api/chat-service';
import { UpgradeModal } from './UpgradeModal';
import { VoiceWaves } from './VoiceWaves';
import { RecordingIndicator } from './RecordingIndicator';
import { CircularWaves } from './CircularWaves';
import { ProcessingPulse } from './ProcessingPulse';
import { cn } from '../utils/cn';

interface RecordingButtonProps {
  onRecordingComplete?: (recording: Recording) => void;
}

export const RecordingButton: React.FC<RecordingButtonProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const recording = useRef<Audio.Recording | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  
  const { addRecording, updateRecording } = useMeetingStore();
  const { canRecord, addRecordingUsage, limits, plan } = useSubscriptionStore();

  const startRecording = async () => {
    // Check subscription limits
    const recordingCheck = canRecord();
    if (!recordingCheck.allowed) {
      Alert.alert('Recording Limit Reached', recordingCheck.reason!, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => setShowUpgradeModal(true) },
      ]);
      return;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please grant microphone permission to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: audioRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recording.current = audioRecording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          
          // Check if we've hit the duration limit
          if (limits.maxRecordingDuration !== -1 && newDuration >= limits.maxRecordingDuration) {
            stopRecording();
            Alert.alert(
              'Recording Limit Reached',
              `Free users can record up to ${Math.floor(limits.maxRecordingDuration / 60)} minutes. Upgrade to Pro for longer recordings.`,
              [
                { text: 'OK' },
                { text: 'Upgrade', onPress: () => setShowUpgradeModal(true) },
              ]
            );
          }
          
          return newDuration;
        });
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording.current) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);
      
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      
      if (!uri) {
        throw new Error('Recording URI not found');
      }

      // Create recording object
      const now = new Date();
      const newRecording: Recording = {
        id: Date.now().toString(),
        title: `Meeting ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
        uri,
        duration: recordingDuration,
        createdAt: now,
        isTranscribing: true,
      };

      // Track usage
      const usageAdded = addRecordingUsage(recordingDuration);
      if (!usageAdded) {
        console.warn('Failed to track recording usage');
      }

      // Add to store
      addRecording(newRecording);
      onRecordingComplete?.(newRecording);

      // Start transcription process in background
      setTimeout(async () => {
        try {
          const transcript = await transcribeAudio(uri);
          
          if (transcript && transcript.trim().length > 0) {
            // Only save transcript, let user decide when to summarize
            updateRecording(newRecording.id, {
              transcript,
              isTranscribing: false,
            });
          } else {
            throw new Error('Empty transcript received');
          }

        } catch (transcriptionError) {
          console.error('Transcription failed:', transcriptionError);
          updateRecording(newRecording.id, {
            isTranscribing: false,
          });
          // Don't show alert immediately since user might have navigated away
        }
      }, 100);

      recording.current = null;
      setRecordingDuration(0);
      
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View className="items-center">
      <View className="relative items-center justify-center">
        {/* Circular waves animation */}
        <CircularWaves isRecording={isRecording} size={120} color="#EF4444" />
        
        {/* Pulsing background indicator */}
        <RecordingIndicator isRecording={isRecording} size={100} />
        
        {/* Main recording button */}
        <Pressable
          onPress={handlePress}
          disabled={isProcessing}
          className={cn(
            "w-20 h-20 rounded-full items-center justify-center z-10",
            isRecording ? "bg-red-500" : "bg-emerald-500",
            isProcessing && "opacity-50"
          )}
          style={{
            shadowColor: isRecording ? '#EF4444' : '#10B981',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <Ionicons
            name={isRecording ? "stop" : "mic"}
            size={32}
            color="white"
          />
        </Pressable>
      </View>
      
      {/* Voice waves animation */}
      <View className="mt-6 h-8 items-center justify-center">
        <VoiceWaves 
          isRecording={isRecording} 
          size="medium" 
          color="#EF4444" 
        />
      </View>
      
      {isRecording && (
        <View className="mt-4 items-center">
          <Text className="text-red-500 font-semibold text-lg">
            Recording...
          </Text>
          <Text className="text-gray-600 text-base">
            {formatDuration(recordingDuration)}
          </Text>
        </View>
      )}
      
      {isProcessing && (
        <View className="mt-4 flex-row items-center">
          <ProcessingPulse isProcessing={isProcessing} />
          <Text className="text-emerald-500 font-medium">
            Processing...
          </Text>
        </View>
      )}
      
      {/* Recording Limit Info */}
      {!isRecording && !isProcessing && (
        <Text className="mt-4 text-gray-500 text-sm text-center">
          {limits.maxRecordingDuration === -1 
            ? `Unlimited • ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`
            : `${Math.floor(limits.maxRecordingDuration / 60)} min limit • ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`
          }
        </Text>
      )}
      
      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        context={{
          feature: 'Recording',
          limitation: 'Free users can only record for 5 minutes and 3 times per day.',
          benefits: [
            'Record up to 1 hour with Pro plan',
            'Up to 50 recordings per day',
            'Unlimited recordings with Premium',
          ],
        }}
      />
    </View>
  );
};