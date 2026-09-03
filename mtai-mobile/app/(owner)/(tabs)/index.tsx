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
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../../src/api/client';
import { Order } from '../../../src/api/types';
import AlertModal from '../../../src/components/AlertModal';
import Avatar from '../../../src/components/Avatar';
import Badge from '../../../src/components/Badge';
import Card from '../../../src/components/Card';
import EmptyState from '../../../src/components/EmptyState';
import LoadingScreen from '../../../src/components/LoadingScreen';
import PriceTag from '../../../src/components/PriceTag';
import SearchBar from '../../../src/components/SearchBar';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../../src/constants/theme';
import { useAuthStore } from '../../../src/store/authStore';

const MAX_RECENT_ORDERS = 5;

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning,
  confirmed: COLORS.info,
  accepted: COLORS.info,
  processing: COLORS.info,
  preparing: COLORS.warning,
  packed: COLORS.info,
  ready: COLORS.info,
  shipped: COLORS.primaryDark,
  out_for_delivery: COLORS.primaryDark,
  en_route: COLORS.primaryDark,
  delivering: COLORS.primaryDark,
  delivered: COLORS.success,
  completed: COLORS.success,
  received: COLORS.success,
  cancelled: COLORS.error,
  canceled: COLORS.error,
  rejected: COLORS.error,
  failed: COLORS.error,
};

interface StatusMeta {
  label: string;
  color: string;
}

function getStatusMeta(status: string): StatusMeta {
  const key = (status || '').toLowerCase();
  const color = STATUS_COLORS[key] ?? COLORS.gray[500];
  const label = key
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return { label: label || 'Unknown', color };
}

const BANNER_SLIDES = [
  {
    eyebrow: 'M-TAI • BUSINESS',
    title: 'Welcome to your\nbusiness hub',
    subtitle: 'Track sales, orders and stock all in one place.',
    bg: COLORS.primaryDark,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
  },
  {
    eyebrow: 'M-TAI • SALES',
    title: 'Grow your\nsales today',
    subtitle: 'Fresh insights on revenue and performance.',
    bg: COLORS.info,
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80',
  },
  {
    eyebrow: 'M-TAI • PLATFORM',
    title: 'Keep stock\nlevels healthy',
    subtitle: 'Get low-stock alerts before they become issues.',
    bg: COLORS.primary,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
  },
];

const ORDER_FILTERS: { key: string; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: '', label: 'All', icon: 'apps' },
  { key: 'pending', label: 'Pending', icon: 'schedule' },
  { key: 'process', label: 'Active', icon: 'local-shipping' },
  { key: 'deliver', label: 'In Transit', icon: 'inventory-2' },
  { key: 'complet', label: 'Done', icon: 'check-circle' },
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

function pickArray<T>(source: Record<string, unknown>, keys: string[]): T[] {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

function normalizePaginated<T>(payload: unknown): { items: T[] } {
  const body = payload as Record<string, unknown> | null;
  const paginated =
    body && typeof body === 'object' && Array.isArray((body.data as { data?: unknown })?.data)
      ? body.data
      : body;
  const items = (paginated as { data?: unknown })?.data;
  return { items: Array.isArray(items) ? (items as T[]) : [] };
}

function formatTZS(amount: number): string {
  const rounded = Math.round(amount);
  const withSeparators = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `TZS ${withSeparators}`;
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

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${month} ${day}, ${year} · ${hours}:${minutes} ${ampm}`;
}

async function fetchFallbackOrders(): Promise<Order[]> {
  try {
    const res = await api.get('/orders', { params: { page: 1 } });
    const result = normalizePaginated<Order>(res.data);
    return result.items.slice(0, MAX_RECENT_ORDERS);
  } catch {
    return [];
  }
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function RingGauge({
  percent,
  color,
  size = 66,
  children,
}: {
  percent: number;
  color: string;
  size?: number;
  children: React.ReactNode;
}) {
  const clamped = clampPercent(percent);
  const radius = (size - 6) / 2;
  const stroke = Math.max(4, size * 0.12);
  const circumference = 2 * Math.PI * radius;
  const arc = (clamped / 100) * circumference;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 3,
          left: 3,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          borderColor: COLORS.gray[100],
          borderWidth: stroke,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 3,
          left: 3,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          borderColor: color,
          borderWidth: stroke,
          borderRightColor: COLORS.gray[100],
          borderBottomColor: COLORS.gray[100],
          transform: [{ rotate: `-90deg` }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 3,
          left: 3,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          borderColor: color,
          borderWidth: stroke,
          borderLeftColor: 'transparent',
          borderTopColor: 'transparent',
          transform: [{ rotate: `${-90 + (arc / circumference) * 360}deg` }],
        }}
      />
      {children}
    </View>
  );
}

function SalesLegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.salesLegendRow}>
      <View style={[styles.salesLegendDot, { backgroundColor: color }]} />
      <Text style={styles.salesLegendLabel}>{label}</Text>
      <Text style={styles.salesLegendValue} numberOfLines={1}>{value}</Text>
    </View>
  );
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
            {slide.image ? (
              <Image source={{ uri: slide.image }} style={styles.bannerImage} resizeMode="cover" />
            ) : null}
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

export default function OwnerDashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [businessName, setBusinessName] = useState('');
  const [todaySales, setTodaySales] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [orderFilter, setOrderFilter] = useState('');

  const requestSeqRef = useRef(0);

  const loadDashboard = useCallback(async () => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;
    setLoadError(null);
    try {
      const res = await api.get('/owner/dashboard');
      if (requestId !== requestSeqRef.current) return;
      const data = normalizeObject(res.data);
      setTodaySales(pickNumber(data, ['today_sales', 'todaySales', 'todays_sales', 'sales_today']));
      setRevenue(pickNumber(data, ['total_revenue', 'revenue', 'totalRevenue']));
      setOrdersCount(pickNumber(data, ['orders_count', 'ordersCount', 'orders_today', 'total_orders']));
      setLowStockCount(
        pickNumber(data, [
          'low_stock_count',
          'lowStockCount',
          'low_stock_items_count',
          'out_of_stock_count',
          'low_stock',
        ])
      );
      const business = data.business as { name?: unknown } | null | undefined;
      const businessFromObject = business && typeof business.name === 'string' ? business.name : '';
      setBusinessName(
        (data.business_name as string) || (data.businessName as string) || businessFromObject
      );
      const recent = pickArray<Order>(data, ['recent_orders', 'recentOrders', 'latest_orders']);
      if (recent.length > 0) {
        setRecentOrders(recent.slice(0, MAX_RECENT_ORDERS));
      } else {
        setRecentOrders(await fetchFallbackOrders());
      }
    } catch (err) {
      if (requestId !== requestSeqRef.current) return;
      setLoadError(extractErrorMessage(err, 'Could not load your dashboard.'));
    } finally {
      if (requestId === requestSeqRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, [loadDashboard]);

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
    router.push('/manage/inventory');
  };

  const userName = user?.name?.trim() || 'Owner';
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const tagline = businessName?.trim() || 'Business overview';

  const avatarInitial = useMemo(() => {
    const first = (user?.name?.trim() ?? '').split(/\s+/)[0] || '';
    return (first.charAt(0) || 'O').toUpperCase();
  }, [user]);

  const salesOverview = useMemo(
    () => ({
      todaySales,
      revenue,
      ordersCount,
      lowStockCount,
      revenuePercent: revenue > 0 ? clampPercent((todaySales / revenue) * 100) : 0,
    }),
    [todaySales, revenue, ordersCount, lowStockCount]
  );

  const filteredOrders = useMemo(() => {
    if (!orderFilter) return recentOrders;
    return recentOrders.filter((order) =>
      (order.status || '').toLowerCase().includes(orderFilter)
    );
  }, [recentOrders, orderFilter]);

  const renderRecentOrder = useCallback(
    (order: Order) => {
      const meta = getStatusMeta(order.status);
      const customerName = order.customer?.name ?? 'Walk-in Customer';
      return (
        <Card
          key={order.id}
          style={styles.recentCard}
          onPress={() =>
            router.push({
              pathname: '/order-detail',
              params: { id: String(order.id) },
            })
          }
        >
          <View style={styles.recentRow}>
            <Avatar uri={order.customer?.avatar} name={customerName} size={42} />
            <View style={styles.recentInfo}>
              <Text style={styles.recentNumber}>#{order.order_number}</Text>
              <Text style={styles.recentCustomer} numberOfLines={1}>
                {customerName}
              </Text>
              <Text style={styles.recentDate}>{formatDate(order.created_at)}</Text>
            </View>
            <View style={styles.recentRight}>
              <Badge label={meta.label} color={meta.color} size="sm" />
              <PriceTag price={order.total} size="sm" />
            </View>
          </View>
        </Card>
      );
    },
    []
  );

  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.homeHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{avatarInitial}</Text>
        </View>
        <View style={styles.homeHeaderText}>
          <Text style={styles.greeting} numberOfLines={1}>{greeting}</Text>
          <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
          <Text style={styles.tagline} numberOfLines={1}>{tagline}</Text>
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
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.notifButton}
            onPress={() => router.push('/(owner)/notifications')}
            hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
          >
            <MaterialIcons name="notifications-none" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
            placeholder="Search inventory…"
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
        {loadError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{loadError}</Text>
            <TouchableOpacity onPress={loadDashboard} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
          {ORDER_FILTERS.map((f) => {
            const isActive = orderFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key || 'all'}
                activeOpacity={0.8}
                style={styles.chipTile}
                onPress={() => setOrderFilter(f.key)}
              >
                <View style={[styles.chipIconWrap, isActive && styles.chipIconWrapActive]}>
                  <MaterialIcons name={f.icon} size={16} color={isActive ? '#FFFFFF' : COLORS.primaryDark} />
                </View>
                <Text
                  style={[styles.chipLabel, isActive && styles.chipLabelActive]}
                  numberOfLines={1}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Card style={styles.salesCard}>
          <View style={styles.salesCardHeader}>
            <View style={[styles.salesCardIcon, { backgroundColor: COLORS.teal[50] }]}>
              <MaterialIcons name="insights" size={18} color={COLORS.primaryDark} />
            </View>
            <View style={styles.salesCardTitles}>
              <Text style={styles.salesCardTitle}>Sales Overview</Text>
              <Text style={styles.salesCardSubtitle}>Business performance at a glance</Text>
            </View>
          </View>
          <View style={styles.salesDonutWrap}>
            <RingGauge percent={salesOverview.revenuePercent} color={COLORS.primaryDark} size={108}>
              <View style={styles.salesDonutCenter}>
                <Text
                  style={styles.salesDonutValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  {formatMoneyCompact(salesOverview.todaySales)}
                </Text>
                <Text style={styles.salesDonutLabel}>today</Text>
              </View>
            </RingGauge>
            <View style={styles.salesLegend}>
              <SalesLegendRow
                color={COLORS.primaryDark}
                label="Today's Sales"
                value={formatMoneyCompact(salesOverview.todaySales)}
              />
              <SalesLegendRow
                color={COLORS.info}
                label="Total Revenue"
                value={formatMoneyCompact(salesOverview.revenue)}
              />
              <SalesLegendRow
                color={COLORS.primaryDark}
                label="Orders"
                value={formatCount(salesOverview.ordersCount)}
              />
              <SalesLegendRow
                color={salesOverview.lowStockCount > 0 ? COLORS.warning : COLORS.success}
                label="Low Stock"
                value={formatCount(salesOverview.lowStockCount)}
              />
            </View>
          </View>
        </Card>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Recent Orders</Text>
          <TouchableOpacity onPress={() => router.push('/orders')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {filteredOrders.length > 0 ? (
          <View style={styles.recentList}>{filteredOrders.map(renderRecentOrder)}</View>
        ) : (
          <EmptyState
            icon={<MaterialIcons name="receipt-long" size={28} color={COLORS.gray[400]} />}
            title={orderFilter ? 'No matching orders' : 'No orders yet'}
            subtitle={orderFilter ? 'Try a different status.' : 'New orders from your customers will appear here.'}
            actionTitle="Go to Orders"
            onAction={() => router.push('/orders')}
          />
        )}
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
  notifButton: {
    width: 26,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: FONTS.size.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
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
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primaryDark,
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
  chipTile: {
    width: 64,
    alignItems: 'center',
    gap: 4,
  },
  chipIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.teal[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipIconWrapActive: {
    backgroundColor: COLORS.primaryDark,
  },
  chipLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  chipLabelActive: {
    color: COLORS.primaryDark,
    fontFamily: FONTS.semibold,
  },
  salesCard: {
    marginTop: SPACING.sm,
  },
  salesCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  salesCardIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  salesCardTitles: {
    flex: 1,
  },
  salesCardTitle: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  salesCardSubtitle: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 2,
  },
  salesDonutWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  salesDonutCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 90,
  },
  salesDonutValue: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  salesDonutLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  salesLegend: {
    flex: 1,
    gap: SPACING.sm,
  },
  salesLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  salesLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  salesLegendLabel: {
    flex: 1,
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  salesLegendValue: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    marginLeft: SPACING.sm,
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
  viewAll: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.primaryDark,
  },
  recentList: {
    gap: SPACING.sm,
  },
  recentCard: {
    paddingVertical: SPACING.sm + 4,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  recentInfo: {
    flex: 1,
  },
  recentNumber: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  recentCustomer: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 2,
  },
  recentDate: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.regular,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  recentRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs + 2,
  },
});
