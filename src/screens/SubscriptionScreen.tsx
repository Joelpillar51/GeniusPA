import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../state/authStore';
import { useSubscriptionStore } from '../state/subscriptionStore';

export const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuthStore();
  const { updateSubscription } = useSubscriptionStore();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    
    // Simulate subscription process
    setTimeout(() => {
      const newSubscription = {
        isActive: true,
        plan: 'pro' as const,
        billingCycle: selectedPlan,
        expiresAt: new Date(Date.now() + (selectedPlan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
      };
      
      updateUser({ subscription: newSubscription });
      updateSubscription(newSubscription);
      setIsProcessing(false);
      
      Alert.alert(
        "Subscription Activated!",
        "Welcome to GeniusPA Pro! You now have access to all premium features.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }, 2000);
  };

  const monthlyPrice = 5.99;
  const yearlyPrice = 59.99;
  const yearlySavings = ((monthlyPrice * 12) - yearlyPrice).toFixed(2);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
        <Pressable
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
        >
          <Ionicons name="close" size={24} color="#374151" />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-semibold text-gray-900">
          Upgrade to Pro
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-emerald-500 rounded-full items-center justify-center mb-4">
              <Ionicons name="star" size={32} color="white" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Unlock Premium Features
            </Text>
            <Text className="text-gray-600 text-center">
              Get unlimited access to all GeniusPA features
            </Text>
          </View>

          {/* Features List */}
          <View className="mb-8">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              What you'll get:
            </Text>
            {[
              'Unlimited recording time',
              'Unlimited recordings per day',
              'Unlimited documents',
              'Unlimited AI chat projects',
              'Export to PDF & Word formats',
              'Advanced AI insights',
              'Priority support',
              'No ads'
            ].map((feature, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <View className="w-6 h-6 bg-emerald-500 rounded-full items-center justify-center mr-3">
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
                <Text className="text-gray-700 flex-1">{feature}</Text>
              </View>
            ))}
          </View>

          {/* Pricing Cards */}
          <View className="space-y-4 mb-8">
            {/* Monthly Plan */}
            <Pressable
              onPress={() => setSelectedPlan('monthly')}
              className={`border-2 rounded-2xl p-6 ${
                selectedPlan === 'monthly'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-lg font-semibold text-gray-900">
                    Monthly Plan
                  </Text>
                  <Text className="text-gray-600">
                    Billed monthly
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-gray-900">
                    ${monthlyPrice}
                  </Text>
                  <Text className="text-gray-600">per month</Text>
                </View>
              </View>
              {selectedPlan === 'monthly' && (
                <View className="w-6 h-6 bg-emerald-500 rounded-full items-center justify-center self-end">
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
            </Pressable>

            {/* Yearly Plan */}
            <Pressable
              onPress={() => setSelectedPlan('yearly')}
              className={`border-2 rounded-2xl p-6 relative ${
                selectedPlan === 'yearly'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Popular Badge */}
              <View className="absolute -top-3 left-6 bg-emerald-500 px-3 py-1 rounded-full">
                <Text className="text-white text-sm font-semibold">
                  MOST POPULAR
                </Text>
              </View>
              
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-lg font-semibold text-gray-900">
                    Yearly Plan
                  </Text>
                  <Text className="text-emerald-600 font-medium">
                    Save ${yearlySavings}/year
                  </Text>
                </View>
                <View className="items-end">
                  <View className="flex-row items-baseline">
                    <Text className="text-2xl font-bold text-gray-900">
                      ${yearlyPrice}
                    </Text>
                    <Text className="text-gray-600 ml-1">per year</Text>
                  </View>
                  <Text className="text-gray-500 text-sm">
                    ${(yearlyPrice / 12).toFixed(2)}/month
                  </Text>
                </View>
              </View>
              {selectedPlan === 'yearly' && (
                <View className="w-6 h-6 bg-emerald-500 rounded-full items-center justify-center self-end">
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
            </Pressable>
          </View>

          {/* Subscribe Button */}
          <Pressable
            onPress={handleSubscribe}
            disabled={isProcessing}
            className={`bg-emerald-500 rounded-2xl p-4 items-center mb-4 ${
              isProcessing ? 'opacity-50' : ''
            }`}
          >
            <Text className="text-white text-lg font-semibold">
              {isProcessing 
                ? 'Processing...' 
                : `Start ${selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Plan`
              }
            </Text>
          </Pressable>

          {/* Terms */}
          <Text className="text-center text-gray-500 text-sm mb-4">
            By subscribing, you agree to our Terms of Service and Privacy Policy.
            Cancel anytime in your account settings.
          </Text>

          {/* Money Back Guarantee */}
          <View className="flex-row items-center justify-center">
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text className="text-emerald-600 text-sm font-medium ml-2">
              7-day money-back guarantee
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};