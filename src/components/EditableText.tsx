import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cn } from '../utils/cn';

interface EditableTextProps {
  text: string;
  onSave: (newText: string) => void;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
  style?: string;
  textStyle?: string;
  showEditIcon?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({
  text,
  onSave,
  multiline = false,
  placeholder = "Enter text...",
  maxLength,
  style = "",
  textStyle = "",
  showEditIcon = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);

  const handleSave = () => {
    if (editedText.trim() !== text.trim()) {
      onSave(editedText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(text);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setEditedText(text);
    setIsEditing(true);
  };

  return (
    <View className={cn("flex-row items-start", style)}>
      <Text 
        className={cn("flex-1", textStyle)} 
        onPress={multiline ? undefined : handleEdit}
      >
        {text || placeholder}
      </Text>
      
      {showEditIcon && (
        <Pressable onPress={handleEdit} className="ml-2 p-1">
          <Ionicons name="pencil" size={16} color="#6B7280" />
        </Pressable>
      )}

      <Modal
        visible={isEditing}
        transparent
        animationType="fade"
      >
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-lg p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              {multiline ? "Edit Transcription" : "Edit Title"}
            </Text>
            
            <TextInput
              value={editedText}
              onChangeText={setEditedText}
              multiline={multiline}
              placeholder={placeholder}
              maxLength={maxLength}
              className={cn(
                "border border-gray-300 rounded-lg px-4 py-3 text-gray-900",
                multiline ? "min-h-[120px]" : "h-12"
              )}
              style={{ textAlignVertical: multiline ? 'top' : 'center' }}
              autoFocus
            />
            
            {maxLength && (
              <Text className="text-xs text-gray-500 mt-1 text-right">
                {editedText.length}/{maxLength}
              </Text>
            )}
            
            <View className="flex-row justify-end mt-6 space-x-3">
              <Pressable
                onPress={handleCancel}
                className="px-4 py-2 rounded-lg bg-gray-200"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </Pressable>
              
              <Pressable
                onPress={handleSave}
                className="px-4 py-2 rounded-lg bg-blue-500 ml-3"
              >
                <Text className="text-white font-medium">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};