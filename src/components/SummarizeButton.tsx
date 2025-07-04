import React, { useState } from 'react';
import { Pressable, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOpenAIChatResponse } from '../api/chat-service';
import { cn } from '../utils/cn';

interface SummarizeButtonProps {
  content: string;
  onSummaryGenerated: (summary: string) => void;
  contentType?: 'recording' | 'document';
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary';
}

export const SummarizeButton: React.FC<SummarizeButtonProps> = ({
  content,
  onSummaryGenerated,
  contentType = 'recording',
  size = 'medium',
  variant = 'primary',
}) => {
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSummarize = async () => {
    if (!content || content.trim().length === 0) {
      Alert.alert('No Content', `No ${contentType === 'recording' ? 'transcript' : 'content'} available to summarize.`);
      return;
    }

    setIsSummarizing(true);
    try {
      const prompt = contentType === 'recording'
        ? `Please provide a concise summary of this meeting/class recording transcript in 2-3 sentences. Focus on the main topics and key points discussed:\n\n${content}`
        : `Please provide a concise summary of this document in 2-3 sentences. Focus on the main topics and key points:\n\n${content}`;

      const summaryResponse = await getOpenAIChatResponse(prompt);
      onSummaryGenerated(summaryResponse.content);
    } catch (error) {
      console.error('Error generating summary:', error);
      Alert.alert('Error', 'Failed to generate summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-2';
      case 'large':
        return 'px-6 py-4';
      default:
        return 'px-4 py-3';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  const getVariantClasses = () => {
    if (variant === 'secondary') {
      return 'bg-gray-100 border border-gray-300';
    }
    return 'bg-emerald-500';
  };

  const getTextColor = () => {
    if (variant === 'secondary') {
      return isSummarizing ? 'text-gray-400' : 'text-gray-700';
    }
    return 'text-white';
  };

  const getIconColor = () => {
    if (variant === 'secondary') {
      return isSummarizing ? '#9CA3AF' : '#6B7280';
    }
    return 'white';
  };

  return (
    <Pressable
      onPress={handleSummarize}
      disabled={isSummarizing}
      className={cn(
        'flex-row items-center justify-center rounded-lg',
        getSizeClasses(),
        getVariantClasses(),
        isSummarizing && 'opacity-60'
      )}
    >
      <Ionicons
        name={isSummarizing ? 'hourglass-outline' : 'document-text-outline'}
        size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
        color={getIconColor()}
      />
      <Text className={cn('font-medium ml-2', getTextSizeClasses(), getTextColor())}>
        {isSummarizing ? 'Summarizing...' : 'Summarize'}
      </Text>
    </Pressable>
  );
};