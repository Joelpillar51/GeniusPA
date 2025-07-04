import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { exportChatAsDocument, exportTranscriptAsDocument, exportDocumentAsDocument } from '../utils/documentExport';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { ChatSession, Recording, Document } from '../types/meeting';
import { UpgradeModal } from './UpgradeModal';
import { useNavigation } from '@react-navigation/native';
import { navigateToSubscription } from '../utils/subscriptionNavigation';
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
  const navigation = useNavigation<any>();
  const [isExporting, setIsExporting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { canExport } = useSubscriptionStore();

  const handleExport = async (format: 'txt' | 'rtf' | 'md') => {
    // Check export permissions
    const exportCheck = canExport(format);
    if (!exportCheck.allowed) {
      Alert.alert('Upgrade Required', exportCheck.reason!, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade Now', onPress: () => {
          onClose();
          navigateToSubscription(navigation);
        }},
      ]);
      return;
    }

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
      available: canExport('txt').allowed,
    },
    {
      key: 'rtf' as const,
      title: 'Rich Text (.rtf)',
      description: 'Opens in Word, Pages, and other text editors',
      icon: 'document-outline' as const,
      color: '#10B981',
      available: canExport('rtf').allowed,
    },
    {
      key: 'md' as const,
      title: 'Markdown (.md)',
      description: 'Formatted text - great for documentation',
      icon: 'code-outline' as const,
      color: '#10B981',
      available: canExport('md').allowed,
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
                disabled={isExporting || !option.available}
                className={cn(
                  "flex-row items-center p-4 rounded-lg border border-gray-200 mb-3",
                  isExporting || !option.available ? "opacity-50" : "active:bg-gray-50"
                )}
              >
                <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: `${option.color}15` }}>
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={option.available ? option.color : '#9CA3AF'}
                  />
                </View>
                
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className={cn(
                      "font-semibold mb-1",
                      option.available ? "text-gray-900" : "text-gray-500"
                    )}>
                      {option.title}
                    </Text>
                    {!option.available && (
                      <View className="ml-2 bg-orange-100 px-2 py-1 rounded">
                        <Text className="text-orange-700 text-xs font-medium">PRO</Text>
                      </View>
                    )}
                  </View>
                  <Text className={cn(
                    "text-sm",
                    option.available ? "text-gray-600" : "text-gray-500"
                  )}>
                    {option.available ? option.description : 'Upgrade to Pro to access this format'}
                  </Text>
                </View>
                
                <Ionicons 
                  name={option.available ? "chevron-forward" : "lock-closed"} 
                  size={20} 
                  color="#9CA3AF" 
                />
              </Pressable>
            ))}
          </View>

          {/* Info */}
          <View className="px-6 py-4 bg-emerald-50 border-t border-emerald-100">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#10B981" />
              <View className="ml-3 flex-1">
                <Text className="text-emerald-900 font-medium text-sm">
                  About Export Formats
                </Text>
                <Text className="text-emerald-800 text-xs mt-1 leading-relaxed">
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
      
      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        context={{
          feature: 'Export Formats',
          limitation: 'Free users can only export to text format.',
          benefits: [
            'Export to RTF for Microsoft Word',
            'Export to Markdown for documentation',
            'All formats with Pro subscription',
          ],
        }}
      />
    </Modal>
  );
};