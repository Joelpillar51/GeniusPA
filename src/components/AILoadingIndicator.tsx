import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { CircularDotSpinner } from './CircularDotSpinner';

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
    <View className="self-start bg-gray-100 p-4 rounded-2xl rounded-bl-md mb-4" style={{ maxWidth: '85%', minWidth: '50%' }}>
      <View className="flex-row items-center mb-3">
        <CircularDotSpinner 
          size={24} 
          color={stageInfo.color}
          dotCount={8}
        />
        <Text className="ml-3 text-base font-semibold" style={{ color: stageInfo.color }}>
          {Math.round(Math.max(currentProgress, 5))}%
        </Text>
      </View>
      
      <Text className="text-gray-800 font-medium text-base leading-relaxed mb-2">
        {message || `${stageInfo.text}${dots}`}
      </Text>
      
      <Text className="text-gray-500 text-xs">
        {new Date().toLocaleTimeString()}
      </Text>
    </View>
  );
};