import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../state/authStore';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Record & Transcribe',
    description: 'Capture your meetings and classes with high-quality audio recording. Our AI automatically transcribes everything for you.',
    icon: 'mic-circle',
    color: '#3B82F6',
  },
  {
    id: '2',
    title: 'Upload Documents',
    description: 'Upload text files and PDFs to analyze and summarize their content. Perfect for research and study materials.',
    icon: 'document-text',
    color: '#10B981',
  },
  {
    id: '3',
    title: 'Chat with AI',
    description: 'Ask questions about your recordings and documents. Get insights, summaries, and study questions powered by AI.',
    icon: 'chatbubbles',
    color: '#8B5CF6',
  },
  {
    id: '4',
    title: 'Export & Share',
    description: 'Export your transcripts and conversations to share with others or save for later reference.',
    icon: 'share',
    color: '#F59E0B',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { setHasSeenOnboarding } = useAuthStore();

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      scrollRef.current?.scrollTo({ x: prevIndex * width, animated: true });
    }
  };

  const handleComplete = () => {
    setHasSeenOnboarding(true);
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <Text className="text-lg font-bold text-gray-900">MeetingAI</Text>
        <Pressable onPress={handleSkip}>
          <Text className="text-blue-500 font-medium">Skip</Text>
        </Pressable>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
        className="flex-1"
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={{ width }} className="flex-1 items-center justify-center px-8">
            <LinearGradient
              colors={[slide.color + '20', slide.color + '10']}
              className="w-32 h-32 rounded-full items-center justify-center mb-8"
            >
              <Ionicons name={slide.icon} size={64} color={slide.color} />
            </LinearGradient>

            <Text className="text-2xl font-bold text-gray-900 text-center mb-4">
              {slide.title}
            </Text>

            <Text className="text-gray-600 text-center text-lg leading-relaxed px-4">
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Page Indicators */}
      <View className="flex-row justify-center items-center mb-8">
        {slides.map((_, index) => (
          <View
            key={index}
            className={`w-2 h-2 rounded-full mx-1 ${
              index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View className="flex-row justify-between items-center px-6 pb-8">
        <Pressable
          onPress={handlePrevious}
          disabled={currentIndex === 0}
          className={`w-12 h-12 rounded-full items-center justify-center ${
            currentIndex === 0 ? 'bg-gray-100' : 'bg-gray-200'
          }`}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={currentIndex === 0 ? '#D1D5DB' : '#6B7280'}
          />
        </Pressable>

        <View className="flex-1 mx-4">
          <Text className="text-center text-gray-500 text-sm">
            {currentIndex + 1} of {slides.length}
          </Text>
        </View>

        <Pressable
          onPress={handleNext}
          className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center"
        >
          <Ionicons
            name={currentIndex === slides.length - 1 ? 'checkmark' : 'chevron-forward'}
            size={24}
            color="white"
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};