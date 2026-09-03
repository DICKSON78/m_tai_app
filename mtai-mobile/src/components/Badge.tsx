import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface Props {
  label: string;
  color: string;
  textColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  filled?: boolean;
}

// Tinted status pill (matches Vantage StatusBadge): ~15% alpha bg, same-hue
// darkened text, fully rounded.
export default function Badge({
  label,
  color,
  textColor,
  size = 'md',
  style,
  filled,
}: Props) {
  const resolvedText = textColor ?? color;
  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        { backgroundColor: filled ? color : hexToAlpha(color, 0.15) },
        style,
      ]}
    >
      <Text
        style={[
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: filled ? COLORS.white : resolvedText },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function hexToAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.replace(/./g, (c) => c + c) : clean;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
  },
  badgeSm: {
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeMd: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  textMd: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  textSm: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
  },
});
