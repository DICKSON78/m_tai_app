import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface Props {
  price: number;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  compareAt?: number;
}

const SIZES = {
  sm: { price: FONTS.size.sm, compare: FONTS.size.xs },
  md: { price: FONTS.size.md, compare: FONTS.size.sm },
  lg: { price: FONTS.size.xl, compare: FONTS.size.md },
} as const;

function formatTZS(amount: number): string {
  const rounded = Math.round(amount);
  const withSeparators = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `TZS ${withSeparators}`;
}

export default function PriceTag({ price, size = 'md', style, compareAt }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text
        style={[
          styles.price,
          size === 'lg' && styles.priceLg,
          { fontSize: SIZES[size].price },
        ]}
      >
        {formatTZS(price)}
      </Text>
      {typeof compareAt === 'number' && compareAt > price ? (
        <Text style={[styles.compare, { fontSize: SIZES[size].compare }]}>
          {formatTZS(compareAt)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  priceLg: {
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  compare: {
    color: COLORS.gray[400],
    textDecorationLine: 'line-through',
    marginLeft: 6,
    fontFamily: FONTS.regular,
  },
});
