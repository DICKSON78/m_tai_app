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
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, FONTS, RADIUS } from '../../src/constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSave = async () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Full name is required';
    if (!email.trim()) next.email = 'Email is required';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await api.put('/profile', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      await refreshUser();
      setAlert({ type: 'success', message: 'Your profile has been updated.' });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Unable to save changes. Please try again.';
      setAlert({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const iconColor = COLORS.gray[400];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header title="Edit Profile" onBack={() => router.replace('/profile')} />
      <ScrollView contentContainerStyle={styles.scroll} bounces={false} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {(name.trim().charAt(0) || 'U').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.avatarHint}>Your photo appears across the app</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Full Name</Text>
          <Input
            value={name}
            onChangeText={(t) => {
              setName(t);
              clearError('name');
            }}
            placeholder="John Doe"
            error={errors.name}
            icon={<MaterialIcons name="person-outline" size={20} color={iconColor} />}
            style={styles.field}
          />

          <Text style={styles.label}>Email</Text>
          <Input
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              clearError('email');
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            error={errors.email}
            icon={<MaterialIcons name="alternate-email" size={20} color={iconColor} />}
            style={styles.field}
          />

          <Text style={styles.label}>Phone</Text>
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder="+255 7XX XXX XXX"
            keyboardType="phone-pad"
            icon={<MaterialIcons name="phone" size={20} color={iconColor} />}
            style={styles.field}
          />
        </View>

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={submitting}
          size="lg"
          style={styles.saveButton}
        />
      </ScrollView>

      <AlertModal
        visible={alert !== null}
        type={alert?.type === 'success' ? 'success' : 'error'}
        title={alert?.type === 'success' ? 'Profile Updated' : 'Error'}
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: FONTS.size.xxxl,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  avatarHint: {
    marginTop: SPACING.sm,
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  formCard: {
    marginHorizontal: SPACING.lg,
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
  saveButton: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
});