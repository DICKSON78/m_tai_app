import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import api from '../../src/api/client';
import { User } from '../../src/api/types';
import { useAuthStore } from '../../src/store/authStore';
import Avatar from '../../src/components/Avatar';
import Badge from '../../src/components/Badge';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS, FONTS, RADIUS, SPACING } from '../../src/constants/theme';

type ExtendedUser = User & {
  business_name?: string;
  business?: { id?: number; name?: string } | null;
};

interface StatTile {
  icon: string;
  value: string;
  label: string;
  color: string;
}

const QUICK_LINKS: { icon: string; label: string; path: string }[] = [
  { icon: '📊', label: 'Dashboard', path: '/(owner)' },
  { icon: '📦', label: 'Orders', path: '/(owner)/orders' },
  { icon: '📈', label: 'Reports', path: '/(owner)/reports' },
];

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data;
    if (typeof data === 'string' && data.length > 0) return data;
    const message = (data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  return fallback;
}

function normalizeObject(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const data = (payload as { data?: unknown }).data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }
    return payload as Record<string, unknown>;
  }
  return {};
}

function pickNumber(source: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return 0;
}

function pickString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return undefined;
}

function formatTZS(amount: number): string {
  const rounded = Math.round(amount);
  const withSeparators = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `TZS ${withSeparators}`;
}

export default function OwnerProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [statsData, setStatsData] = useState<Record<string, unknown> | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const extendedUser = user as ExtendedUser | null;

  const loadData = useCallback(async () => {
    setLoadError(null);
    const [profileRes, statsRes] = await Promise.allSettled([
      api.get('/business/profile'),
      api.get('/business/stats'),
    ]);
    if (profileRes.status === 'fulfilled') {
      setProfileData(normalizeObject(profileRes.value.data));
    } else {
      setProfileData(null);
    }
    if (statsRes.status === 'fulfilled') {
      setStatsData(normalizeObject(statsRes.value.data));
    } else {
      setStatsData(null);
    }
    if (profileRes.status === 'rejected' && statsRes.status === 'rejected') {
      setLoadError(
        extractErrorMessage(profileRes.reason, 'Could not load your business details.')
      );
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setInitialLoading(false));
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), useAuthStore.getState().refreshUser()]);
    setRefreshing(false);
  }, [loadData]);

  const performLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  }, [logout]);

  const handleLogout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure you want to log out of M-TAI?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: performLogout },
    ]);
  }, [performLogout]);

  if (initialLoading) {
    return <LoadingScreen />;
  }

  const name =
    pickString(profileData ?? {}, ['owner_name']) ?? extendedUser?.name ?? 'Business Owner';
  const email = extendedUser?.email ?? '';
  const phone = extendedUser?.phone ?? '';
  const avatarUri = extendedUser?.avatar;
  const businessName =
    pickString(profileData ?? {}, ['business_name', 'businessName', 'name']) ??
    extendedUser?.business_name ??
    extendedUser?.business?.name ??
    '';

  const productsCount = pickNumber(statsData ?? {}, ['total_products', 'products_count']);
  const ordersCount = pickNumber(statsData ?? {}, ['total_orders', 'orders_count']);
  const revenueTotal = pickNumber(statsData ?? {}, ['total_revenue', 'revenue']);
  const lowStockCount = pickNumber(statsData ?? {}, [
    'low_stock_count',
    'low_stock_items_count',
    'low_stock',
  ]);

  const statTiles: StatTile[] = [
    { icon: '🏷️', value: String(productsCount), label: 'Products', color: COLORS.primaryDark },
    { icon: '🧾', value: String(ordersCount), label: 'Orders', color: '#5B8DEF' },
    { icon: '💰', value: formatTZS(revenueTotal), label: 'Revenue', color: COLORS.success },
    {
      icon: '⚠️',
      value: String(lowStockCount),
      label: 'Low Stock',
      color: lowStockCount > 0 ? COLORS.red[700] : COLORS.gray[500],
    },
  ];

  const infoRows: { label: string; value: string }[] = [
    { label: 'Email', value: email || '—' },
    ...(phone ? [{ label: 'Phone', value: phone }] : []),
    ...(extendedUser?.current_business_id
      ? [{ label: 'Business ID', value: `#${extendedUser.current_business_id}` }]
      : []),
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Profile" subtitle="Business Owner" />
      {loadError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <Card style={styles.section}>
          <View style={styles.identityRow}>
            <Avatar uri={avatarUri} name={name} size={64} />
            <View style={styles.identityInfo}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              {email ? (
                <Text style={styles.contactLine} numberOfLines={1}>
                  {email}
                </Text>
              ) : null}
              {phone ? (
                <Text style={styles.contactLine} numberOfLines={1}>
                  {phone}
                </Text>
              ) : null}
            </View>
            <Badge label="Owner" color={COLORS.primaryDark} size="sm" />
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.businessRow}>
            <View style={styles.businessIconCircle}>
              <Text style={styles.businessIcon}>🏪</Text>
            </View>
            <View style={styles.businessInfo}>
              <Text style={styles.businessLabel}>Business</Text>
              <Text style={styles.businessName} numberOfLines={1}>
                {businessName || 'My Business'}
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {statTiles.map((tile) => (
              <View key={tile.label} style={styles.statTile}>
                <Text style={styles.statIcon}>{tile.icon}</Text>
                <Text
                  style={[styles.statValue, { color: tile.color }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.6}
                >
                  {tile.value}
                </Text>
                <Text style={styles.statLabel}>{tile.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          {infoRows.map((row) => (
            <View key={row.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </Card>

        <Card style={[styles.section, styles.linksCard]}>
          {QUICK_LINKS.map((link, index) => (
            <React.Fragment key={link.label}>
              {index > 0 ? <View style={styles.linkDivider} /> : null}
              <TouchableOpacity
                style={styles.linkRow}
                activeOpacity={0.7}
                onPress={() => router.push(link.path as any)}
              >
                <View style={styles.linkRowLeft}>
                  <View style={styles.linkIconCircle}>
                    <Text style={styles.linkIcon}>{link.icon}</Text>
                  </View>
                  <Text style={styles.linkText}>{link.label}</Text>
                </View>
                <Text style={styles.linkChevron}>{'>'}</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </Card>

        <Button
          title="Log Out"
          variant="danger"
          size="lg"
          onPress={handleLogout}
          loading={loggingOut}
          disabled={loggingOut}
          style={styles.logoutButton}
        />

        <Text style={styles.version}>M-TAI v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorBanner: {
    backgroundColor: COLORS.red[100],
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  errorText: {
    color: COLORS.red[700],
    fontSize: FONTS.size.sm,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl + SPACING.lg,
  },
  section: {
    marginBottom: SPACING.md,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  identityInfo: {
    flex: 1,
  },
  name: {
    fontSize: FONTS.size.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  contactLine: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  businessIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessIcon: {
    fontSize: FONTS.size.xl - 2,
  },
  businessInfo: {
    flex: 1,
  },
  businessLabel: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  businessName: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: SPACING.md,
    paddingTop: SPACING.md,
  },
  statTile: {
    width: '25%',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  statIcon: {
    fontSize: FONTS.size.lg,
  },
  statValue: {
    fontSize: FONTS.size.lg,
    fontWeight: '800',
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm + 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  infoLabel: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
  },
  infoValue: {
    flexShrink: 1,
    marginLeft: SPACING.md,
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  linksCard: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 4,
  },
  linkRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  linkIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkIcon: {
    fontSize: FONTS.size.lg - 2,
  },
  linkText: {
    fontSize: FONTS.size.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  linkChevron: {
    fontSize: FONTS.size.xl,
    color: COLORS.gray[400],
  },
  linkDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.gray[200],
  },
  logoutButton: {
    marginTop: SPACING.sm,
  },
  version: {
    textAlign: 'center',
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: SPACING.lg,
  },
});
