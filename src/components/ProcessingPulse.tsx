import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface ProcessingPulseProps {
  isProcessing: boolean;
  size?: number;
  color?: string;  
}

export const ProcessingPulse: React.FC<ProcessingPulseProps> = ({
  isProcessing,
  size = 16,
  color = '#10B981',
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    if (isProcessing) {
      scale.value = withRepeat(
        withTiming(1.2, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
      
      opacity.value = withRepeat(
        withTiming(0.3, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(0.7, { duration: 200 });
    }
  }, [isProcessing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          marginRight: 8,
        },
      ]}
    />
  );
};