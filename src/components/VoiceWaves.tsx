import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface VoiceWavesProps {
  isRecording: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const VoiceWaves: React.FC<VoiceWavesProps> = ({
  isRecording,
  size = 'medium',
  color = '#10B981',
}) => {
  // Create shared values for each wave bar
  const wave1 = useSharedValue(0.3);
  const wave2 = useSharedValue(0.5);
  const wave3 = useSharedValue(0.8);
  const wave4 = useSharedValue(0.4);
  const wave5 = useSharedValue(0.6);

  // Get dimensions based on size
  const getDimensions = () => {
    switch (size) {
      case 'small':
        return { width: 3, maxHeight: 20, spacing: 4 };
      case 'large':
        return { width: 6, maxHeight: 40, spacing: 8 };
      default:
        return { width: 4, maxHeight: 30, spacing: 6 };
    }
  };

  const { width, maxHeight, spacing } = getDimensions();

  useEffect(() => {
    if (isRecording) {
      // Start animations with different timings for each wave
      wave1.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 350, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      wave2.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 450, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.7, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      wave3.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 350, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 300, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      wave4.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 350, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 450, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      wave5.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 320, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.7, { duration: 380, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: 420, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      // Stop animations and return to base state
      wave1.value = withTiming(0.3, { duration: 200 });
      wave2.value = withTiming(0.5, { duration: 200 });
      wave3.value = withTiming(0.8, { duration: 200 });
      wave4.value = withTiming(0.4, { duration: 200 });
      wave5.value = withTiming(0.6, { duration: 200 });
    }
  }, [isRecording]);

  // Animated styles for each wave
  const wave1Style = useAnimatedStyle(() => ({
    height: wave1.value * maxHeight,
    backgroundColor: color,
  }));

  const wave2Style = useAnimatedStyle(() => ({
    height: wave2.value * maxHeight,
    backgroundColor: color,
  }));

  const wave3Style = useAnimatedStyle(() => ({
    height: wave3.value * maxHeight,
    backgroundColor: color,
  }));

  const wave4Style = useAnimatedStyle(() => ({
    height: wave4.value * maxHeight,
    backgroundColor: color,
  }));

  const wave5Style = useAnimatedStyle(() => ({
    height: wave5.value * maxHeight,
    backgroundColor: color,
  }));

  if (!isRecording) {
    return null;
  }

  return (
    <View className="flex-row items-center justify-center">
      <Animated.View
        style={[
          wave1Style,
          {
            width,
            borderRadius: width / 2,
            marginHorizontal: spacing / 2,
          },
        ]}
      />
      <Animated.View
        style={[
          wave2Style,
          {
            width,
            borderRadius: width / 2,
            marginHorizontal: spacing / 2,
          },
        ]}
      />
      <Animated.View
        style={[
          wave3Style,
          {
            width,
            borderRadius: width / 2,
            marginHorizontal: spacing / 2,
          },
        ]}
      />
      <Animated.View
        style={[
          wave4Style,
          {
            width,
            borderRadius: width / 2,
            marginHorizontal: spacing / 2,
          },
        ]}
      />
      <Animated.View
        style={[
          wave5Style,
          {
            width,
            borderRadius: width / 2,
            marginHorizontal: spacing / 2,
          },
        ]}
      />
    </View>
  );
};