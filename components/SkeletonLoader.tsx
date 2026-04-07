import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';

export type SkeletonType = 'card' | 'list-item' | 'stat-row' | 'chart' | 'macro-bar' | 'circle';

interface SkeletonLoaderProps {
  type: SkeletonType;
  style?: ViewStyle | any;
}

export function SkeletonLoader({ type, style }: SkeletonLoaderProps) {
  const { theme } = useAppTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  const getStyleForType = (): ViewStyle => {
    switch (type) {
      case 'card':
        return { width: '100%', height: 120, borderRadius: 12 };
      case 'list-item':
        return { width: '100%', height: 60, borderRadius: 8 };
      case 'stat-row':
        return { width: '100%', height: 40, borderRadius: 6 };
      case 'chart':
        return { width: '100%', height: 220, borderRadius: 16 };
      case 'macro-bar':
        return { width: '100%', height: 24, borderRadius: 12 };
      case 'circle':
        return { width: 150, height: 150, borderRadius: 75 };
      default:
        return { width: '100%', height: 100 };
    }
  };

  return (
    <Animated.View
      style={[
        getStyleForType(),
        { backgroundColor: theme.cardBackground },
        { opacity },
        style,
      ]}
    />
  );
}
