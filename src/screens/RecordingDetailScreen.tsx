import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useMeetingStore } from '../state/meetingStore';
import { EditableText } from '../components/EditableText';
import { SummarizeButton } from '../components/SummarizeButton';
import { ExportOptions } from '../components/ExportOptions';
import { VoiceWaves } from '../components/VoiceWaves';
import { Recording } from '../types/meeting';
import { getOpenAIChatResponse } from '../api/chat-service';
import { retryTranscription } from '../utils/transcriptionRetry';
import { getTranscriptionFallbackMessage, getUserFriendlyErrorMessage } from '../utils/transcriptionFallback';

interface RecordingDetailScreenProps {
  route: {
    params: {
      recordingId: string;
    };
  };
  navigation: any;
}

export const RecordingDetailScreen: React.FC<RecordingDetailScreenProps> = ({ route, navigation }) => {
  const { recordingId } = route.params;
  const { recordings, updateRecording, deleteRecording } = useMeetingStore();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isRetryingTranscription, setIsRetryingTranscription] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const recording = recordings.find(r => r.id === recordingId);

  if (!recording) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Recording not found</Text>
      </SafeAreaView>
    );
  }

  const playRecording = async () => {
    if (isPlaying) {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      setIsPlaying(false);
      return;
    }

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recording.uri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setIsPlaying(true);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setIsPlaying(false);
          setSound(null);
        }
      });
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const regenerateSummary = async () => {
    if (!recording.transcript) {
      Alert.alert('No Transcript', 'Please add a transcript first to generate a summary.');
      return;
    }

    setIsSummarizing(true);
    try {
      const summaryResponse = await getOpenAIChatResponse(
        `Please provide a detailed summary of this transcript. Include key topics, main points, and any important details discussed:\n\n${recording.transcript}`
      );

      updateRecording(recording.id, {
        summary: summaryResponse.content,
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      Alert.alert('Error', 'Failed to generate summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const retryTranscriptionHandler = async () => {
    if (!recording) return;
    
    setIsRetryingTranscription(true);
    updateRecording(recording.id, { isTranscribing: true });
    
    try {
      const transcript = await retryTranscription(recording.uri, 2, 1000);
      
      if (transcript && transcript.trim().length > 0) {
        updateRecording(recording.id, {
          transcript,
          isTranscribing: false,
        });
        
        Alert.alert(
          'Transcription Successful!',
          'Your recording has been transcribed successfully.',
          [{ text: 'Great!' }]
        );
      } else {
        throw new Error('Empty transcript received');
      }
    } catch (error) {
      console.error('Retry transcription failed:', error);
      
      const errorType = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
      const fallbackTranscript = getTranscriptionFallbackMessage(errorType);
      const errorMessage = getUserFriendlyErrorMessage(errorType);
      
      updateRecording(recording.id, {
        transcript: fallbackTranscript,
        isTranscribing: false,
      });
      
      Alert.alert(
        'Transcription Still Unavailable',
        errorMessage + '\n\nA template has been added to help you transcribe manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRetryingTranscription(false);
    }
  };
  
  const isTranscriptionFailed = recording.transcript && 
    (recording.transcript.includes('⚠️') || 
     recording.transcript.includes('Automatic transcription') ||
     recording.transcript.includes('temporarily unavailable'));

  const handleDelete = () => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRecording(recording.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleExport = () => {
    setExportModalVisible(true);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => navigation.goBack()} className="p-2 -ml-2">
              <Ionicons name="arrow-back" size={24} color="#6B7280" />
            </Pressable>
            
            <View className="flex-row">
              <Pressable onPress={handleExport} className="p-2 mr-2">
                <Ionicons name="share-outline" size={24} color="#10B981" />
              </Pressable>
              <Pressable onPress={handleDelete} className="p-2">
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </Pressable>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1">
          <View className="px-6 py-4">
            {/* Title */}
            <EditableText
              text={recording.title}
              onSave={(newTitle) => updateRecording(recording.id, { title: newTitle })}
              placeholder="Recording title"
              maxLength={100}
              textStyle="text-2xl font-bold text-gray-900 mb-4"
            />

            {/* Metadata */}
            <View className="mb-6">
              <Text className="text-gray-600 text-sm">
                {new Date(recording.createdAt).toLocaleDateString()} at{' '}
                {new Date(recording.createdAt).toLocaleTimeString()}
              </Text>
              <Text className="text-gray-600 text-sm">
                Duration: {formatDuration(recording.duration)}
              </Text>
            </View>

            {/* Play Button */}
            <View className="mb-6">
              <Pressable
                onPress={playRecording}
                className="flex-row items-center justify-center bg-emerald-500 rounded-lg py-3 px-6 mb-4"
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={20}
                  color="white"
                />
                <Text className="text-white font-medium ml-2">
                  {isPlaying ? "Pause" : "Play Recording"}
                </Text>
              </Pressable>
              
              {/* Voice waves when playing */}
              <View className="h-6 items-center justify-center">
                <VoiceWaves 
                  isRecording={isPlaying} 
                  size="small" 
                  color="#10B981" 
                />
              </View>
            </View>

            {/* Summary Section */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-gray-900">Summary</Text>
                <Pressable
                  onPress={regenerateSummary}
                  disabled={isSummarizing}
                  className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2"
                >
                  <Ionicons 
                    name="refresh" 
                    size={16} 
                    color={isSummarizing ? "#9CA3AF" : "#6B7280"} 
                  />
                  <Text className={`ml-1 text-sm ${isSummarizing ? "text-gray-400" : "text-gray-600"}`}>
                    {isSummarizing ? "Generating..." : "Regenerate"}
                  </Text>
                </Pressable>
              </View>
              
              {recording.summary ? (
                <EditableText
                  text={recording.summary}
                  onSave={(newSummary) => updateRecording(recording.id, { summary: newSummary })}
                  multiline
                  placeholder="No summary available"
                  textStyle="text-gray-700 leading-relaxed"
                />
              ) : recording.transcript && !recording.isTranscribing ? (
                <SummarizeButton
                  content={recording.transcript}
                  onSummaryGenerated={(summary) => updateRecording(recording.id, { summary })}
                  contentType="recording"
                  size="medium"
                  variant="primary"
                />
              ) : (
                <Text className="text-gray-500 italic">
                  No summary available. {recording.transcript ? "Tap regenerate to create one." : "Add a transcript first."}
                </Text>
              )}
            </View>

            {/* Transcript Section */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-gray-900">Transcript</Text>
                
                {isTranscriptionFailed && (
                  <Pressable
                    onPress={retryTranscriptionHandler}
                    disabled={isRetryingTranscription}
                    className="flex-row items-center px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-200"
                  >
                    <Ionicons 
                      name="refresh" 
                      size={16} 
                      color={isRetryingTranscription ? "#9CA3AF" : "#10B981"} 
                    />
                    <Text className={`ml-1 text-sm font-medium ${
                      isRetryingTranscription ? "text-gray-400" : "text-emerald-700"
                    }`}>
                      {isRetryingTranscription ? "Retrying..." : "Retry Auto-Transcription"}
                    </Text>
                  </Pressable>
                )}
              </View>
              
              {recording.isTranscribing ? (
                <View className="flex-row items-center">
                  <Text className="text-blue-500 italic">Transcribing...</Text>
                  {isRetryingTranscription && (
                    <Text className="text-gray-500 text-sm ml-2">(Retry in progress)</Text>
                  )}
                </View>
              ) : recording.transcript ? (
                <EditableText
                  text={recording.transcript}
                  onSave={(newTranscript) => updateRecording(recording.id, { transcript: newTranscript })}
                  multiline
                  placeholder="No transcript available"
                  textStyle="text-gray-800 leading-relaxed"
                />
              ) : (
                <Text className="text-gray-500 italic">
                  No transcript available. The recording may still be processing.
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
        
        {/* Export Modal */}
        <ExportOptions
          visible={exportModalVisible}
          onClose={() => setExportModalVisible(false)}
          data={recording}
          type="recording"
        />
      </View>
    </SafeAreaView>
  );
};