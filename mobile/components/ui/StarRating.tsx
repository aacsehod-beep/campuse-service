import React, { useRef } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface StarRatingProps {
  rating: number;
  onRate: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

export function StarRating({ rating, onRate, size = 36, readonly = false }: StarRatingProps) {
  const scales = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;

  const handlePress = (star: number) => {
    if (readonly) return;
    onRate(star);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.sequence([
      Animated.spring(scales[star - 1], {
        toValue: 1.45,
        useNativeDriver: true,
        tension: 300,
        friction: 5,
      }),
      Animated.spring(scales[star - 1], {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 5,
      }),
    ]).start();
  };

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((s) => (
        <TouchableOpacity
          key={s}
          onPress={() => handlePress(s)}
          activeOpacity={readonly ? 1 : 0.7}
          disabled={readonly}
        >
          <Animated.Text
            style={[
              styles.star,
              { fontSize: size, transform: [{ scale: scales[s - 1] }] },
              s <= rating && styles.starFilled,
            ]}
          >
            ★
          </Animated.Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  star: { color: '#d4e8da' },
  starFilled: { color: '#fbbf24' },
});
