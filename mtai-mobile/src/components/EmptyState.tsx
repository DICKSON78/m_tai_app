import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import Button from './Button';

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
        <Button
          title={actionTitle ?? ''}
          onPress={onAction as () => void}
          size="md"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  action: {
    marginTop: SPACING.lg,
  },
});
