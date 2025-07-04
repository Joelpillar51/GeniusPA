import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface CircularWavesProps {
  isRecording: boolean;
  size?: number;
  color?: string;
}

export const CircularWaves: React.FC<CircularWavesProps> = ({
  isRecording,
  size = 120,
  color = '#EF4444',
}) => {
  const scale1 = useSharedValue(0);
  const opacity1 = useSharedValue(1);
  const scale2 = useSharedValue(0);
  const opacity2 = useSharedValue(1);
  const scale3 = useSharedValue(0);
  const opacity3 = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      // First wave
      scale1.value = withRepeat(
        withTiming(1, {
          duration: 2000,
          easing: Easing.out(Easing.ease),
        }),
        -1,
        false
      );
      
      opacity1.value = withRepeat(
        withTiming(0, {
          duration: 2000,
          easing: Easing.out(Easing.ease),
        }),
        -1,
        false
      );

      // Second wave (delayed)
      scale2.value = withDelay(
        600,
        withRepeat(
          withTiming(1, {
            duration: 2000,
            easing: Easing.out(Easing.ease),
          }),
          -1,
          false
        )
      );
      
      opacity2.value = withDelay(
        600,
        withRepeat(
          withTiming(0, {
            duration: 2000,
            easing: Easing.out(Easing.ease),
          }),
          -1,
          false
        )
      );

      // Third wave (more delayed)
      scale3.value = withDelay(
        1200,
        withRepeat(
          withTiming(1, {
            duration: 2000,
            easing: Easing.out(Easing.ease),
          }),
          -1,
          false
        )
      );
      
      opacity3.value = withDelay(
        1200,
        withRepeat(
          withTiming(0, {
            duration: 2000,
            easing: Easing.out(Easing.ease),
          }),
          -1,
          false
        )
      );
    } else {
      // Reset all waves
      scale1.value = withTiming(0, { duration: 300 });
      opacity1.value = withTiming(1, { duration: 300 });
      scale2.value = withTiming(0, { duration: 300 });
      opacity2.value = withTiming(1, { duration: 300 });
      scale3.value = withTiming(0, { duration: 300 });
      opacity3.value = withTiming(1, { duration: 300 });
    }
  }, [isRecording]);

  const wave1Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  const wave3Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: opacity3.value,
  }));

  if (!isRecording) {
    return null;
  }

  const waveStyle = {
    position: 'absolute' as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: color,
  };

  return (
    <View 
      style={{
        position: 'absolute',
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        top: -((size - 80) / 2),
        left: -((size - 80) / 2),
      }}
    >
      <Animated.View style={[waveStyle, wave1Style]} />
      <Animated.View style={[waveStyle, wave2Style]} />
      <Animated.View style={[waveStyle, wave3Style]} />
    </View>
  );
};