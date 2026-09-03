import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../src/components/Header';
import { COLORS, SPACING, FONTS, RADIUS } from '../../src/constants/theme';

const SECTIONS = [
  {
    icon: 'lock',
    title: '1. Information We Collect',
    body: 'We collect information you provide when creating an account, such as your name, email, phone number, and delivery address. We also collect order history and payment details necessary to process your purchases.',
  },
  {
    icon: 'verified-user',
    title: '2. How We Use Your Data',
    body: 'Your information is used to process orders, deliver products, provide customer support, send order updates, and improve our services. We never sell your personal data to third parties.',
  },
  {
    icon: 'shield',
    title: '3. Data Security',
    body: 'We use industry-standard encryption (SSL/TLS) to protect your data in transit. Payment information is tokenised and stored securely. Access to personal data is restricted to authorised staff only.',
  },
  {
    icon: 'share',
    title: '4. Sharing of Information',
    body: 'We share your data only with trusted partners who help us operate the platform (such as delivery partners and payment processors), and only to the extent required to provide our services.',
  },
  {
    icon: 'settings',
    title: '5. Your Rights',
    body: 'You may access, correct, or delete your personal information at any time. You can update your profile in Settings, or contact support to request the deletion of your data.',
  },
  {
    icon: 'cookie',
    title: '6. Cookies',
    body: 'Our app uses local storage to keep you signed in and remember your preferences. You can clear this data through your device settings at any time.',
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header title="Privacy Policy" onBack={() => router.replace('/profile')} />
      <ScrollView contentContainerStyle={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          This Privacy Policy explains how M-TAI collects, uses, and protects your personal information. By using the app, you agree to the practices described below.
        </Text>
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
  intro: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    lineHeight: 22,
  },
  updated: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs + 2,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
    marginBottom: SPACING.sm,
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