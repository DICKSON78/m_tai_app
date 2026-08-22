import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  style,
}: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.icon}>
        <View style={styles.lens} />
        <View style={styles.handle} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray[400]}
        returnKeyType="search"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  icon: {
    width: 18,
    height: 18,
    marginRight: SPACING.sm + 2,
  },
  lens: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    borderRadius: 6,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  handle: {
    width: 2,
    height: 6,
    backgroundColor: COLORS.gray[400],
    borderRadius: 1,
    position: 'absolute',
    bottom: 1,
    right: 3,
    transform: [{ rotate: '-45deg' }],
  },
  input: {
    flex: 1,
    fontSize: FONTS.size.md,
    color: COLORS.text,
    paddingVertical: SPACING.sm + 2,
  },
});
