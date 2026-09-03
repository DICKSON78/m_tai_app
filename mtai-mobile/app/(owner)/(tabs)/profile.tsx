import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../../src/api/client';
import AlertModal from '../../../src/components/AlertModal';
import Header from '../../../src/components/Header';
import { useAuthStore } from '../../../src/store/authStore';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../../src/constants/theme';

type ExtendedUser = {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  business_name?: string;
  business?: { name?: string } | null;
};

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

function formatCount(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatMoneyCompact(amount: number): string {
  const abs = Math.abs(amount);
  const trimZeros = (value: number) => value.toFixed(1).replace(/\.0$/, '');
  if (abs >= 1_000_000) return `TZS ${trimZeros(amount / 1_000_000)}M`;
  if (abs >= 10_000) return `TZS ${trimZeros(amount / 1_000)}K`;
  return `TZS ${formatCount(amount)}`;
}

type MenuItem = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
};

export default function OwnerProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [statsData, setStatsData] = useState<Record<string, unknown> | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const extendedUser = user as ExtendedUser | null;

  const loadData = useCallback(async () => {
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
      setLoadError('Could not load your business details. Pull down to retry.');
    } else {
      setLoadError(null);
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

  const performLogout = async () => {
    setConfirmLogout(false);
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch {
      setLoggingOut(false);
    }
  };

  const name =
    pickString(profileData ?? {}, ['owner_name']) ?? extendedUser?.name?.trim() ?? 'Business Owner';
  const email = extendedUser?.email ?? '';
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

  const statRows = [
    { icon: 'inventory-2' as const, label: 'Products', value: formatCount(productsCount) },
    { icon: 'receipt-long' as const, label: 'Orders', value: formatCount(ordersCount) },
    { icon: 'payments' as const, label: 'Revenue', value: formatMoneyCompact(revenueTotal) },
    { icon: 'warning' as const, label: 'Low Stock', value: formatCount(lowStockCount), warn: lowStockCount > 0 },
  ];

  const menuItems: MenuItem[] = [
    {
      icon: 'receipt-long',
      label: 'Orders',
      subtitle: 'Manage all your orders',
      onPress: () => router.push('/orders'),
    },
    {
      icon: 'inventory',
      label: 'Inventory',
      subtitle: 'Products and stock levels',
      onPress: () => router.push('/manage/inventory'),
    },
    {
      icon: 'bar-chart',
      label: 'Reports',
      subtitle: 'Sales and performance analytics',
      onPress: () => router.push('/reports'),
    },
    {
      icon: 'account-balance',
      label: 'Finance',
      subtitle: 'Revenue and payouts',
      onPress: () => router.push('/manage/finance'),
    },
    {
      icon: 'factory',
      label: 'Manufacturing',
      subtitle: 'Production and recipes',
      onPress: () => router.push('/manage/manufacturing'),
    },
    {
      icon: 'warehouse',
      label: 'Warehouse',
      subtitle: 'Locations and suppliers',
      onPress: () => router.push('/manage/warehouse'),
    },
    {
      icon: 'people',
      label: 'CRM',
      subtitle: 'Customers and relationships',
      onPress: () => router.push('/manage/crm'),
    },
    {
      icon: 'badge',
      label: 'HR',
      subtitle: 'Employees and attendance',
      onPress: () => router.push('/manage/hr'),
    },
  ];

  const renderMenuRow = (item: MenuItem, last: boolean) => (
    <TouchableOpacity
      key={item.label}
      activeOpacity={0.7}
      onPress={item.onPress}
      style={[styles.row, !last && styles.rowBorder]}
    >
      <View style={styles.rowIcon}>
        <MaterialIcons name={item.icon} size={20} color={COLORS.primaryDark} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        {item.subtitle ? <Text style={styles.rowSubtitle}>{item.subtitle}</Text> : null}
      </View>
      <MaterialIcons name="chevron-right" size={22} color={COLORS.gray[400]} />
    </TouchableOpacity>
  );

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <Header title="Profile" />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header title="Profile" />

      <ScrollView
        contentContainerStyle={styles.scroll}
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
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{(name.charAt(0) || 'O').toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {name}
              </Text>
              <MaterialIcons name="verified" size={16} color={COLORS.primaryDark} />
            </View>
            <Text style={styles.userRole}>Business Owner</Text>
            {businessName ? (
              <Text style={styles.userBusiness} numberOfLines={1}>
                {businessName}
              </Text>
            ) : null}
            <Text style={styles.userEmail} numberOfLines={1}>
              {email || ''}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Business Stats</Text>
        <View style={styles.group}>
          {statRows.map((item, i) => (
            <View key={item.label} style={[styles.row, i < statRows.length - 1 && styles.rowBorder]}>
              <View style={[styles.rowIcon, item.warn && styles.warnIcon]}>
                <MaterialIcons
                  name={item.icon}
                  size={20}
                  color={item.warn ? COLORS.warning : COLORS.primaryDark}
                />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>{item.label}</Text>
              </View>
              <Text style={[styles.rowValue, item.warn && styles.warnValue]}>{item.value}</Text>
            </View>
          ))}
          {loadError ? <Text style={styles.statError}>{loadError}</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>Menu</Text>
        <View style={styles.group}>
          {menuItems.map((item, i) => renderMenuRow(item, i === menuItems.length - 1))}
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.group}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setConfirmLogout(true)}
            style={styles.row}
          >
            <View style={[styles.rowIcon, styles.logoutIcon]}>
              <MaterialIcons name="logout" size={20} color={COLORS.red[700]} />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowLabel, styles.logoutText]}>Log Out</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.gray[400]} />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>M-TAI v1.0.0</Text>
      </ScrollView>

      <AlertModal
        visible={confirmLogout}
        title="Do you want to exit?"
        message="You will be logged out of your account."
        confirmText="Yes"
        cancelText="No"
        onConfirm={performLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingBottom: SPACING.xl,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: FONTS.size.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  userName: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    flexShrink: 1,
  },
  userRole: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  userBusiness: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textLight,
    marginTop: 2,
  },
  userEmail: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 2,
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
  row: {
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
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  warnIcon: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  logoutIcon: {
    backgroundColor: COLORS.red[100],
  },
  rowBody: {
    flex: 1,
  },
  rowLabel: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  rowSubtitle: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 2,
  },
  rowValue: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  warnValue: {
    color: COLORS.warning,
  },
  logoutText: {
    color: COLORS.red[700],
  },
  statError: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.red[700],
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  version: {
    textAlign: 'center',
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: SPACING.lg,
  },
});
