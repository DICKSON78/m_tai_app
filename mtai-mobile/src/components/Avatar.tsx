import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

const PALETTE = ['#00D4AA', '#5B8DEF', '#F59E0B', '#EF476F', '#8B5CF6', '#10B981'];

interface Props {
  uri?: string;
  name: string;
  size?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getBackgroundColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export default function Avatar({ uri, name, size = 40 }: Props) {
  const initialsSize = Math.max(10, Math.round(size * 0.38));

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: uri ? COLORS.gray[200] : getBackgroundColor(name),
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: RADIUS.full }}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: initialsSize }]}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
