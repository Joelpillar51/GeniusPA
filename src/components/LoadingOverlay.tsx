import React from 'react';
import { View, Text, ActivityIndicator, Modal } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  message = 'Loading...' 
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View className="flex-1 bg-black/50 items-center justify-center">
        <View className="bg-white rounded-lg p-6 items-center min-w-[200px]">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-gray-700 mt-4 text-center font-medium">
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
};