import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '../utils/cn';

interface MarkdownTextProps {
  text: string;
  className?: string;
  baseTextStyle?: string;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ 
  text, 
  className = "",
  baseTextStyle = "text-base text-gray-900"
}) => {
  
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactElement[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim() === '') {
        // Empty line - add spacing
        elements.push(<View key={`space-${i}`} className="h-2" />);
        continue;
      }
      
      // Headers (### ## #)
      if (line.startsWith('###')) {
        const headerText = line.replace(/^###\s*/, '').replace(/\*\*/g, '');
        elements.push(
          <Text key={i} className={cn("text-lg font-bold text-gray-900 mt-3 mb-2", className)}>
            {headerText}
          </Text>
        );
        continue;
      }
      
      if (line.startsWith('##')) {
        const headerText = line.replace(/^##\s*/, '').replace(/\*\*/g, '');
        elements.push(
          <Text key={i} className={cn("text-xl font-bold text-gray-900 mt-4 mb-2", className)}>
            {headerText}
          </Text>
        );
        continue;
      }
      
      if (line.startsWith('#')) {
        const headerText = line.replace(/^#\s*/, '').replace(/\*\*/g, '');
        elements.push(
          <Text key={i} className={cn("text-2xl font-bold text-gray-900 mt-4 mb-3", className)}>
            {headerText}
          </Text>
        );
        continue;
      }
      
      // List items
      if (line.match(/^\d+\.\s/) || line.startsWith('•') || line.startsWith('-')) {
        const listText = line.replace(/^\d+\.\s*/, '').replace(/^[•-]\s*/, '');
        const formattedElements = renderInlineMarkdown(listText, baseTextStyle, className);
        elements.push(
          <View key={i} className="flex-row mb-1">
            <Text className={cn(baseTextStyle, className)}>• </Text>
            <Text className={cn(baseTextStyle, "flex-1", className)}>
              {formattedElements}
            </Text>
          </View>
        );
        continue;
      }
      
      // Regular paragraph
      const formattedElements = renderInlineMarkdown(line, baseTextStyle, className);
      elements.push(
        <Text key={i} className={cn(baseTextStyle, "mb-2 leading-relaxed", className)}>
          {formattedElements}
        </Text>
      );
    }
    
    return elements;
  };
  
  const renderInlineMarkdown = (text: string, baseStyle: string, className: string) => {
    const parts = [];
    let currentIndex = 0;
    let key = 0;
    
    // Handle bold text **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the bold part
      if (match.index > currentIndex) {
        parts.push(
          <React.Fragment key={key++}>
            {text.substring(currentIndex, match.index)}
          </React.Fragment>
        );
      }
      
      // Add the bold part
      parts.push(
        <Text key={key++} className={cn(baseStyle, "font-bold", className)}>
          {match[1]}
        </Text>
      );
      
      currentIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(
        <React.Fragment key={key++}>
          {text.substring(currentIndex)}
        </React.Fragment>
      );
    }
    
    return parts.length > 0 ? parts : text;
  };
  
  return (
    <View className={className}>
      {parseMarkdown(text)}
    </View>
  );
};