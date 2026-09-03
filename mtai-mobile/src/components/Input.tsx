import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
  const [passwordVisible, setPasswordVisible] = useState(false);

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
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray[400]}
          secureTextEntry={secureTextEntry && !passwordVisible}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline && styles.inputMultiline]}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setPasswordVisible((prev) => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.eyeButton}
          >
            <MaterialIcons
              name={passwordVisible ? 'visibility-off' : 'visibility'}
              size={22}
              color={COLORS.gray[400]}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs + 2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.sm,
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
  eyeButton: {
    marginLeft: SPACING.sm + 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  input: {
    flex: 1,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    paddingVertical: SPACING.sm + 2,
  } as TextStyle,
  inputMultiline: {
    textAlignVertical: 'top',
  },
  error: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    marginTop: SPACING.xs + 2,
  },
});
