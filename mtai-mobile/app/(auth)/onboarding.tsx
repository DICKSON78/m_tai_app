import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/Button';
import { COLORS, SPACING, FONTS, RADIUS } from '../../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Slide = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
};

const SLIDES: Slide[] = [
  {
    icon: 'storefront',
    title: 'Shop your way',
    subtitle:
      'Discover fresh produce, groceries and everyday essentials from trusted sellers near you.',
  },
  {
    icon: 'shopping-bag',
    title: 'Easy checkout',
    subtitle:
      'Add to cart, pay securely and enjoy a fast, hassle-free checkout experience.',
  },
  {
    icon: 'local-shipping',
    title: 'Fast delivery',
    subtitle:
      'Track your orders in real time as they are prepared and delivered to your door.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      router.replace('/(auth)/login');
      return;
    }
    setIndex((i) => i + 1);
  };

  const previous = () => {
    if (index === 0) return;
    setIndex((i) => i - 1);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.skipWrap}
        >
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.illustration}>
        <View style={styles.medallion}>
          <View style={[styles.ring, styles.ringOuter]} />
          <View style={[styles.ring, styles.ringInner]} />
          <View style={styles.iconCircle}>
            <MaterialIcons name={slide.icon} size={78} color={COLORS.white} />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <View style={[styles.navRow, index === 0 && styles.navRowSingle]}>
          {index > 0 ? (
            <TouchableOpacity
              onPress={previous}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.prevBtn}
            >
              <MaterialIcons name="arrow-back" size={22} color={COLORS.primaryDark} />
              <Text style={styles.prevText}>Previous</Text>
            </TouchableOpacity>
          ) : null}
          <Button
            title={isLast ? 'Get Started' : 'Next'}
            onPress={next}
            size="lg"
            style={index === 0 ? styles.ctaSingle : styles.cta}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  topBar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  skipWrap: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  skip: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.textLight,
  },
  illustration: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallion: {
    width: SCREEN_WIDTH * 0.66,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: RADIUS.full,
  },
  ringOuter: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.teal[50],
  },
  ringInner: {
    width: '78%',
    height: '78%',
    backgroundColor: COLORS.teal[100],
  },
  iconCircle: {
    width: '58%',
    height: '58%',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ ios: { shadowColor: COLORS.primaryDark, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }, android: { elevation: 8 } }),
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl + SPACING.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: SPACING.sm + 2,
    marginBottom: SPACING.xl,
  },
  dots: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray[300],
  },
  dotActive: {
    width: 26,
    backgroundColor: COLORS.primary,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  navRowSingle: {
    justifyContent: 'center',
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  prevText: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.primaryDark,
  },
  cta: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  ctaSingle: {
    width: '60%',
  },
});
