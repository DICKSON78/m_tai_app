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
import AlertModal from '../../src/components/AlertModal';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { COLORS, SPACING, FONTS, RADIUS } from '../../src/constants/theme';
import api from '../../src/api/client';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setAlert({ type: 'error', message: 'Please enter your email address' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/forgot-password', { email: email.trim() });
      setAlert({
        type: 'success',
        message: 'Check your email for password reset instructions.',
      });
    } catch {
      setAlert({
        type: 'success',
        message: 'If an account exists with that email, you will receive reset instructions.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSent = () => {
    setAlert(null);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>Back to Login</Text>
            </TouchableOpacity>

            <View style={styles.headerSection}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email address and we will send you instructions to reset your password.
              </Text>
            </View>

            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              icon={<Text style={styles.inputIcon}>@</Text>}
            />

            <Button
              title="Send Reset Link"
              onPress={handleSubmit}
              loading={submitting}
              size="lg"
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertModal
        visible={alert !== null}
        type={alert?.type === 'success' ? 'success' : 'error'}
        title={alert?.type === 'success' ? 'Email Sent' : 'Error'}
        message={alert?.message ?? ''}
        confirmText="OK"
        onConfirm={confirmSent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: SPACING.lg, justifyContent: 'center' },
  backButton: { marginBottom: SPACING.xl },
  backText: { color: COLORS.primary, fontSize: FONTS.size.sm, fontFamily: FONTS.semibold },
  headerSection: { marginBottom: SPACING.xl },
  title: {
    fontSize: FONTS.size.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  inputIcon: { fontSize: 16 },
  submitButton: { marginTop: SPACING.lg },
});