import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AlertModal from '../../src/components/AlertModal';
import Header from '../../src/components/Header';
import Button from '../../src/components/Button';
import api from '../../src/api/client';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function ContactSupportScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setAlert({ type: 'error', message: 'Please describe your issue.' });
      return;
    }
    try {
      await api.post('/support-tickets', {
        subject: subject.trim() || 'General Inquiry',
        message: message.trim(),
      });
      setAlert({ type: 'success', message: 'Your request has been sent. We will reply within 24 hours.' });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setAlert({ type: 'error', message: 'Message sending is not available yet. Please email us at support@m-tai.app.' });
      } else {
        setAlert({ type: 'error', message: 'Unable to send your request right now. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@m-tai.app').catch(() =>
      setAlert({ type: 'error', message: 'Open your email app and write to support@m-tai.app' }),
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header title="Contact Support" onBack={() => router.replace('/profile')} />
      <ScrollView contentContainerStyle={styles.scroll} bounces={false} keyboardShouldPersistTaps="handled">
        <View style={styles.quickRow}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleEmail} style={styles.quickCard}>
            <MaterialIcons name="email" size={22} color={COLORS.primaryDark} />
            <Text style={styles.quickLabel}>Email</Text>
            <Text style={styles.quickValue}>support@m-tai.app</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={handleEmail} style={styles.quickCard}>
            <MaterialIcons name="phone" size={22} color={COLORS.primaryDark} />
            <Text style={styles.quickLabel}>Call</Text>
            <Text style={styles.quickValue}>+255 700 000 000</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Send us a message</Text>
        <View style={styles.formCard}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g. Order tracking issue"
            placeholderTextColor={COLORS.gray[400]}
            style={styles.subjectInput}
          />
          <Text style={styles.label}>Message</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Describe your issue in detail…"
            placeholderTextColor={COLORS.gray[400]}
            multiline
            style={[styles.subjectInput, styles.messageInput]}
          />
          <Button
            title="Send Message"
            onPress={handleSubmit}
            loading={submitting}
            size="lg"
            style={styles.sendButton}
          />
        </View>

        <Text style={styles.note}>
          Support hours: Monday – Friday, 8:00 AM – 6:00 PM (EAT). We aim to reply within 24 hours.
        </Text>
      </ScrollView>

      <AlertModal
        visible={alert !== null}
        type={alert?.type === 'success' ? 'success' : 'error'}
        title={alert?.type === 'success' ? 'Message Sent' : 'Error'}
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
  quickRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  quickCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    ...SHADOWS.sm,
  },
  quickLabel: {
    marginTop: SPACING.sm,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  quickValue: {
    marginTop: 2,
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.bold,
    color: COLORS.textLight,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  formCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  label: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs + 2,
  },
  subjectInput: {
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
  messageInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    marginTop: SPACING.lg,
  },
  note: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    lineHeight: 18,
  },
});