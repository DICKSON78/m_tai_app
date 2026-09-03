import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AlertModal from '../../src/components/AlertModal';
import Header from '../../src/components/Header';
import Button from '../../src/components/Button';
import api from '../../src/api/client';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [typed, setTyped] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const canDelete = typed.toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    setConfirming(false);
    setSubmitting(true);
    try {
      await api.delete('/profile');
      await logout();
      setAlert({ type: 'success', message: 'Your account has been deleted. We are sorry to see you go.' });
      setTimeout(() => router.replace('/(auth)/login'), 800);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setAlert({ type: 'error', message: 'Account deletion is not available online yet. Please contact support at support@m-tai.app to delete your account.' });
      } else {
        setAlert({ type: 'error', message: err?.response?.data?.message || 'Unable to delete your account. Please contact support.' });
      }
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header title="Delete Account" onBack={() => router.replace('/profile')} />
      <ScrollView contentContainerStyle={styles.scroll} bounces={false} keyboardShouldPersistTaps="handled">
        <View style={styles.warningCard}>
          <MaterialIcons name="warning" size={26} color={COLORS.red[500]} />
          <Text style={styles.warningTitle}>This action cannot be undone.</Text>
          <Text style={styles.warningBody}>
            Deleting your account will permanently remove your profile, orders history, wishlist, and saved delivery addresses. You will no longer be able to use M-TAI with this account.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Type DELETE to confirm</Text>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            placeholder="Type DELETE"
            placeholderTextColor={COLORS.gray[400]}
            autoCapitalize="characters"
            style={styles.input}
          />
          <Button
            title="Permanently Delete Account"
            variant={canDelete ? 'danger' : undefined}
            onPress={() => canDelete && setConfirming(true)}
            disabled={!canDelete || submitting}
            loading={submitting}
            size="lg"
            style={styles.deleteButton}
          />
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()} style={styles.cancelWrap}>
            <Text style={styles.cancelText}>Keep my account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AlertModal
        visible={confirming}
        type="error"
        title="Delete Account"
        message="This will permanently delete your M-TAI account and all associated data. This cannot be undone. Continue?"
        confirmText="Delete Forever"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
      <AlertModal
        visible={alert !== null}
        type={alert?.type === 'success' ? 'success' : 'error'}
        title={alert?.type === 'success' ? 'Account Deleted' : 'Error'}
        message={alert?.message ?? ''}
        confirmText="OK"
        onConfirm={() => setAlert(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: SPACING.xl },
  warningCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.red[50],
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  warningTitle: {
    marginTop: SPACING.sm,
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.red[700],
    textAlign: 'center',
  },
  warningBody: {
    marginTop: SPACING.sm,
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  label: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs + 2,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  deleteButton: {
    marginTop: SPACING.lg,
  },
  cancelWrap: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.primaryDark,
  },
});