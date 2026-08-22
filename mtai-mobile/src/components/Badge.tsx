import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

interface Props {
  label: string;
  color: string;
  textColor?: string;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export default function Badge({
  label,
  color,
  textColor = COLORS.white,
  size = 'md',
  style,
}: Props) {
  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        { backgroundColor: color },
        style,
      ]}
    >
      <Text
        style={[
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: textColor },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
  },
  badgeSm: {
    paddingVertical: SPACING.xs - 1,
    paddingHorizontal: SPACING.sm + 2,
  },
  badgeMd: {
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm + 4,
  },
  textMd: {
    fontSize: FONTS.size.md,
    fontWeight: '600',
  },
  textSm: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
  },
});
