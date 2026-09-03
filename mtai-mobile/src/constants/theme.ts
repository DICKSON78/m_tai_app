export const FONT = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

// M-TAI brand teal, kept as the primary while adopting the
// Vantage POS design language (light surface, white cards, tinted pills).
export const COLORS = {
  primary: '#00D4AA',
  primaryDark: '#00A886',
  primaryLight: 'rgba(0, 212, 170, 0.12)',
  secondary: '#0B132B',
  white: '#FFFFFF',
  black: '#0A0A0A',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textLight: '#64748B',
  border: '#E2E8F0',
  success: '#16A34A',
  warning: '#F59E0B',
  info: '#0EA5E9',
  error: '#DC2626',
  overlay: 'rgba(0, 0, 0, 0.5)',
  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  teal: {
    50: '#E6FBF6',
    100: '#CCF7ED',
    300: '#66E4C8',
    500: '#00D4AA',
    700: '#00A886',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    300: '#FCA5A5',
    500: '#EF4444',
    700: '#B91C1C',
  },
  green: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#00D4AA',
    700: '#00A886',
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONTS = {
  regular: FONT.regular,
  medium: FONT.medium,
  semibold: FONT.semibold,
  bold: FONT.bold,
  size: {
    xs: 11,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 26,
    xxxl: 34,
  },
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: 'rgba(15, 23, 42, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: 'rgba(15, 23, 42, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: 'rgba(15, 23, 42, 0.12)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
