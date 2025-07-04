import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

interface TypingIndicatorProps {
  isVisible: boolean;
  color?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible,
  color = '#9CA3AF'
}) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      const animateDot = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 600,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animations = [
        animateDot(dot1, 0),
        animateDot(dot2, 200),
        animateDot(dot3, 400),
      ];

      animations.forEach(animation => animation.start());

      return () => {
        animations.forEach(animation => animation.stop());
      };
    } else {
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    }
  }, [isVisible, dot1, dot2, dot3]);

  if (!isVisible) return null;

  return (
    <View className="flex-row items-center justify-center">
      {[dot1, dot2, dot3].map((dot, index) => (
        <Animated.View
          key={index}
          className="w-2 h-2 rounded-full mx-1"
          style={{
            backgroundColor: color,
            opacity: dot.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
            transform: [
              {
                scale: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
};