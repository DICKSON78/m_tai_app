import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

interface Props {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  actionTitle,
  onAction,
  style,
}: Props) {
  const showAction = Boolean(actionTitle && onAction);

  return (
    <View style={[styles.container, style]}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {showAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.8}
          style={styles.action}
        >
          <Text style={styles.actionText}>{actionTitle}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs + 2,
    lineHeight: 20,
  },
  action: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg + 4,
  },
  actionText: {
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.white,
  },
});
