import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import Button from './Button';

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

const ICONS: Record<string, { name: keyof typeof MaterialIcons.glyphMap; bg: string; color: string }> = {
  success: { name: 'check-circle', bg: COLORS.green[100], color: COLORS.primaryDark },
  error: { name: 'error', bg: COLORS.red[100], color: COLORS.red[700] },
  warning: { name: 'warning', bg: '#FFF4E5', color: COLORS.warning },
  info: { name: 'info', bg: COLORS.teal[50], color: COLORS.primaryDark },
};

export default function AlertModal({
  visible,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
  onClose = () => {},
}: AlertModalProps) {
  const icon = ICONS[type] ?? ICONS.info;
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };
  const close = onCancel ?? onClose;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={close} />
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
            <MaterialIcons name={icon.name} size={34} color={icon.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            {cancelText && onCancel ? (
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.8}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            ) : null}
            <Button title={confirmText} onPress={handleConfirm} size="lg" style={styles.confirmButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  backdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.size.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  message: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  cancelButton: {
    height: 48,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  cancelText: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  confirmButton: {
    flex: 1,
  },
});