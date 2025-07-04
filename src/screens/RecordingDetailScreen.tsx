import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useMeetingStore } from '../state/meetingStore';
import { EditableText } from '../components/EditableText';
import { SummarizeButton } from '../components/SummarizeButton';
import { Recording } from '../types/meeting';
import { exportRecordingTranscript } from '../utils/pdfExport';
import { getOpenAIChatResponse } from '../api/chat-service';

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

  const handleExport = async () => {
    try {
      await exportRecordingTranscript(recording);
    } catch (error) {
      console.error('Error exporting recording:', error);
      Alert.alert('Error', 'Failed to export recording. Please try again.');
    }
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
                className="flex-row items-center justify-center bg-blue-500 rounded-lg py-3 px-6"
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
              <Text className="text-lg font-semibold text-gray-900 mb-3">Transcript</Text>
              
              {recording.isTranscribing ? (
                <Text className="text-blue-500 italic">Transcribing...</Text>
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
      </View>
    </SafeAreaView>
  );
};