import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const HEIGHTS: Record<NonNullable<Props['size']>, number> = { sm: 36, md: 44, lg: 48 };
const RADII = { sm: RADIUS.sm, md: RADIUS.md, lg: RADIUS.md };
const FS = { sm: 12, md: 14, lg: 16 };

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  textStyle,
  icon,
}: Props) {
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const bg = {
    primary: COLORS.primary,
    secondary: COLORS.gray[100],
    outline: 'transparent',
    danger: COLORS.red[500],
    ghost: 'transparent',
  }[variant];

  const textColor = {
    primary: COLORS.white,
    secondary: COLORS.gray[700],
    outline: COLORS.primaryDark,
    danger: COLORS.white,
    ghost: COLORS.primaryDark,
  }[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={{
        backgroundColor: bg,
        height: HEIGHTS[size],
        paddingHorizontal: size === 'sm' ? 14 : 20,
        borderRadius: RADII[size],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: isOutline ? 1 : 0,
        borderColor: isOutline ? COLORS.border : undefined,
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              {
                color: textColor,
                fontSize: FS[size],
                fontFamily: FONTS.semibold,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
