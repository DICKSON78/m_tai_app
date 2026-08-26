import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
  TextInputProps,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

interface Props {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  icon?: React.ReactNode;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  icon,
  multiline,
  keyboardType,
  autoCapitalize,
  style,
}: Props) {
  const [focused, setFocused] = useState(false);

  const inputProps: TextInputProps = {
    value,
    onChangeText,
    placeholder,
    placeholderTextColor: COLORS.gray[400],
    secureTextEntry,
    multiline,
    keyboardType,
    autoCapitalize,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          focused && !error && styles.fieldFocused,
          error ? styles.fieldError : null,
        ]}
      >
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          {...inputProps}
          style={[styles.input, multiline && styles.inputMultiline]}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm - 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 48,
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm + 4,
    minHeight: 96,
  },
  fieldFocused: {
    borderColor: COLORS.primary,
  },
  fieldError: {
    borderColor: COLORS.error,
  },
  icon: {
    marginRight: SPACING.sm + 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: FONTS.size.md,
    color: COLORS.text,
    paddingVertical: SPACING.sm + 2,
  } as TextStyle,
  inputMultiline: {
    textAlignVertical: 'top',
  },
  error: {
    fontSize: FONTS.size.sm,
    color: COLORS.error,
    marginTop: SPACING.xs + 2,
  },
});
