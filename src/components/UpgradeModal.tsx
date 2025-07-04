import React from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../state/subscriptionStore';
import { UpgradePromptContext } from '../types/subscription';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  context?: UpgradePromptContext;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  visible,
  onClose,
  context,
}) => {
  const { plan, upgradePlan, recordUpgradePrompt } = useSubscriptionStore();

  const handleUpgrade = (newPlan: 'pro' | 'premium') => {
    upgradePlan(newPlan);
    recordUpgradePrompt();
    onClose();
  };

  const plans = [
    {
      id: 'pro',
      name: 'Pro',
      price: '$9.99/month',
      color: '#10B981',
      backgroundColor: '#ECFDF5',
      features: [
        '1 hour recording limit',
        '50 recordings per day',
        '100 documents',
        '10 AI chat projects',
        'All export formats',
        'Email support',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$19.99/month',
      color: '#8B5CF6',
      backgroundColor: '#F3E8FF',
      features: [
        'Unlimited recordings',
        'Unlimited documents',
        'Unlimited AI chats',
        'All export formats',
        'Priority support',
        'Advanced analytics',
      ],
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
        <View className="bg-white rounded-t-3xl max-h-[85%]">
          {/* Header */}
          <View className="px-6 py-4 border-b border-gray-200">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-gray-900">
                Upgrade GeniusPA
              </Text>
              <Pressable onPress={onClose} className="p-2 -mr-2">
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>
            {context && (
              <Text className="text-gray-600 mt-2">
                {context.limitation}
              </Text>
            )}
          </View>

          <ScrollView className="flex-1 px-6 py-6">
            {/* Current Plan */}
            <View className="mb-6 p-4 bg-gray-50 rounded-2xl">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-900 font-semibold text-lg">Current Plan: Free</Text>
                  <Text className="text-gray-600 text-sm">
                    5 min recordings • 3/day • 1 document • 1 AI chat
                  </Text>
                </View>
                <View className="w-12 h-12 bg-gray-300 rounded-full items-center justify-center">
                  <Ionicons name="lock-closed" size={20} color="#6B7280" />
                </View>
              </View>
            </View>

            {/* Plan Options */}
            <View className="space-y-4">
              {plans.map((planOption) => (
                <View
                  key={planOption.id}
                  className="p-6 rounded-2xl border-2"
                  style={{ 
                    borderColor: planOption.color,
                    backgroundColor: planOption.backgroundColor 
                  }}
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <View>
                      <Text className="text-2xl font-bold" style={{ color: planOption.color }}>
                        {planOption.name}
                      </Text>
                      <Text className="text-lg font-semibold text-gray-900">
                        {planOption.price}
                      </Text>
                    </View>
                    <View 
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: planOption.color }}
                    >
                      <Ionicons name="star" size={20} color="white" />
                    </View>
                  </View>

                  {/* Features */}
                  <View className="mb-6">
                    {planOption.features.map((feature, index) => (
                      <View key={index} className="flex-row items-center mb-2">
                        <Ionicons name="checkmark-circle" size={16} color={planOption.color} />
                        <Text className="ml-2 text-gray-700">{feature}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Upgrade Button */}
                  <Pressable
                    onPress={() => handleUpgrade(planOption.id as 'pro' | 'premium')}
                    className="rounded-xl py-4 items-center"
                    style={{ backgroundColor: planOption.color }}
                  >
                    <Text className="text-white font-bold text-lg">
                      Upgrade to {planOption.name}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Benefits */}
            {context?.benefits && (
              <View className="mt-6 p-4 bg-emerald-50 rounded-2xl">
                <Text className="text-emerald-900 font-semibold mb-2">
                  Why upgrade?
                </Text>
                {context.benefits.map((benefit, index) => (
                  <Text key={index} className="text-emerald-800 text-sm mb-1">
                    • {benefit}
                  </Text>
                ))}
              </View>
            )}

            {/* Footer */}
            <View className="mt-6 p-4 bg-gray-50 rounded-2xl">
              <Text className="text-gray-600 text-sm text-center">
                ✨ All plans include secure data storage and regular updates
              </Text>
              <Text className="text-gray-500 text-xs text-center mt-2">
                Cancel anytime • 7-day free trial for new subscribers
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};