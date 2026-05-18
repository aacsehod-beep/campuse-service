import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.skeleton, { width: width as any, height, borderRadius, opacity }, style]}
    />
  );
}

export function FeedSkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.card}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <Skeleton width={44} height={44} borderRadius={14} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="60%" height={14} />
              <Skeleton width="40%" height={12} />
            </View>
            <Skeleton width={64} height={24} borderRadius={12} />
          </View>
          <Skeleton height={13} style={{ marginBottom: 6 }} />
          <Skeleton width="75%" height={13} />
        </View>
      ))}
    </View>
  );
}

export function OrderListSkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.card}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
            <Skeleton width={44} height={44} borderRadius={14} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="50%" height={14} />
              <Skeleton width="30%" height={12} />
            </View>
            <Skeleton width={60} height={20} borderRadius={10} />
          </View>
          <Skeleton height={13} style={{ marginBottom: 6 }} />
          <Skeleton width="65%" height={13} />
        </View>
      ))}
    </View>
  );
}

export function ChatListSkeleton() {
  return (
    <View style={{ padding: 16, gap: 14 }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.card, { flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
          <Skeleton width={46} height={46} borderRadius={23} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="80%" height={12} />
          </View>
          <Skeleton width={40} height={12} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: { backgroundColor: '#d4e8da' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});
