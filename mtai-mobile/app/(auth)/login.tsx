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
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, FONTS, RADIUS } from '../../src/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ login?: string; password?: string }>({});

  const handleLogin = async () => {
    const nextErrors: { login?: string; password?: string } = {};
    if (!loginId.trim()) nextErrors.login = 'Email or phone number is required';
    if (!password) nextErrors.password = 'Password is required';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      await login(loginId.trim(), password);
      router.replace('/');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (err?.response?.status === 401 || err?.response?.status === 422
          ? 'Invalid credentials. Please try again.'
          : 'Unable to connect. Please check your connection and try again.');
      Alert.alert('Login Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

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
            <Text style={styles.welcomeTitle}>Welcome back</Text>
            <Text style={styles.welcomeSubtitle}>
              Sign in to continue shopping and tracking your orders
            </Text>

            <Input
              label="Email or Phone"
              value={loginId}
              onChangeText={(text) => {
                setLoginId(text);
                if (errors.login) setErrors((prev) => ({ ...prev, login: undefined }));
              }}
              placeholder="you@example.com or 07XX XXX XXX"
              keyboardType="email-address"
              error={errors.login}
              icon={<Text style={styles.inputIcon}>✉</Text>}
              style={styles.fieldSpacing}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
              icon={<Text style={styles.inputIcon}>🔒</Text>}
              style={styles.fieldSpacing}
            />

            <TouchableOpacity
              onPress={handleForgotPassword}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={submitting}
              size="lg"
              style={styles.submitButton}
            />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>New to M-TAI? </Text>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }} onPress={() => Alert.alert('Coming Soon', 'Customer registration will be available soon.')}>
                <Text style={styles.registerText}>Create an account</Text>
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
    // Gradient-style layering: darker tone bleeding from the bottom
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
  inputIcon: {
    fontSize: FONTS.size.lg,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: -SPACING.xs,
  },
  forgotText: {
    fontSize: FONTS.size.sm,
    fontWeight: '600',
    color: COLORS.primaryDark,
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
  registerText: {
    fontSize: FONTS.size.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
