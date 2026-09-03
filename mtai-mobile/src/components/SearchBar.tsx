import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, RADIUS, FONTS } from '../constants/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  onSubmitEditing?: () => void;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  style,
  onSubmitEditing,
}: Props) {
  return (
    <View style={[styles.container, style]}>
      <MaterialIcons name="search" size={20} color={COLORS.gray[400]} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray[400]}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    paddingVertical: 10,
  },
});
