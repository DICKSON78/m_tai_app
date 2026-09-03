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
import api from '../../src/api/client';
import AlertModal from '../../src/components/AlertModal';
import Header from '../../src/components/Header';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';

interface AdminStats {
  totalBusinesses: number;
  totalUsers: number;
  totalOrders: number;
  revenue: number;
}

const EMPTY_STATS: AdminStats = {
  totalBusinesses: 0,
  totalUsers: 0,
  totalOrders: 0,
  revenue: 0,
};

function toNumber(value: unknown): number {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStats(payload: unknown): AdminStats {
  let body: Record<string, any> | null = null;
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const wrapper = payload as Record<string, any>;
    body =
      wrapper.data && typeof wrapper.data === 'object' && !Array.isArray(wrapper.data)
        ? (wrapper.data as Record<string, any>)
        : wrapper;
  }

  return {
    totalBusinesses: toNumber(body?.total_businesses ?? body?.totalBusinesses ?? body?.businesses_count),
    totalUsers: toNumber(body?.total_users ?? body?.totalUsers ?? body?.users_count),
    totalOrders: toNumber(body?.total_orders ?? body?.totalOrders ?? body?.orders_count),
    revenue: toNumber(body?.revenue ?? body?.total_revenue ?? body?.totalRevenue),
  };
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

export default function AdminProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const requestSeqRef = useRef(0);

  const loadStats = useCallback(async () => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;

    try {
      const res = await api.get('/admin/dashboard');
      if (requestId !== requestSeqRef.current) return;
      setStats(normalizeStats(res.data));
      setLoadError(null);
    } catch (err: any) {
      if (requestId !== requestSeqRef.current) return;
      setLoadError('Could not load platform stats. Pull down to retry.');
    } finally {
      if (requestId === requestSeqRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), useAuthStore.getState().refreshUser()]);
  }, [loadStats]);

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

  const menuItems: MenuItem[] = [
    {
      icon: 'business',
      label: 'Manage Businesses',
      subtitle: 'Review and manage all businesses',
      onPress: () => router.push('/(admin)/businesses'),
    },
    {
      icon: 'group',
      label: 'Manage Users',
      subtitle: 'Accounts, roles and permissions',
      onPress: () => router.push('/(admin)/users'),
    },
    {
      icon: 'receipt-long',
      label: 'Orders',
      subtitle: 'All platform orders',
      onPress: () => router.push('/(admin)/orders'),
    },
    {
      icon: 'campaign',
      label: 'Announcements',
      subtitle: 'Broadcast messages to users',
      onPress: () => router.push('/(admin)/announcements'),
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

  const statRows = [
    { icon: 'domain' as const, label: 'Businesses', value: formatCount(stats.totalBusinesses) },
    { icon: 'group' as const, label: 'Users', value: formatCount(stats.totalUsers) },
    { icon: 'receipt-long' as const, label: 'Orders', value: formatCount(stats.totalOrders) },
    { icon: 'payments' as const, label: 'Revenue', value: formatMoneyCompact(stats.revenue) },
  ];

  const name = user?.name?.trim() || 'Admin';

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
        bounces={false}
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
            <Text style={styles.avatarInitial}>{(name.charAt(0) || 'A').toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {name}
              </Text>
              <MaterialIcons name="verified" size={16} color={COLORS.primaryDark} />
            </View>
            <Text style={styles.userRole}>Administrator</Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email || ''}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Platform Stats</Text>
        <View style={styles.group}>
          {statRows.map((item, i) => (
            <View key={item.label} style={[styles.row, i < statRows.length - 1 && styles.rowBorder]}>
              <View style={styles.rowIcon}>
                <MaterialIcons name={item.icon} size={20} color={COLORS.primaryDark} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>{item.label}</Text>
              </View>
              <Text style={styles.rowValue}>{item.value}</Text>
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
