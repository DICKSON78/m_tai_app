import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function Button({
  title, onPress, variant = 'primary', size = 'md', loading, disabled, style, textStyle, icon,
}: Props) {
  const bg = {
    primary: COLORS.primary,
    secondary: COLORS.gray[100],
    outline: 'transparent',
    danger: COLORS.red[500],
  }[variant];

  const textColor = {
    primary: COLORS.white,
    secondary: COLORS.gray[700],
    outline: COLORS.primary,
    danger: COLORS.white,
  }[variant];

  const py = { sm: 8, md: 12, lg: 16 }[size];
  const px = { sm: 12, md: 16, lg: 20 }[size];
  const fs = { sm: 12, md: 14, lg: 16 }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={{
        backgroundColor: bg,
        paddingVertical: py,
        paddingHorizontal: px,
        borderRadius: RADIUS.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        borderWidth: variant === 'outline' ? 1.5 : 0,
        borderColor: COLORS.primary,
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={{ color: textColor, fontSize: fs, fontWeight: '600' }}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
