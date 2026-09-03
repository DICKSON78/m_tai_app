import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../../src/components/Header';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../src/constants/theme';

type Faq = { question: string; answer: string };

const FAQS: Faq[] = [
  {
    question: 'How do I place an order?',
    answer:
      'Browse products in the Shop tab, choose a product, tap “Add to Bag”, then go to your cart and tap “Checkout”. Confirm your details and place the order.',
  },
  {
    question: 'How long does delivery take?',
    answer:
      'Delivery typically takes 24 to 72 hours depending on your location. You can track your order in the Deliveries tab in real time.',
  },
  {
    question: 'What payment methods are accepted?',
    answer:
      'We accept mobile money, card payments, and cash on delivery. Your payment details are encrypted and secure.',
  },
  {
    question: 'Can I cancel or change my order?',
    answer:
      'Orders can be cancelled or modified before they are dispatched. Contact support as soon as possible after placing your order.',
  },
  {
    question: 'How do I return a product?',
    answer:
      'You can request a return within 7 days of delivery. The product must be unused and in its original packaging. Refunds are processed within 5–7 business days.',
  },
  {
    question: 'How do I change my password?',
    answer:
      'Go to Settings → Change Password, enter your current password followed by your new password, and save.',
  },
  {
    question: 'Is my personal information safe?',
    answer:
      'Yes. We encrypt your data and never sell your personal information to third parties. See our Privacy Policy for details.',
  },
];

export default function FaqScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header title="FAQ" onBack={() => router.replace('/profile')} />
      <ScrollView contentContainerStyle={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.group}>
          {FAQS.map((faq, i) => {
            const isOpen = expanded === faq.question;
            const last = i === FAQS.length - 1;
            return (
              <View key={faq.question} style={[styles.item, !last && styles.rowBorder]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.questionRow}
                  onPress={() => setExpanded(isOpen ? null : faq.question)}
                >
                  <Text style={styles.question}>{faq.question}</Text>
                  <MaterialIcons
                    name={isOpen ? 'expand-less' : 'expand-more'}
                    size={22}
                    color={COLORS.gray[400]}
                  />
                </TouchableOpacity>
                {isOpen ? <Text style={styles.answer}>{faq.answer}</Text> : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: SPACING.xl },
  group: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  item: {
    paddingHorizontal: SPACING.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
    paddingVertical: SPACING.md,
  },
  question: {
    flex: 1,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  answer: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    lineHeight: 20,
    paddingBottom: SPACING.md,
  },
});