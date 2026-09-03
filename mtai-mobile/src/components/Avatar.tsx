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
  const safe = (name || '').trim();
  const parts = safe.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getBackgroundColor(name: string): string {
  const safe = name || '';
  let hash = 0;
  for (let i = 0; i < safe.length; i++) {
    hash = (hash * 31 + safe.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export default function Avatar({ uri, name = '', size = 40 }: Props) {
  const initialsSize = Math.max(12, Math.round(size * 0.4));
  const bg = uri ? COLORS.gray[200] : getBackgroundColor(name);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            { fontSize: initialsSize, color: getContrast(bg) },
          ]}
        >
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}

function getContrast(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.replace(/./g, (c) => c + c) : clean;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 150 ? '#0F172A' : '#FFFFFF';
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontFamily: FONTS.semibold,
    letterSpacing: 0.5,
  },
});
