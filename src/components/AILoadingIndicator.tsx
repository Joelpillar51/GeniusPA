import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TypingIndicator } from './TypingIndicator';

interface AILoadingIndicatorProps {
  message?: string;
  stage?: 'thinking' | 'analyzing' | 'generating' | 'finalizing';
  progress?: number; // 0-100 percentage
}

export const AILoadingIndicator: React.FC<AILoadingIndicatorProps> = ({ 
  message, 
  stage = 'thinking',
  progress 
}) => {
  const [dots, setDots] = useState('');
  const [currentStage, setCurrentStage] = useState(stage);
  const [currentProgress, setCurrentProgress] = useState(progress || 0);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Auto-progress through stages and percentage for better UX
  useEffect(() => {
    if (progress !== undefined && progress > 0) {
      setCurrentProgress(progress);
      return;
    }
    
    // Fallback auto-progression if no specific progress is provided
    const stages = ['thinking', 'analyzing', 'generating', 'finalizing'];
    let currentIndex = stages.indexOf(stage);
    let progressValue = Math.max((currentIndex + 1) * 25, 10); // Minimum 10%
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % stages.length;
      progressValue = Math.min((currentIndex + 1) * 25, 95); // Max 95% for auto
      setCurrentStage(stages[currentIndex] as any);
      setCurrentProgress(progressValue);
    }, 2000);

    return () => clearInterval(interval);
  }, [stage, message, progress]);

  const getStageInfo = () => {
    switch (currentStage) {
      case 'thinking':
        return {
          icon: 'bulb' as const,
          text: 'AI is thinking',
          color: '#3B82F6'
        };
      case 'analyzing':
        return {
          icon: 'analytics' as const,
          text: 'Analyzing your request',
          color: '#8B5CF6'
        };
      case 'generating':
        return {
          icon: 'create' as const,
          text: 'Generating response',
          color: '#10B981'
        };
      case 'finalizing':
        return {
          icon: 'checkmark-circle' as const,
          text: 'Finalizing answer',
          color: '#F59E0B'
        };
      default:
        return {
          icon: 'bulb' as const,
          text: 'AI is working',
          color: '#3B82F6'
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <View className="self-start bg-white border-2 p-4 rounded-2xl rounded-bl-md shadow-sm max-w-[85%]" style={{ borderColor: `${stageInfo.color}30` }}>
      <View className="flex-row items-center">
        <View className="mr-3">
          <View 
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: `${stageInfo.color}20` }}
          >
            <Ionicons 
              name={stageInfo.icon} 
              size={18} 
              color={stageInfo.color} 
            />
          </View>
        </View>
        
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold text-base">
            {message || `${stageInfo.text}${dots}`}
          </Text>
          
          <View className="mt-3">
            <View className="flex-row items-center mb-3">
              <View className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                <View 
                  className="h-full rounded-full"
                  style={{ 
                    backgroundColor: stageInfo.color,
                    width: `${Math.min(Math.max(currentProgress, 5), 100)}%`
                  }}
                />
              </View>
            </View>
            <View className="flex-row items-center justify-between">
              <TypingIndicator isVisible={true} color={stageInfo.color} />
              <View className="flex-row items-center">
                <Text className="text-sm font-bold mr-2" style={{ color: stageInfo.color }}>
                  {Math.round(Math.max(currentProgress, 5))}%
                </Text>
                <ActivityIndicator 
                  size="small" 
                  color={stageInfo.color}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
      
      <Text className="text-gray-400 text-xs mt-2">
        {new Date().toLocaleTimeString()}
      </Text>
    </View>
  );
};