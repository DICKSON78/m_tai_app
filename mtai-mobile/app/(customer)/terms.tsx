import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../src/components/Header';
import { COLORS, SPACING, FONTS, RADIUS } from '../../src/constants/theme';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account or using the M-TAI application, you agree to these Terms & Conditions and any additional policies referenced within them.',
  },
  {
    title: '2. Account Responsibilities',
    body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorised use.',
  },
  {
    title: '3. Orders & Payments',
    body: 'All prices are subject to change. We reserve the right to cancel any order due to pricing errors, stock unavailability, or suspected fraudulent activity. Payments are collected securely at checkout.',
  },
  {
    title: '4. Delivery & Returns',
    body: 'Delivery times are estimates and may vary. Products can be returned within 7 days of delivery if unused and in original packaging, subject to our return policy.',
  },
  {
    title: '5. User Conduct',
    body: 'You agree not to misuse the platform, submit false information, engage in fraudulent activity, or attempt to disrupt the operation of the service.',
  },
  {
    title: '6. Intellectual Property',
    body: 'All content, branding, and materials within the app are the property of M-TAI. You may not reproduce or distribute them without prior written consent.',
  },
  {
    title: '7. Limitation of Liability',
    body: 'To the fullest extent permitted by law, M-TAI shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.',
  },
  {
    title: '8. Governing Law',
    body: 'These terms are governed by the laws of the United Republic of Tanzania. Any disputes shall be resolved through the appropriate courts of Tanzania.',
  },
];

export default function TermsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header title="Terms & Conditions" onBack={() => router.replace('/profile')} />
      <ScrollView contentContainerStyle={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: August 2026</Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.card}>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: SPACING.xl },
  updated: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  card: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  body: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    lineHeight: 20,
  },
});