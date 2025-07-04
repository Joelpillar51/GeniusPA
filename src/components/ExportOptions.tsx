import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { exportChatAsDocument, exportTranscriptAsDocument, exportDocumentAsDocument } from '../utils/documentExport';
import { ChatSession, Recording, Document } from '../types/meeting';
import { cn } from '../utils/cn';

interface ExportOptionsProps {
  visible: boolean;
  onClose: () => void;
  data: ChatSession | Recording | Document;
  type: 'chat' | 'recording' | 'document';
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  visible,
  onClose,
  data,
  type,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'txt' | 'rtf' | 'md') => {
    setIsExporting(true);
    try {
      switch (type) {
        case 'chat':
          await exportChatAsDocument(data as ChatSession, format);
          break;
        case 'recording':
          await exportTranscriptAsDocument(data as Recording, format);
          break;
        case 'document':
          await exportDocumentAsDocument(data as Document, format);
          break;
      }
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'chat':
        return 'Export Chat Conversation';
      case 'recording':
        return 'Export Recording Transcript';
      case 'document':
        return 'Export Document Content';
      default:
        return 'Export';
    }
  };

  const formatOptions = [
    {
      key: 'txt' as const,
      title: 'Text File (.txt)',
      description: 'Plain text format - universal compatibility',
      icon: 'document-text-outline' as const,
      color: '#6B7280',
    },
    {
      key: 'rtf' as const,
      title: 'Rich Text (.rtf)',
      description: 'Opens in Word, Pages, and other text editors',
      icon: 'document-outline' as const,
      color: '#3B82F6',
    },
    {
      key: 'md' as const,
      title: 'Markdown (.md)',
      description: 'Formatted text - great for documentation',
      icon: 'code-outline' as const,
      color: '#10B981',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-xl">
          {/* Header */}
          <View className="px-6 py-4 border-b border-gray-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">
                {getTitle()}
              </Text>
              <Pressable onPress={onClose} className="p-2 -mr-2">
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>
            <Text className="text-gray-600 text-sm mt-1">
              Choose your preferred export format
            </Text>
          </View>

          {/* Format Options */}
          <View className="px-6 py-4">
            {formatOptions.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => handleExport(option.key)}
                disabled={isExporting}
                className={cn(
                  "flex-row items-center p-4 rounded-lg border border-gray-200 mb-3",
                  isExporting ? "opacity-50" : "active:bg-gray-50"
                )}
              >
                <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: `${option.color}15` }}>
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={option.color}
                  />
                </View>
                
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 mb-1">
                    {option.title}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {option.description}
                  </Text>
                </View>
                
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
            ))}
          </View>

          {/* Info */}
          <View className="px-6 py-4 bg-blue-50 border-t border-blue-100">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <View className="ml-3 flex-1">
                <Text className="text-blue-900 font-medium text-sm">
                  About Export Formats
                </Text>
                <Text className="text-blue-800 text-xs mt-1 leading-relaxed">
                  • RTF files can be opened in Microsoft Word, Apple Pages, and Google Docs
                  • Text files work with any text editor or note-taking app
                  • Markdown files are great for technical documentation and can be converted to PDF
                </Text>
              </View>
            </View>
          </View>

          {isExporting && (
            <View className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <View className="flex-row items-center justify-center">
                <Ionicons name="hourglass-outline" size={20} color="#6B7280" />
                <Text className="ml-2 text-gray-600">Preparing export...</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};