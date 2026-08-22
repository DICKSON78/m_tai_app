import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import api from '../../src/api/client';
import { useAuthStore } from '../../src/store/authStore';
import Avatar from '../../src/components/Avatar';
import Badge from '../../src/components/Badge';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
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

export default function AdminProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const requestSeqRef = useRef(0);

  const loadStats = useCallback(async () => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;

    try {
      const res = await api.get('/admin/stats');
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

  const handleLogout = useCallback(() => {
    Alert.alert('Log out', 'Are you sure you want to log out of M-TAI?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          try {
            router.replace('/(auth)/login');
          } catch {
            router.replace('/');
          }
        },
      },
    ]);
  }, [logout]);

  if (initialLoading) {
    return <LoadingScreen />;
  }

  const name = user?.name ?? 'Admin';
  const email = user?.email ?? '';

  const summaryItems = [
    { icon: '🏢', label: 'Businesses', value: formatCount(stats.totalBusinesses), tint: '#5B8DEF' },
    { icon: '👥', label: 'Users', value: formatCount(stats.totalUsers), tint: COLORS.primaryDark },
    { icon: '🛒', label: 'Orders', value: formatCount(stats.totalOrders), tint: '#8B5CF6' },
    { icon: '💰', label: 'Revenue', value: formatMoneyCompact(stats.revenue), tint: COLORS.success },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Profile" subtitle="Administrator" />
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
        <Card style={[styles.section, SHADOWS.md]}>
          <View style={styles.identityRow}>
            <Avatar uri={user?.avatar} name={name} size={64} />
            <View style={styles.identityInfo}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              {email ? (
                <Text style={styles.email} numberOfLines={1}>
                  {email}
                </Text>
              ) : null}
            </View>
            <Badge label="Admin" color={COLORS.secondary} size="sm" />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Stats</Text>
          {loadError ? (
            <Text style={styles.errorText}>{loadError}</Text>
          ) : (
            <>
              <View style={styles.summaryRow}>
                {summaryItems.slice(0, 2).map((item) => (
                  <View
                    key={item.label}
                    style={[styles.summaryTile, { backgroundColor: `${item.tint}14` }]}
                  >
                    <Text style={styles.summaryIcon}>{item.icon}</Text>
                    <Text style={[styles.summaryValue, { color: item.tint }]} numberOfLines={1}>
                      {item.value}
                    </Text>
                    <Text style={styles.summaryLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
              <View style={[styles.summaryRow, styles.summaryRowSpacing]}>
                {summaryItems.slice(2).map((item) => (
                  <View
                    key={item.label}
                    style={[styles.summaryTile, { backgroundColor: `${item.tint}14` }]}
                  >
                    <Text style={styles.summaryIcon}>{item.icon}</Text>
                    <Text style={[styles.summaryValue, { color: item.tint }]} numberOfLines={1}>
                      {item.value}
                    </Text>
                    <Text style={styles.summaryLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>

        <Button
          title="Log Out"
          variant="danger"
          size="lg"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  email: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: FONTS.size.sm,
    color: COLORS.red[700],
    lineHeight: 19,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  summaryRowSpacing: {
    marginTop: SPACING.md,
  },
  summaryTile: {
    flex: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  summaryIcon: {
    fontSize: FONTS.size.xl,
  },
  summaryValue: {
    fontSize: FONTS.size.lg,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutButton: {
    marginTop: SPACING.sm,
  },
});
