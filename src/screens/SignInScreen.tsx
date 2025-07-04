import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
        {/* Header */}
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          className="px-6 py-12 items-center"
        >
          <View className="w-16 h-16 bg-white/20 rounded-2xl items-center justify-center mb-4">
            <Ionicons name="mic" size={32} color="white" />
          </View>
          <Text className="text-white text-2xl font-bold">Welcome Back</Text>
          <Text className="text-white/80 text-center mt-2">
            Sign in to access your meetings and documents
          </Text>
        </LinearGradient>

        {/* Form */}
        <View className="flex-1 px-6 py-8">
          <View className="space-y-4">
            {/* Email Input */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">Email</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  className="flex-1 ml-3 text-gray-900"
                />
              </View>
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">Password</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  className="flex-1 ml-3 text-gray-900"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
              </View>
            </View>

            {/* Sign In Button */}
            <Pressable
              onPress={handleSignIn}
              disabled={isLoading}
              className="bg-blue-500 rounded-lg py-4 items-center mt-6"
            >
              <Text className="text-white font-semibold text-lg">
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </Pressable>

            {/* Demo Button */}
            <Pressable
              onPress={handleDemoLogin}
              disabled={isLoading}
              className="bg-gray-100 rounded-lg py-4 items-center mt-3"
            >
              <Text className="text-gray-700 font-medium">
                Try Demo Account
              </Text>
            </Pressable>
          </View>

          {/* Sign Up Link */}
          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-gray-600">{"Don't have an account? "}</Text>
            <Pressable onPress={onSignUpPress}>
              <Text className="text-blue-500 font-medium">Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={isLoading} message="Signing you in..." />
    </SafeAreaView>
  );
};