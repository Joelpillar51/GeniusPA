import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { LoadingOverlay } from '../components/LoadingOverlay';

interface SignInScreenProps {
  onSignUpPress: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ onSignUpPress }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, isLoading } = useAuthStore();

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await signIn({ email: email.trim().toLowerCase(), password });
    } catch (error) {
      Alert.alert('Sign In Failed', 'Invalid email or password. Please try again.');
    }
  };

  const handleDemoLogin = async () => {
    try {
      await signIn({ 
        email: 'demo@meetingai.com', 
        password: 'demo123' 
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in with demo account');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-8 pt-16 pb-8 items-center">
            {/* App Icon */}
            <View className="w-24 h-24 bg-emerald-100 rounded-3xl items-center justify-center mb-8">
              <View className="w-16 h-16 bg-emerald-500 rounded-2xl items-center justify-center">
                <Ionicons name="mic" size={28} color="white" />
              </View>
            </View>

            {/* Welcome Text */}
            <Text className="text-3xl font-bold text-gray-900 mb-3">
              Welcome Back
            </Text>
            <Text className="text-gray-600 text-center text-lg leading-relaxed">
              Sign in to access your meetings{'\n'}and transcripts
            </Text>
          </View>

          {/* Form */}
          <View className="px-8 pb-8">
            {/* Email Input */}
            <View className="mb-6">
              <Text className="text-gray-800 font-semibold mb-3 text-base">Email Address</Text>
              <View className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 flex-row items-center">
                <Ionicons name="mail-outline" size={22} color="#10B981" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  className="flex-1 ml-4 text-gray-900 text-base"
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-8">
              <Text className="text-gray-800 font-semibold mb-3 text-base">Password</Text>
              <View className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 flex-row items-center">
                <Ionicons name="lock-closed-outline" size={22} color="#10B981" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  className="flex-1 ml-4 text-gray-900 text-base"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} className="p-1">
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
            </View>

            {/* Sign In Button */}
            <Pressable
              onPress={handleSignIn}
              disabled={isLoading}
              className="bg-emerald-500 rounded-2xl py-5 items-center mb-4 shadow-sm"
              style={{ shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
            >
              <Text className="text-white font-bold text-lg">
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </Pressable>

            {/* Demo Button */}
            <Pressable
              onPress={handleDemoLogin}
              disabled={isLoading}
              className="bg-white border-2 border-emerald-500 rounded-2xl py-5 items-center mb-8"
            >
              <Text className="text-emerald-600 font-semibold text-lg">
                Try Demo Account
              </Text>
            </Pressable>

            {/* Divider */}
            <View className="flex-row items-center mb-8">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="px-4 text-gray-500 text-sm">or</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Sign Up Link */}
            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600 text-base">{"Don't have an account? "}</Text>
              <Pressable onPress={onSignUpPress}>
                <Text className="text-emerald-600 font-semibold text-base">Sign Up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={isLoading} message="Signing you in..." />
    </SafeAreaView>
  );
};