import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { LoadingOverlay } from '../components/LoadingOverlay';

interface SignUpScreenProps {
  onSignInPress: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSignInPress }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp, isLoading } = useAuthStore();

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await signUp({ 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        password 
      });
    } catch (error) {
      Alert.alert('Sign Up Failed', 'An error occurred during sign up. Please try again.');
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
          <View className="px-8 pt-12 pb-8 items-center">
            {/* App Icon */}
            <View className="w-24 h-24 bg-emerald-100 rounded-3xl items-center justify-center mb-8">
              <View className="w-16 h-16 bg-emerald-500 rounded-2xl items-center justify-center">
                <Ionicons name="person-add" size={28} color="white" />
              </View>
            </View>

            {/* Welcome Text */}
            <Text className="text-3xl font-bold text-gray-900 mb-3">
              Create Account
            </Text>
            <Text className="text-gray-600 text-center text-lg leading-relaxed">
              Join Meeting Assistant to start{'\n'}recording and analyzing meetings
            </Text>
          </View>

          {/* Form */}
          <View className="px-8 pb-8">
            {/* Name Input */}
            <View className="mb-6">
              <Text className="text-gray-800 font-semibold mb-3 text-base">Full Name</Text>
              <View className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 flex-row items-center">
                <Ionicons name="person-outline" size={22} color="#10B981" />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  autoComplete="name"
                  className="flex-1 ml-4 text-gray-900 text-base"
                />
              </View>
            </View>

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
            <View className="mb-6">
              <Text className="text-gray-800 font-semibold mb-3 text-base">Password</Text>
              <View className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 flex-row items-center">
                <Ionicons name="lock-closed-outline" size={22} color="#10B981" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
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
              <Text className="text-gray-500 text-sm mt-2 ml-1">
                Must be at least 6 characters
              </Text>
            </View>

            {/* Confirm Password Input */}
            <View className="mb-8">
              <Text className="text-gray-800 font-semibold mb-3 text-base">Confirm Password</Text>
              <View className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 flex-row items-center">
                <Ionicons name="lock-closed-outline" size={22} color="#10B981" />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                  className="flex-1 ml-4 text-gray-900 text-base"
                />
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-1">
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
            </View>

            {/* Sign Up Button */}
            <Pressable
              onPress={handleSignUp}
              disabled={isLoading}
              className="bg-emerald-500 rounded-2xl py-5 items-center mb-6 shadow-sm"
              style={{ shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
            >
              <Text className="text-white font-bold text-lg">
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </Pressable>

            {/* Terms and Privacy */}
            <View className="bg-emerald-50 rounded-2xl p-4 mb-6">
              <View className="flex-row items-start">
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                <Text className="text-emerald-800 text-sm ml-3 leading-relaxed">
                  By creating an account, you agree to our Terms of Service and Privacy Policy. Your data is encrypted and stored securely.
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="px-4 text-gray-500 text-sm">or</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Sign In Link */}
            <View className="flex-row justify-center items-center pb-8">
              <Text className="text-gray-600 text-base">Already have an account? </Text>
              <Pressable onPress={onSignInPress}>
                <Text className="text-emerald-600 font-semibold text-base">Sign In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={isLoading} message="Creating your account..." />
    </SafeAreaView>
  );
};