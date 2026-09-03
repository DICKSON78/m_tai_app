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
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AlertModal from '../../src/components/AlertModal';
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
  const [alertError, setAlertError] = useState<string | null>(null);
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
      setAlertError(message);
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
              icon={<MaterialIcons name="alternate-email" size={20} color={COLORS.gray[400]} />}
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
              icon={<MaterialIcons name="lock-outline" size={20} color={COLORS.gray[400]} />}
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
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }} onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerText}>Create an account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertModal
        visible={alertError !== null}
        type="error"
        title="Login Failed"
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
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: -SPACING.xs,
  },
  forgotText: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
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
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  registerText: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.primary,
  },
});
