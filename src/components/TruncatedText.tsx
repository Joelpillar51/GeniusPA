import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../utils/cn';
import { EditableText } from './EditableText';
import { MarkdownText } from './MarkdownText';

interface TruncatedTextProps {
  text: string;
  wordLimit?: number;
  onSave?: (newText: string) => void;
  multiline?: boolean;
  placeholder?: string;
  textStyle?: string;
  showEditIcon?: boolean;
  label?: string;
  useMarkdown?: boolean;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  wordLimit = 10,
  onSave,
  multiline = true,
  placeholder = "No content available",
  textStyle = "text-gray-800 text-sm leading-relaxed",
  showEditIcon = true,
  label = "Content",
  useMarkdown = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const getFirstWords = (text: string, limit: number): string => {
    const words = text.trim().split(/\s+/);
    if (words.length <= limit) {
      return text;
    }
    return words.slice(0, limit).join(' ');
  };

  const shouldTruncate = () => {
    const words = text.trim().split(/\s+/);
    return words.length > wordLimit;
  };

  const displayText = isExpanded || !shouldTruncate() 
    ? text 
    : getFirstWords(text, wordLimit);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!text || text.trim().length === 0) {
    return (
      <View>
        <Text className={cn("text-gray-500 italic", textStyle)}>
          {placeholder}
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-600 text-xs font-medium uppercase tracking-wide">
          {label}
        </Text>
        <View className="flex-row items-center">
          {shouldTruncate() && (
            <Pressable 
              onPress={toggleExpanded}
              className="flex-row items-center mr-2 px-2 py-1 bg-blue-50 rounded-md"
            >
              <Text className="text-blue-600 text-xs font-medium mr-1">
                {isExpanded ? 'Show Less' : 'Show More'}
              </Text>
              <Ionicons 
                name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                size={12} 
                color="#2563EB" 
              />
            </Pressable>
          )}
          {showEditIcon && onSave && (
            <Pressable onPress={() => setIsEditing(true)}>
              <Ionicons name="create-outline" size={16} color="#6B7280" />
            </Pressable>
          )}
        </View>
      </View>
      
      {isEditing && onSave ? (
        <EditableText
          text={text}
          onSave={(newText) => {
            onSave(newText);
            setIsEditing(false);
          }}
          multiline={multiline}
          placeholder={placeholder}
          textStyle={textStyle}
          showEditIcon={false}
        />
      ) : (
        <>
          <Pressable onPress={shouldTruncate() ? toggleExpanded : undefined}>
            {useMarkdown ? (
              <MarkdownText 
                text={displayText + (shouldTruncate() && !isExpanded ? ' ...' : '')}
                baseTextStyle={textStyle}
              />
            ) : (
              <Text className={textStyle}>
                {displayText}
                {shouldTruncate() && !isExpanded && (
                  <Text className="text-blue-600 font-medium"> ...</Text>
                )}
              </Text>
            )}
            {shouldTruncate() && !isExpanded && (
              <View className="mt-1 px-2 py-1 bg-blue-50 rounded-md self-start">
                <Text className="text-blue-600 text-xs font-medium">
                  +{text.trim().split(/\s+/).length - wordLimit} more words
                </Text>
              </View>
            )}
          </Pressable>

        </>
      )}
    </View>
  );
};