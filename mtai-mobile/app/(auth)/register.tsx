import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
      Alert.alert('Registration Failed', message);
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
            <View style={[styles.decoCircle, styles.decoCircleLarge]} />
            <View style={[styles.decoCircle, styles.decoCircleSmall]} />
            <Text style={styles.logo}>
              M<Text style={styles.logoAccent}>-</Text>TAI
            </Text>
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
              icon={<MaterialCommunityIcons name="account-outline" size={20} color={iconColor} />}
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
              icon={<MaterialCommunityIcons name="email-outline" size={20} color={iconColor} />}
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
              icon={<MaterialCommunityIcons name="phone-outline" size={20} color={iconColor} />}
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
              icon={<MaterialCommunityIcons name="lock-outline" size={20} color={iconColor} />}
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
              icon={<MaterialCommunityIcons name="lock-check-outline" size={20} color={iconColor} />}
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
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.xl + 8,
    borderBottomRightRadius: RADIUS.xl + 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xl + SPACING.md,
    paddingBottom: SPACING.xl,
    overflow: 'hidden',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryDark,
    opacity: 0.45,
  },
  decoCircleLarge: {
    width: 220,
    height: 220,
    top: -110,
    right: -70,
  },
  decoCircleSmall: {
    width: 140,
    height: 140,
    bottom: -80,
    left: -40,
    opacity: 0.3,
  },
  logo: {
    fontSize: FONTS.size.xxxl,
    fontWeight: '800',
    letterSpacing: 3,
    color: COLORS.white,
  },
  logoAccent: {
    color: COLORS.secondary,
  },
  tagline: {
    fontSize: FONTS.size.md,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: SPACING.sm,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  welcomeTitle: {
    fontSize: FONTS.size.xxl - 2,
    fontWeight: '700',
    color: COLORS.text,
  },
  welcomeSubtitle: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
    marginTop: SPACING.xs + 2,
    marginBottom: SPACING.lg,
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
    color: COLORS.textLight,
  },
  loginText: {
    fontSize: FONTS.size.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
