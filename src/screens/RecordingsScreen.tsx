import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useMeetingStore } from '../state/meetingStore';
import { RecordingButton } from '../components/RecordingButton';
import { EditableText } from '../components/EditableText';
import { SummarizeButton } from '../components/SummarizeButton';
import { ExportOptions } from '../components/ExportOptions';
import { VoiceWaves } from '../components/VoiceWaves';
import { TruncatedText } from '../components/TruncatedText';
import { Recording } from '../types/meeting';
import { cn } from '../utils/cn';

export const RecordingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { recordings, deleteRecording, updateRecording } = useMeetingStore();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

  const sortedRecordings = recordings.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const playRecording = async (recording: Recording) => {
    if (playingId === recording.id) {
      // Stop playing
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      setPlayingId(null);
      return;
    }

    // Stop any current sound
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recording.uri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setPlayingId(recording.id);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setPlayingId(null);
          setSound(null);
        }
      });
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const handleDeleteRecording = (recording: Recording) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRecording(recording.id),
        },
      ]
    );
  };

  const handleExportRecording = (recording: Recording) => {
    setSelectedRecording(recording);
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
          <Text className="text-2xl font-bold text-gray-900">Recordings</Text>
          <Text className="text-gray-600 mt-1">{recordings.length} recordings</Text>
        </View>

        {/* Recording Button */}
        <View className="py-8 items-center border-b border-gray-200">
          <RecordingButton />
          <Text className="mt-4 text-gray-600 text-center px-6">
            Tap to start recording your meeting or class
          </Text>
        </View>

        {/* Recordings List */}
        <ScrollView className="flex-1">
          {sortedRecordings.length === 0 ? (
            <View className="flex-1 items-center justify-center py-12">
              <Ionicons name="mic-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-500 text-lg mt-4">No recordings yet</Text>
              <Text className="text-gray-400 text-center mt-2 px-6">
                Start recording your first meeting or class to see it here
              </Text>
            </View>
          ) : (
            <View className="px-6 py-4">
              {sortedRecordings.map((recording) => (
                <Pressable 
                  key={recording.id} 
                  onPress={() => navigation.navigate('RecordingDetail', { recordingId: recording.id })}
                  className="mb-4 p-4 bg-gray-50 rounded-lg"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <EditableText
                        text={recording.title}
                        onSave={(newTitle) => updateRecording(recording.id, { title: newTitle })}
                        placeholder="Recording title"
                        maxLength={100}
                        textStyle="font-semibold text-gray-900 mb-1"
                      />
                      <Text className="text-gray-600 text-sm">
                        {new Date(recording.createdAt).toLocaleDateString()} at{' '}
                        {new Date(recording.createdAt).toLocaleTimeString()}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        Duration: {formatDuration(recording.duration)}
                      </Text>
                      
                      {recording.isTranscribing && (
                        <Text className="text-emerald-500 text-sm mt-1">
                          Transcribing...
                        </Text>
                      )}
                      
                      {recording.transcript && !recording.isTranscribing && !recording.summary && (
                        <Text className="text-emerald-600 text-sm mt-1 font-medium">
                          ✓ Ready to summarize
                        </Text>
                      )}
                      
                      {recording.transcript && !recording.isTranscribing && !recording.summary && (
                        <View className="mt-2">
                          <SummarizeButton
                            content={recording.transcript}
                            onSummaryGenerated={(summary) => updateRecording(recording.id, { summary })}
                            contentType="recording"
                            size="small"
                            variant="secondary"
                          />
                        </View>
                      )}
                      
                      {recording.summary && (
                        <View className="mt-2">
                          <TruncatedText
                            text={recording.summary}
                            wordLimit={15}
                            textStyle="text-gray-700 text-sm italic"
                            showEditIcon={false}
                            label="Summary"
                            useMarkdown={true}
                          />
                        </View>
                      )}
                    </View>
                    
                    <View className="flex-col items-end ml-4">
                      {/* Voice waves for playing state */}
                      <View className="h-4 mb-2">
                        <VoiceWaves 
                          isRecording={playingId === recording.id} 
                          size="small" 
                          color="#10B981" 
                        />
                      </View>
                      
                      <View className="flex-row">
                        <Pressable
                          onPress={() => playRecording(recording)}
                          className="p-2 mr-2"
                        >
                          <Ionicons
                            name={playingId === recording.id ? "pause" : "play"}
                            size={24}
                            color="#10B981"
                          />
                        </Pressable>
                      
                      {recording.transcript && (
                        <Pressable
                          onPress={() => handleExportRecording(recording)}
                          className="p-2 mr-2"
                        >
                          <Ionicons name="share-outline" size={24} color="#10B981" />
                        </Pressable>
                      )}
                      
                      <Pressable
                        onPress={() => handleDeleteRecording(recording)}
                        className="p-2"
                      >
                        <Ionicons name="trash-outline" size={24} color="#EF4444" />
                      </Pressable>
                      </View>
                    </View>
                  </View>
                  
                  {recording.transcript && (
                    <View className="mt-3 pt-3 border-t border-gray-200">
                      <TruncatedText
                        text={recording.transcript}
                        wordLimit={10}
                        onSave={(newTranscript) => updateRecording(recording.id, { transcript: newTranscript })}
                        multiline
                        placeholder="No transcript available"
                        textStyle="text-gray-800 text-sm leading-relaxed"
                        showEditIcon={true}
                        label="Transcript"
                      />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
        
        {/* Export Modal */}
        {selectedRecording && (
          <ExportOptions
            visible={exportModalVisible}
            onClose={() => {
              setExportModalVisible(false);
              setSelectedRecording(null);
            }}
            data={selectedRecording}
            type="recording"
          />
        )}
      </View>
    </SafeAreaView>
  );
};