import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

interface CircularDotSpinnerProps {
  size?: number;
  color?: string;
  dotCount?: number;
}

export const CircularDotSpinner: React.FC<CircularDotSpinnerProps> = ({
  size = 24,
  color = '#3B82F6',
  dotCount = 12
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );

    spin.start();

    return () => spin.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const radius = size / 2 - Math.max(3, size * 0.15);
  const dotSize = Math.max(2, size * 0.12);

  const renderDots = () => {
    const dots = [];
    
    for (let i = 0; i < dotCount; i++) {
      const angle = (i * 360) / dotCount;
      const radian = (angle * Math.PI) / 180;
      
      const x = radius * Math.cos(radian);
      const y = radius * Math.sin(radian);
      
      // Create staggered opacity animation for each dot with smoother transitions
      const progress = (i / dotCount);
      const nextProgress = ((i + 1) / dotCount);
      
      const opacity = spinValue.interpolate({
        inputRange: [
          progress,
          nextProgress,
          nextProgress + 0.1 > 1 ? 1 : nextProgress + 0.1,
        ],
        outputRange: [0.2, 1, 0.2],
        extrapolate: 'clamp',
      });

      dots.push(
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
            left: size / 2 + x - dotSize / 2,
            top: size / 2 + y - dotSize / 2,
            opacity,
          }}
        />
      );
    }
    
    return dots;
  };

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [{ rotate: spin }],
        }}
      >
        {renderDots()}
      </Animated.View>
    </View>
  );
};