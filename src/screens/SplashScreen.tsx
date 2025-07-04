import React, { useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-finish after 2.5 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#4F46E5', '#7C3AED', '#EC4899']}
      className="flex-1 items-center justify-center"
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className="items-center"
      >
        {/* App Icon */}
        <View className="w-24 h-24 bg-white/20 rounded-3xl items-center justify-center mb-6">
          <Ionicons name="mic" size={48} color="white" />
        </View>

        {/* App Name */}
        <Text className="text-white text-3xl font-bold mb-2">
          MeetingAI
        </Text>
        
        {/* Tagline */}
        <Text className="text-white/80 text-lg text-center px-8">
          Your Intelligent Meeting Assistant
        </Text>

        {/* Loading indicator */}
        <View className="mt-12">
          <Animated.View
            style={{
              opacity: fadeAnim,
            }}
          >
            <Text className="text-white/60 text-sm">
              Initializing...
            </Text>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Bottom branding */}
      <View className="absolute bottom-12">
        <Text className="text-white/40 text-xs">
          Powered by AI • Built with ❤️
        </Text>
      </View>
    </LinearGradient>
  );
};