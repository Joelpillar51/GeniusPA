import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useMeetingStore } from '../state/meetingStore';
import { Recording } from '../types/meeting';
import { transcribeAudio } from '../api/transcribe-audio';
import { getOpenAIChatResponse } from '../api/chat-service';
import { cn } from '../utils/cn';

interface RecordingButtonProps {
  onRecordingComplete?: (recording: Recording) => void;
}

export const RecordingButton: React.FC<RecordingButtonProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recording = useRef<Audio.Recording | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  
  const { addRecording, updateRecording } = useMeetingStore();

  const startRecording = async () => {
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
        setRecordingDuration(prev => prev + 1);
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
      <Pressable
        onPress={handlePress}
        disabled={isProcessing}
        className={cn(
          "w-20 h-20 rounded-full items-center justify-center",
          isRecording ? "bg-red-500" : "bg-blue-500",
          isProcessing && "opacity-50"
        )}
      >
        <Ionicons
          name={isRecording ? "stop" : "mic"}
          size={32}
          color="white"
        />
      </Pressable>
      
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
        <Text className="mt-4 text-blue-500 font-medium">
          Processing...
        </Text>
      )}
    </View>
  );
};