import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../../src/components/Header';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../src/constants/theme';

type Topic = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  body: string;
};

const TOPICS: Topic[] = [
  {
    icon: 'shopping-bag',
    title: 'Placing an Order',
    body: 'Browse products from the Shop tab, add items to your cart, then tap the cart icon to review and check out. You will receive a confirmation once your order is placed.',
  },
  {
    icon: 'local-shipping',
    title: 'Tracking Deliveries',
    body: 'Go to the Deliveries tab to see live orders in transit. You can view the delivery details including the assigned driver and expected arrival time.',
  },
  {
    icon: 'autorenew',
    title: 'Returns & Refunds',
    body: 'If you are not satisfied with a product, request a return within 7 days of delivery. Refunds are processed to your original payment method within 5–7 business days.',
  },
  {
    icon: 'payments',
    title: 'Payments',
    body: 'We support secure online payments and cash on delivery. Your payment information is encrypted and never shared with third parties.',
  },
  {
    icon: 'verified-user',
    title: 'Account & Security',
    body: 'Keep your password private and change it regularly. Enable push notifications so you never miss an order update.',
  },
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header title="Help Center" onBack={() => router.replace('/profile')} />
      <ScrollView contentContainerStyle={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.searchCard}>
          <MaterialIcons name="search" size={20} color={COLORS.gray[400]} />
          <Text style={styles.searchPlaceholder}>How can we help you today?</Text>
        </View>

        <Text style={styles.sectionTitle}>Popular Topics</Text>
        <View style={styles.group}>
          {TOPICS.map((topic, i) => {
            const isOpen = expanded === topic.title;
            const last = i === TOPICS.length - 1;
            return (
              <View key={topic.title} style={[styles.topicWrap, !last && styles.rowBorder]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.topicHeader}
                  onPress={() => setExpanded(isOpen ? null : topic.title)}
                >
                  <View style={styles.rowIcon}>
                    <MaterialIcons name={topic.icon} size={20} color={COLORS.primaryDark} />
                  </View>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <MaterialIcons
                    name={isOpen ? 'expand-less' : 'expand-more'}
                    size={22}
                    color={COLORS.gray[400]}
                  />
                </TouchableOpacity>
                {isOpen ? (
                  <Text style={styles.topicBody}>{topic.body}</Text>
                ) : null}
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/contact-support')}
          style={styles.ctaCard}
        >
          <View style={styles.ctaIcon}>
            <MaterialIcons name="headset-mic" size={26} color={COLORS.primaryDark} />
          </View>
          <View style={styles.ctaBody}>
            <Text style={styles.ctaTitle}>Still need help?</Text>
            <Text style={styles.ctaSubtitle}>Contact our support team</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={COLORS.gray[400]} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: SPACING.xl },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    height: 48,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  searchPlaceholder: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.gray[400],
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
  group: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  topicWrap: {
    paddingHorizontal: SPACING.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicTitle: {
    flex: 1,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  topicBody: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    lineHeight: 20,
    paddingBottom: SPACING.md,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  ctaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBody: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  ctaSubtitle: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 2,
  },
});