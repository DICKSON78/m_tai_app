import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
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
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';

interface AdminStats {
  totalBusinesses: number;
  totalUsers: number;
  totalOrders: number;
  revenue: number;
}

interface ActivityItem {
  id: string;
  message: string;
  createdAt?: string;
  icon: string;
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

function normalizeStats(payload: unknown): { stats: AdminStats; activity: ActivityItem[] } {
  let body: Record<string, any> | null = null;
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const wrapper = payload as Record<string, any>;
    body =
      wrapper.data && typeof wrapper.data === 'object' && !Array.isArray(wrapper.data)
        ? (wrapper.data as Record<string, any>)
        : wrapper;
  }

  const rawActivity = body?.recent_activity ?? body?.recentActivity ?? body?.activity ?? [];
  const activityList: ActivityItem[] = Array.isArray(rawActivity)
    ? rawActivity
        .map((raw: any, index: number): ActivityItem | null => {
          if (!raw) return null;
          const message =
            raw.description ?? raw.message ?? raw.text ?? raw.title ?? raw.action ?? '';
          if (!message) return null;
          const kind = String(raw.type ?? message).toLowerCase();
          let icon = '•';
          if (kind.includes('business')) icon = '🏢';
          else if (kind.includes('user') || kind.includes('register') || kind.includes('signup')) icon = '👤';
          else if (kind.includes('order')) icon = '🛒';
          else if (kind.includes('payment') || kind.includes('revenue') || kind.includes('payout')) icon = '💰';
          else if (kind.includes('product')) icon = '📦';
          else if (kind.includes('deliver') || kind.includes('transport')) icon = '🚚';
          return {
            id: String(raw.id ?? `${index}-${message}`),
            message: String(message),
            createdAt: raw.created_at ?? raw.createdAt ?? raw.time ?? undefined,
            icon,
          };
        })
        .filter((item): item is ActivityItem => item !== null)
    : [];

  const stats: AdminStats = {
    totalBusinesses: toNumber(body?.total_businesses ?? body?.totalBusinesses ?? body?.businesses_count),
    totalUsers: toNumber(body?.total_users ?? body?.totalUsers ?? body?.users_count),
    totalOrders: toNumber(body?.total_orders ?? body?.totalOrders ?? body?.orders_count),
    revenue: toNumber(body?.revenue ?? body?.total_revenue ?? body?.totalRevenue),
  };

  return { stats, activity: activityList };
}

function formatCount(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatMoneyCompact(amount: number): string {
  const abs = Math.abs(amount);
  const trimZeros = (value: number) =>
    value.toFixed(1).replace(/\.0$/, '');
  if (abs >= 1_000_000) return `TZS ${trimZeros(amount / 1_000_000)}M`;
  if (abs >= 10_000) return `TZS ${trimZeros(amount / 1_000)}K`;
  return `TZS ${formatCount(amount)}`;
}

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

interface QuickAction {
  icon: string;
  label: string;
  onPress: () => void;
}

export default function AdminOverviewScreen() {
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSeqRef = useRef(0);

  const loadStats = useCallback(async () => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;

    try {
      const res = await api.get('/admin/dashboard');
      if (requestId !== requestSeqRef.current) return;
      const { stats: nextStats, activity: nextActivity } = normalizeStats(res.data);
      setStats(nextStats);
      setActivity(nextActivity);
      setError(null);
    } catch (err: any) {
      if (requestId !== requestSeqRef.current) return;
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Something went wrong while loading platform stats.'
      );
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

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, [loadStats]);

  const statCards = useMemo(
    () => [
      { icon: '🏢', label: 'Businesses', value: formatCount(stats.totalBusinesses), tint: '#5B8DEF' },
      { icon: '👥', label: 'Users', value: formatCount(stats.totalUsers), tint: COLORS.primaryDark },
      { icon: '🛒', label: 'Orders', value: formatCount(stats.totalOrders), tint: '#8B5CF6' },
      { icon: '💰', label: 'Revenue', value: formatMoneyCompact(stats.revenue), tint: COLORS.success },
    ],
    [stats]
  );

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        icon: '🏢',
        label: 'Manage Businesses',
        onPress: () => router.push('/(admin)/businesses'),
      },
      {
        icon: '👥',
        label: 'Manage Users',
        onPress: () => router.push('/(admin)/users'),
      },
      {
        icon: '📣',
        label: 'Announcements',
        onPress: () => router.push('/(admin)/announcements'),
      },
    ],
    []
  );

  const renderActivityRow = useCallback(
    ({ item }: { item: ActivityItem }) => (
      <View style={styles.activityRow}>
        <View style={styles.activityIconWrap}>
          <Text style={styles.activityIcon}>{item.icon}</Text>
        </View>
        <View style={styles.activityBody}>
          <Text style={styles.activityMessage}>{item.message}</Text>
          {item.createdAt ? (
            <Text style={styles.activityTime}>{timeAgo(item.createdAt)}</Text>
          ) : null}
        </View>
      </View>
    ),
    []
  );

  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Admin" subtitle="Platform overview" />
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
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadStats} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.errorRetry}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          {statCards.map((card) => (
            <Card key={card.label} style={[styles.statCard, SHADOWS.md]}>
              <View style={[styles.statIconWrap, { backgroundColor: `${card.tint}1A` }]}>
                <Text style={styles.statIcon}>{card.icon}</Text>
              </View>
              <Text style={styles.statValue} numberOfLines={1}>
                {card.value}
              </Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </Card>
          ))}
        </View>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                activeOpacity={0.75}
                onPress={action.onPress}
                style={styles.actionTile}
              >
                <View style={styles.actionIconWrap}>
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                </View>
                <Text style={styles.actionLabel} numberOfLines={2}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View
              style={[
                styles.liveDot,
                { backgroundColor: error ? COLORS.warning : COLORS.success },
              ]}
            />
          </View>
          {activity.length > 0 ? (
            <FlatList
              data={activity}
              keyExtractor={(item) => item.id}
              renderItem={renderActivityRow}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.activityDivider} />}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <EmptyState
              icon={<Text style={styles.emptyIcon}>🔔</Text>}
              title="No recent activity"
              subtitle="Platform events will appear here as they happen."
              style={styles.activityEmpty}
            />
          )}
        </Card>
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
  errorBanner: {
    backgroundColor: COLORS.red[100],
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  errorText: {
    flex: 1,
    color: COLORS.red[700],
    fontSize: FONTS.size.sm,
  },
  errorRetry: {
    color: COLORS.red[700],
    fontSize: FONTS.size.sm,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    width: '47.5%',
    flexGrow: 1,
    gap: SPACING.xs,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm + 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statIcon: {
    fontSize: FONTS.size.lg,
  },
  statValue: {
    fontSize: FONTS.size.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.textLight,
  },
  sectionCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm + 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  actionTile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.gray[200],
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm - 2,
  },
  actionIcon: {
    fontSize: FONTS.size.xl,
  },
  actionLabel: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 14,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm + 2,
  },
  activityIconWrap: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 4,
  },
  activityIcon: {
    fontSize: FONTS.size.md,
  },
  activityBody: {
    flex: 1,
  },
  activityMessage: {
    fontSize: FONTS.size.md,
    color: COLORS.text,
    lineHeight: 19,
  },
  activityTime: {
    fontSize: FONTS.size.xs,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  activityDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.gray[200],
  },
  activityEmpty: {
    paddingVertical: SPACING.lg,
  },
  emptyIcon: {
    fontSize: 32,
  },
});
