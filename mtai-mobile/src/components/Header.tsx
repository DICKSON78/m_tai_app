import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function Header({ title, subtitle, onBack, rightAction }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.side, styles.left]}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              style={styles.backButton}
              hitSlop={{
                top: SPACING.sm + 4,
                bottom: SPACING.sm + 4,
                left: SPACING.sm + 4,
                right: SPACING.sm + 4,
              }}
            >
              <View style={styles.chevron}>
                <View
                  style={[
                    styles.chevronBar,
                    styles.chevronTop,
                    { backgroundColor: COLORS.text },
                  ]}
                />
                <View
                  style={[
                    styles.chevronBar,
                    styles.chevronBottom,
                    { backgroundColor: COLORS.text },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={[styles.side, styles.right]}>{rightAction ?? null}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  side: {
    minWidth: 40,
  },
  left: {
    alignItems: 'flex-start',
  },
  right: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    width: 16,
    height: 16,
    justifyContent: 'center',
  },
  chevronBar: {
    position: 'absolute',
    width: 11,
    height: 2.5,
    borderRadius: 2,
    left: 3,
  },
  chevronTop: {
    top: 4,
    transform: [{ rotate: '-45deg' }],
  },
  chevronBottom: {
    bottom: 4,
    transform: [{ rotate: '45deg' }],
  },
  title: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
