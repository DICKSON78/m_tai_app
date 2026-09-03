import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS } from '../constants/theme';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>
        M<Text style={{ color: COLORS.primary }}>-</Text>TAI
      </Text>
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={styles.spinner}
      />
      <Text style={styles.tagline}>Loading your experience…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  brand: {
    fontSize: FONTS.size.xxl + 6,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
    color: COLORS.text,
  },
  spinner: {
    marginTop: SPACING.xl,
  },
  tagline: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: SPACING.md,
  },
});
