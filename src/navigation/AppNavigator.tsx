import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../state/authStore';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { TabNavigator } from './TabNavigator';

export const AppNavigator: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { isAuthenticated, hasSeenOnboarding } = useAuthStore();

  // Handle splash screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Handle onboarding for new users
  if (isAuthenticated && !hasSeenOnboarding) {
    return <OnboardingScreen onComplete={() => {}} />;
  }

  // Handle authentication
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Main app
  return <TabNavigator />;
};