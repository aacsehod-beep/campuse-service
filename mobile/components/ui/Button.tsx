import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const containerStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={containerStyle}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.text, styles[`text_${variant}`], textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: { marginRight: 2 },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.55 },

  // Variants
  primary: {
    backgroundColor: '#0c8a57',
    shadowColor: '#0c8a57',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondary: {
    backgroundColor: '#e6f4ec',
    borderWidth: 1,
    borderColor: '#d4e8da',
  },
  danger: {
    backgroundColor: '#dc2626',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0c8a57',
  },

  // Sizes
  sm: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  md: { paddingHorizontal: 20, paddingVertical: 13 },
  lg: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 20 },

  // Text
  text: { fontSize: 14, fontWeight: '700' },
  text_primary: { color: '#ffffff' },
  text_secondary: { color: '#182a1e' },
  text_danger: { color: '#ffffff' },
  text_ghost: { color: '#0c8a57' },
});
