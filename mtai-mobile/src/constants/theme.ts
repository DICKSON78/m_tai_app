export const COLORS = {
  primary: '#00D4AA',
  primaryDark: '#00A886',
  primaryLight: 'rgba(0, 212, 170, 0.12)',
  secondary: '#0B132B',
  white: '#FFFFFF',
  black: '#0A0A0A',
  background: '#F8FAFB',
  surface: '#FFFFFF',
  text: '#111827',
  textLight: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  overlay: 'rgba(0, 0, 0, 0.5)',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  red: {
    100: '#FEE2E2',
    300: '#FCA5A5',
    500: '#EF4444',
    700: '#B91C1C',
  },
  green: {
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
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
  size: {
    xs: 10,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
