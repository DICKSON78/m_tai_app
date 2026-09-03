import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AlertModal from '../../src/components/AlertModal';
import Header from '../../src/components/Header';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import api from '../../src/api/client';
import { COLORS, SPACING, FONTS, RADIUS } from '../../src/constants/theme';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async () => {
    const next: Record<string, string> = {};
    if (!currentPassword) next.current = 'Current password is required';
    if (!newPassword) next.new = 'New password is required';
    else if (newPassword.length < 8) next.new = 'Password must be at least 8 characters';
    if (!confirmPassword) next.confirm = 'Please confirm your new password';
    else if (newPassword !== confirmPassword) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await api.put('/profile/password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      setAlert({ type: 'success', message: 'Your password has been changed successfully.' });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Unable to change password. Please check your current password.';
      setAlert({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const iconColor = COLORS.gray[400];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header title="Change Password" onBack={() => router.replace('/profile')} />
      <ScrollView contentContainerStyle={styles.scroll} bounces={false} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
          <MaterialIcons name="verified-user" size={22} color={COLORS.primaryDark} />
          <Text style={styles.infoText}>
            Choose a strong password that is at least 8 characters and not used elsewhere.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Current Password</Text>
          <Input
            value={currentPassword}
            onChangeText={(t) => {
              setCurrentPassword(t);
              clearError('current');
            }}
            placeholder="Enter your current password"
            secureTextEntry
            error={errors.current}
            icon={<MaterialIcons name="lock-outline" size={20} color={iconColor} />}
            style={styles.field}
          />

          <Text style={styles.label}>New Password</Text>
          <Input
            value={newPassword}
            onChangeText={(t) => {
              setNewPassword(t);
              clearError('new');
            }}
            placeholder="Minimum 8 characters"
            secureTextEntry
            error={errors.new}
            icon={<MaterialIcons name="lock" size={20} color={iconColor} />}
            style={styles.field}
          />

          <Text style={styles.label}>Confirm New Password</Text>
          <Input
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              clearError('confirm');
            }}
            placeholder="Re-enter your new password"
            secureTextEntry
            error={errors.confirm}
            icon={<MaterialIcons name="verified-user" size={20} color={iconColor} />}
            style={styles.field}
          />
        </View>

        <Button
          title="Update Password"
          onPress={handleSubmit}
          loading={submitting}
          size="lg"
          style={styles.submitButton}
        />
      </ScrollView>

      <AlertModal
        visible={alert !== null}
        type={alert?.type === 'success' ? 'success' : 'error'}
        title={alert?.type === 'success' ? 'Password Updated' : 'Error'}
        message={alert?.message ?? ''}
        confirmText="OK"
        onConfirm={() => {
          setAlert(null);
          if (alert?.type === 'success') router.back();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: SPACING.xl },
  infoCard: {
    flexDirection: 'row',
    gap: SPACING.sm + 2,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.teal[50],
    borderRadius: RADIUS.md,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    lineHeight: 20,
  },
  formCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  label: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs + 2,
  },
  field: {
    marginBottom: SPACING.md,
  },
  submitButton: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
});