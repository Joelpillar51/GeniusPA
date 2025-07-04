import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface RecordingIndicatorProps {
  isRecording: boolean;
  size?: number;
  color?: string;
}

export const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({
  isRecording,
  size = 80,
  color = '#EF4444',
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    if (isRecording) {
      // Pulsing animation
      scale.value = withRepeat(
        withTiming(1.15, {
          duration: 800,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
      
      opacity.value = withRepeat(
        withTiming(0.4, {
          duration: 800,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(0.8, { duration: 200 });
    }
  }, [isRecording]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!isRecording) {
    return null;
  }

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${color}20`,
          position: 'absolute',
          top: -((size - 80) / 2), // Center around the button
          left: -((size - 80) / 2),
        },
      ]}
    />
  );
};