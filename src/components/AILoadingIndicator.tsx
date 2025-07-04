import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TypingIndicator } from './TypingIndicator';

interface AILoadingIndicatorProps {
  message?: string;
  stage?: 'thinking' | 'analyzing' | 'generating' | 'finalizing';
}

export const AILoadingIndicator: React.FC<AILoadingIndicatorProps> = ({ 
  message, 
  stage = 'thinking' 
}) => {
  const [dots, setDots] = useState('');
  const [currentStage, setCurrentStage] = useState(stage);

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

  // Auto-progress through stages for better UX
  useEffect(() => {
    if (!message) {
      const stages = ['thinking', 'analyzing', 'generating', 'finalizing'];
      let currentIndex = stages.indexOf(stage);
      
      const interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % stages.length;
        setCurrentStage(stages[currentIndex] as any);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [stage, message]);

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
    <View className="self-start bg-gray-50 border border-gray-200 p-4 rounded-2xl rounded-bl-md mb-4 max-w-[80%]">
      <View className="flex-row items-center">
        <View className="mr-3">
          <View 
            className="w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: `${stageInfo.color}20` }}
          >
            <Ionicons 
              name={stageInfo.icon} 
              size={16} 
              color={stageInfo.color} 
            />
          </View>
        </View>
        
        <View className="flex-1">
          <Text className="text-gray-900 font-medium">
            {message || `${stageInfo.text}${dots}`}
          </Text>
          
          {!message && (
            <View className="mt-3">
              <View className="flex-row items-center mb-2">
                <View className="flex-1 bg-gray-200 h-1 rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full"
                    style={{ 
                      backgroundColor: stageInfo.color,
                      width: currentStage === 'thinking' ? '25%' :
                             currentStage === 'analyzing' ? '50%' :
                             currentStage === 'generating' ? '75%' : '95%'
                    }}
                  />
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <TypingIndicator isVisible={true} color={stageInfo.color} />
                <ActivityIndicator 
                  size="small" 
                  color={stageInfo.color}
                />
              </View>
            </View>
          )}
        </View>
      </View>
      
      <Text className="text-gray-400 text-xs mt-2">
        {new Date().toLocaleTimeString()}
      </Text>
    </View>
  );
};