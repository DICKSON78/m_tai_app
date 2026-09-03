import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

// White card, 12px radius, subtle shadow (matches Vantage light CardTheme).
export default function Card({ children, style, onPress }: Props) {
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: RADIUS.md - 4,
    ...SHADOWS.sm,
  },
});
