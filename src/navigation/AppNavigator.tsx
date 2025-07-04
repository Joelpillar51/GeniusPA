import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../state/authStore';
import { AuthScreen } from '../screens/AuthScreen';
import { TabNavigator } from './TabNavigator';
import { RecordingDetailScreen } from '../screens/RecordingDetailScreen';
import { DocumentDetailScreen } from '../screens/DocumentDetailScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const LoadingScreen: React.FC = () => (
  <SafeAreaView className="flex-1 bg-white items-center justify-center">
    <ActivityIndicator size="large" color="#10B981" />
    <Text className="text-gray-600 mt-4">Loading GeniusPA...</Text>
  </SafeAreaView>
);

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Give the auth store a moment to initialize from storage
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loading screen while initializing
  if (isInitializing || isLoading) {
    return <LoadingScreen />;
  }

  // Handle authentication flow
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Main app navigation
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen 
        name="RecordingDetail" 
        component={RecordingDetailScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="DocumentDetail" 
        component={DocumentDetailScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};