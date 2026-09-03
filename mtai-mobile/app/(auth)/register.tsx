import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AlertModal from '../../src/components/AlertModal';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, FONTS, RADIUS } from '../../src/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+255');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleRegister = async () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Full name is required';
    if (!email.trim()) nextErrors.email = 'Email is required';
    if (!phone.trim() || phone.trim() === '+255') nextErrors.phone = 'Phone number is required';
    if (!password) nextErrors.password = 'Password is required';
    else if (password.length < 8) nextErrors.password = 'Password must be at least 8 characters';
    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        password_confirmation: confirmPassword,
      });
      router.replace('/');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (err?.response?.status === 422
          ? 'Validation failed. Please check your input.'
          : 'Unable to connect. Please check your connection and try again.');
      setAlertError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const iconColor = COLORS.gray[400];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Branding */}
          <View style={styles.brandSection}>
            <View style={styles.logoBadge}>
              <MaterialIcons name="storefront" size={30} color={COLORS.primary} />
            </View>
            <View style={styles.logoTextRow}>
              <Text style={styles.logo}>
                M<Text style={styles.logoAccent}>-</Text>TAI
              </Text>
            </View>
            <Text style={styles.tagline}>Marketplace at your fingertips</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.welcomeTitle}>Create Account</Text>
            <Text style={styles.welcomeSubtitle}>
              Sign up to start shopping and tracking your orders
            </Text>

            <Input
              label="Full Name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                clearError('name');
              }}
              placeholder="John Doe"
              error={errors.name}
              icon={<MaterialIcons name="person-outline" size={20} color={iconColor} />}
              style={styles.fieldSpacing}
            />

            <Input
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError('email');
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              error={errors.email}
              icon={<MaterialIcons name="alternate-email" size={20} color={iconColor} />}
              style={styles.fieldSpacing}
            />

            <Input
              label="Phone"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                clearError('phone');
              }}
              placeholder="+255 7XX XXX XXX"
              keyboardType="phone-pad"
              error={errors.phone}
              icon={<MaterialIcons name="phone" size={20} color={iconColor} />}
              style={styles.fieldSpacing}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearError('password');
              }}
              placeholder="Minimum 8 characters"
              secureTextEntry
              error={errors.password}
              icon={<MaterialIcons name="lock" size={20} color={iconColor} />}
              style={styles.fieldSpacing}
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearError('confirmPassword');
              }}
              placeholder="Re-enter your password"
              secureTextEntry
              error={errors.confirmPassword}
              icon={<MaterialIcons name="verified-user" size={20} color={iconColor} />}
              style={styles.fieldSpacing}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={submitting}
              size="lg"
              style={styles.submitButton}
            />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                onPress={() => router.back()}
              >
                <Text style={styles.loginText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertModal
        visible={alertError !== null}
        type="error"
        title="Registration Failed"
        message={alertError ?? ''}
        confirmText="Try Again"
        onConfirm={() => setAlertError(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  brandSection: {
    alignItems: 'center',
    paddingTop: SPACING.xl + SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: FONTS.size.xxl + 4,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
    color: COLORS.text,
  },
  logoAccent: {
    color: COLORS.primary,
  },
  tagline: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: SPACING.xs + 2,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  welcomeTitle: {
    textAlign: 'center',
    fontSize: FONTS.size.xxl - 2,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  welcomeSubtitle: {
    textAlign: 'center',
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: SPACING.xs + 2,
    marginBottom: SPACING.xl,
  },
  fieldSpacing: {
    marginBottom: SPACING.md,
  },
  submitButton: {
    marginTop: SPACING.lg,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  loginText: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.primary,
  },
});
