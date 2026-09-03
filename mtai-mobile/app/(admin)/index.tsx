import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../src/api/client';
import AlertModal from '../../src/components/AlertModal';
import Avatar from '../../src/components/Avatar';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import LoadingScreen from '../../src/components/LoadingScreen';
import SearchBar from '../../src/components/SearchBar';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';

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
  icon: keyof typeof MaterialIcons.glyphMap;
  kind: string;
}

const EMPTY_STATS: AdminStats = {
  totalBusinesses: 0,
  totalUsers: 0,
  totalOrders: 0,
  revenue: 0,
};

const BANNER_SLIDES = [
  {
    eyebrow: 'M-TAI • PLATFORM',
    title: 'Your platform\nat a glance',
    subtitle: 'Track every business, order and user in one place.',
    bg: COLORS.primaryDark,
  },
  {
    eyebrow: 'M-TAI • INSIGHTS',
    title: 'Live performance\nmetrics',
    subtitle: 'Revenue and growth across the whole network.',
    bg: '#0EA5E9',
  },
  {
    eyebrow: 'M-TAI • MANAGE',
    title: 'Manage with\nease',
    subtitle: 'Businesses, users and orders all in one dashboard.',
    bg: COLORS.primary,
  },
];

const ACTIVITY_FILTERS: { key: string; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: '', label: 'All', icon: 'apps' },
  { key: 'business', label: 'Businesses', icon: 'business' },
  { key: 'user', label: 'Users', icon: 'people' },
  { key: 'order', label: 'Orders', icon: 'shopping-cart' },
  { key: 'payment', label: 'Payments', icon: 'payments' },
  { key: 'product', label: 'Products', icon: 'inventory-2' },
];

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
          let icon: keyof typeof MaterialIcons.glyphMap = 'fiber-manual-record';
          if (kind.includes('business')) icon = 'business';
          else if (kind.includes('user') || kind.includes('register') || kind.includes('signup')) icon = 'person';
          else if (kind.includes('order')) icon = 'shopping-cart';
          else if (kind.includes('payment') || kind.includes('revenue') || kind.includes('payout')) icon = 'monetization-on';
          else if (kind.includes('product')) icon = 'inventory-2';
          else if (kind.includes('deliver') || kind.includes('transport')) icon = 'local-shipping';
          return {
            id: String(raw.id ?? `${index}-${message}`),
            message: String(message),
            createdAt: raw.created_at ?? raw.createdAt ?? raw.time ?? undefined,
            icon,
            kind,
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
  const trimZeros = (value: number) => value.toFixed(1).replace(/\.0$/, '');
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
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
}

interface StatCard {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  tint: string;
}

function BannerCarousel() {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const width = Dimensions.get('window').width;

  useEffect(() => {
    if (BANNER_SLIDES.length < 2) return;
    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % BANNER_SLIDES.length;
        scrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [width]);

  return (
    <View style={styles.bannerWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== index) setIndex(i);
        }}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          if (timerRef.current) clearInterval(timerRef.current);
        }}
        onScrollEndDrag={() => {
          if (BANNER_SLIDES.length > 1 && timerRef.current === null) {
            timerRef.current = setInterval(() => {
              setIndex((prev) => {
                const next = (prev + 1) % BANNER_SLIDES.length;
                scrollRef.current?.scrollTo({ x: next * width, animated: true });
                return next;
              });
            }, 4000);
          }
        }}
      >
        {BANNER_SLIDES.map((slide, i) => (
          <View key={i} style={[styles.bannerSlide, { width, backgroundColor: slide.bg }]}>
            <View style={styles.bannerGlow} />
            <Text style={styles.bannerEyebrow}>{slide.eyebrow}</Text>
            <Text style={styles.bannerTitle}>{slide.title}</Text>
            <Text style={styles.bannerSubtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>
      {BANNER_SLIDES.length > 1 && (
        <View style={styles.bannerDots}>
          {BANNER_SLIDES.map((_, i) => (
            <View key={i} style={[styles.bannerDot, i === index && styles.bannerDotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function AdminOverviewScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activityFilter, setActivityFilter] = useState('');

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

  const handleSearchSubmit = () => {
    router.push('/(admin)/businesses');
  };

  const userName = user?.name?.trim() || 'Admin';
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const statCards = useMemo<StatCard[]>(
    () => [
      { icon: 'business', label: 'Businesses', value: formatCount(stats.totalBusinesses), tint: COLORS.primaryDark },
      { icon: 'people', label: 'Users', value: formatCount(stats.totalUsers), tint: COLORS.primaryDark },
      { icon: 'shopping-cart', label: 'Orders', value: formatCount(stats.totalOrders), tint: COLORS.primaryDark },
      { icon: 'monetization-on', label: 'Revenue', value: formatMoneyCompact(stats.revenue), tint: COLORS.success },
    ],
    [stats]
  );

  const quickActions = useMemo<QuickAction[]>(
    () => [
      { icon: 'business', label: 'Businesses', onPress: () => router.push('/(admin)/businesses') },
      { icon: 'people', label: 'Users', onPress: () => router.push('/(admin)/users') },
      { icon: 'shopping-cart', label: 'Orders', onPress: () => router.push('/(admin)/orders') },
      { icon: 'campaign', label: 'Announce', onPress: () => router.push('/(admin)/announcements') },
    ],
    []
  );

  const filteredActivity = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return activity.filter((item) => {
      if (activityFilter && !item.kind.includes(activityFilter)) return false;
      if (q && !item.message.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activity, activityFilter, searchText]);

  const renderActivityRow = useCallback(
    ({ item }: { item: ActivityItem }) => (
      <View style={styles.activityRow}>
        <View style={styles.activityIconWrap}>
          <MaterialIcons name={item.icon} size={18} color={COLORS.primaryDark} />
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
      <View style={styles.homeHeader}>
        <Avatar uri={user?.avatar} name={userName} size={44} />
        <View style={styles.homeHeaderText}>
          <Text style={styles.greeting} numberOfLines={1}>{greeting}</Text>
          <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
          <Text style={styles.tagline}>Platform overview</Text>
        </View>
        <View style={styles.homeHeaderActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.dotsButton}
            onPress={() => setConfirmLogout(true)}
            hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
          >
            <MaterialIcons name="more-horiz" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
            placeholder="Search platform…"
            style={styles.searchBarInner}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.searchFilterIcon}
            onPress={handleSearchSubmit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="search" size={20} color={COLORS.primaryDark} />
          </TouchableOpacity>
        </View>
      </View>

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

        <BannerCarousel />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {ACTIVITY_FILTERS.map((f) => {
            const isActive = activityFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key || 'all'}
                activeOpacity={0.75}
                style={[styles.filterTile, isActive && styles.filterTileActive]}
                onPress={() => setActivityFilter(f.key)}
              >
                <View style={[styles.filterTileIcon, isActive && styles.filterTileIconActive]}>
                  <MaterialIcons name={f.icon} size={20} color={isActive ? COLORS.white : COLORS.primaryDark} />
                </View>
                <Text style={[styles.filterTileLabel, isActive && styles.filterTileLabelActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.statsGrid}>
          {statCards.map((card) => (
            <Card key={card.label} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: `${card.tint}1A` }]}>
                <MaterialIcons name={card.icon} size={22} color={card.tint} />
              </View>
              <Text style={styles.statValue} numberOfLines={1}>
                {card.value}
              </Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </Card>
          ))}
        </View>

        <Text style={styles.sectionHeader}>Manage</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.actionsRow}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                activeOpacity={0.75}
                onPress={action.onPress}
                style={styles.actionTile}
              >
                <View style={styles.actionIconWrap}>
                  <MaterialIcons name={action.icon} size={22} color={COLORS.primaryDark} />
                </View>
                <Text style={styles.actionLabel} numberOfLines={2}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Recent Activity</Text>
          <View style={[styles.liveDot, { backgroundColor: error ? COLORS.warning : COLORS.success }]} />
        </View>
        <Card style={styles.sectionCard}>
          {filteredActivity.length > 0 ? (
            <FlatList
              data={filteredActivity}
              keyExtractor={(item) => item.id}
              renderItem={renderActivityRow}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.activityDivider} />}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <EmptyState
              icon={<MaterialIcons name="notifications" size={32} color={COLORS.gray[400]} />}
              title={searchText.trim() || activityFilter ? 'No matching activity' : 'No recent activity'}
              subtitle="Platform events will appear here as they happen."
              style={styles.activityEmpty}
            />
          )}
        </Card>
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
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm + 4,
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  homeHeaderText: {
    flex: 1,
    marginLeft: SPACING.sm,
    marginRight: SPACING.sm,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  userName: {
    fontSize: FONTS.size.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: 2,
    flexShrink: 1,
  },
  tagline: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 2,
  },
  homeHeaderActions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  dotsButton: {
    width: 26,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    height: 46,
  },
  searchBarInner: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  searchFilterIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.gray[200],
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl + SPACING.lg,
  },
  errorBanner: {
    backgroundColor: COLORS.red[100],
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
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
    fontFamily: FONTS.bold,
  },
  bannerWrap: {
    height: 170,
    marginTop: SPACING.xs,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  bannerSlide: {
    height: 170,
    justifyContent: 'flex-end',
    padding: SPACING.lg,
  },
  bannerGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  bannerEyebrow: {
    color: COLORS.white,
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  bannerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontFamily: FONTS.bold,
    lineHeight: 28,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    marginTop: SPACING.xs,
    maxWidth: 280,
  },
  bannerDots: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.sm,
    flexDirection: 'row',
    gap: 5,
  },
  bannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  bannerDotActive: {
    backgroundColor: COLORS.white,
    width: 18,
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  filterTile: {
    width: 84,
    alignItems: 'center',
    gap: SPACING.xs + 2,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  filterTileActive: {
    backgroundColor: COLORS.primaryDark,
  },
  filterTileIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.teal[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTileIconActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterTileLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  filterTileLabelActive: {
    color: COLORS.white,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  statCard: {
    width: '48%',
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
  statValue: {
    fontSize: FONTS.size.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.textLight,
  },
  sectionHeader: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md + 2,
    marginBottom: SPACING.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md + 2,
    marginBottom: SPACING.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
  },
  sectionCard: {
    marginBottom: SPACING.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionTile: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.teal[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    textAlign: 'center',
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
    backgroundColor: COLORS.teal[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 4,
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
});
