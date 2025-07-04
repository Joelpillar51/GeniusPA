import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TestProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TestProfileModal: React.FC<TestProfileModalProps> = ({ visible, onClose }) => {
  console.log('TestProfileModal render:', visible);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <View style={{ 
          backgroundColor: 'white', 
          borderRadius: 16, 
          padding: 24,
          margin: 20,
          width: '80%',
          maxWidth: 400
        }}>
          {/* Header */}
          <View style={{ 
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20
          }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
              Test Profile
            </Text>
            <Pressable onPress={onClose} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Content */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ 
              width: 80, 
              height: 80, 
              backgroundColor: '#10B981', 
              borderRadius: 40, 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>
                J
              </Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
              Test User
            </Text>
            <Text style={{ color: '#6B7280', marginTop: 4 }}>
              test@example.com
            </Text>
          </View>

          {/* Close Button */}
          <Pressable
            onPress={onClose}
            style={{ 
              backgroundColor: '#10B981', 
              padding: 16, 
              borderRadius: 12, 
              alignItems: 'center' 
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Close Profile
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};