import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../../src/components/Header';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../src/constants/theme';

const FEATURES: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }[] = [
  { icon: 'storefront', label: 'Wide Marketplace', value: 'Connect with trusted local businesses' },
  { icon: 'local-shipping', label: 'Fast Delivery', value: 'Track your orders in real time' },
  { icon: 'verified-user', label: 'Secure Payments', value: 'Encrypted and protected transactions' },
  { icon: 'support-agent', label: '24/7 Support', value: 'We are always here to help' },
];

export default function AboutScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header title="About M-TAI" onBack={() => router.replace('/profile')} />
      <ScrollView contentContainerStyle={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.logoBadge}>
            <MaterialIcons name="storefront" size={34} color={COLORS.primary} />
          </View>
          <Text style={styles.logo}>
            M<Text style={styles.logoAccent}>-</Text>TAI
          </Text>
          <Text style={styles.tagline}>Marketplace at your fingertips</Text>
        </View>

        <Text style={styles.sectionTitle}>Our Mission</Text>
        <View style={styles.missionCard}>
          <Text style={styles.missionText}>
            M-TAI connects local businesses with customers, making it fast and easy to discover,
            order, and receive quality products — all from the palm of your hand.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Why M-TAI</Text>
        <View style={styles.group}>
          {FEATURES.map((f, i) => {
            const last = i === FEATURES.length - 1;
            return (
              <View key={f.label} style={[styles.featureRow, !last && styles.rowBorder]}>
                <View style={styles.featureIcon}>
                  <MaterialIcons name={f.icon} size={20} color={COLORS.primaryDark} />
                </View>
                <View style={styles.featureBody}>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                  <Text style={styles.featureValue}>{f.value}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Version</Text>
        <View style={styles.versionCard}>
          <Text style={styles.versionText}>M-TAI v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: SPACING.xl },
  hero: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    marginTop: SPACING.md,
    fontSize: FONTS.size.xxl + 4,
    fontFamily: FONTS.bold,
    letterSpacing: 2,
    color: COLORS.text,
  },
  logoAccent: {
    color: COLORS.primary,
  },
  tagline: {
    marginTop: SPACING.xs + 2,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  sectionTitle: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.bold,
    color: COLORS.textLight,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  missionCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  missionText: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    lineHeight: 22,
  },
  group: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: {
    flex: 1,
  },
  featureLabel: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  featureValue: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 2,
  },
  versionCard: {
    marginHorizontal: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    ...SHADOWS.sm,
  },
  versionText: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
});