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
import { Order } from '../../src/api/types';
import { useAuthStore } from '../../src/store/authStore';
import Avatar from '../../src/components/Avatar';
import Badge from '../../src/components/Badge';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';

const MAX_RECENT_ORDERS = 5;

interface Accent {
  bg: string;
  text: string;
}

const ACCENTS: Record<string, Accent> = {
  sales: { bg: COLORS.primaryLight, text: COLORS.primaryDark },
  revenue: { bg: 'rgba(91, 141, 239, 0.14)', text: '#5B8DEF' },
  orders: { bg: 'rgba(139, 92, 246, 0.14)', text: '#8B5CF6' },
  lowAlert: { bg: COLORS.red[100], text: COLORS.red[700] },
  lowOk: { bg: COLORS.green[100], text: COLORS.green[700] },
};

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning,
  confirmed: '#5B8DEF',
  accepted: '#5B8DEF',
  processing: '#5B8DEF',
  preparing: COLORS.warning,
  packed: '#5B8DEF',
  ready: '#5B8DEF',
  shipped: '#8B5CF6',
  out_for_delivery: '#8B5CF6',
  en_route: '#8B5CF6',
  delivering: '#8B5CF6',
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

function pickString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return undefined;
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
  const withSeparators = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `TZS ${withSeparators}`;
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

function SummaryCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: string;
  value: string;
  label: string;
  accent: Accent;
}) {
  return (
    <Card style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: accent.bg }]}>
        <Text style={styles.summaryIconText}>{icon}</Text>
      </View>
      <Text
        style={[styles.summaryValue, { color: accent.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {value}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </Card>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickTile} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.quickIconCircle}>
        <Text style={styles.quickIcon}>{icon}</Text>
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function OwnerDashboardScreen() {
  const user = useAuthStore((state) => state.user);

  const [businessName, setBusinessName] = useState('');
  const [todaySales, setTodaySales] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await api.get('/dashboard/owner');
      const data = normalizeObject(res.data);
      setTodaySales(
        pickNumber(data, ['today_sales', 'todaySales', 'todays_sales', 'sales_today'])
      );
      setRevenue(pickNumber(data, ['total_revenue', 'revenue', 'totalRevenue']));
      setOrdersCount(
        pickNumber(data, ['orders_count', 'ordersCount', 'orders_today', 'total_orders'])
      );
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
      const businessFromObject =
        business && typeof business.name === 'string' ? business.name : '';
      setBusinessName(
        pickString(data, ['business_name', 'businessName']) ?? businessFromObject
      );
      const recent = pickArray<Order>(data, ['recent_orders', 'recentOrders', 'latest_orders']);
      if (recent.length > 0) {
        setRecentOrders(recent.slice(0, MAX_RECENT_ORDERS));
      } else {
        setRecentOrders(await fetchFallbackOrders());
      }
    } catch (err) {
      setLoadError(extractErrorMessage(err, 'Could not load your dashboard.'));
    }
  }, []);

  useEffect(() => {
    loadDashboard().finally(() => setInitialLoading(false));
  }, [loadDashboard]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  const goToOrders = useCallback(() => {
    router.push('/(owner)/orders');
  }, []);

  const goToReports = useCallback(() => {
    router.push('/(owner)/reports');
  }, []);

  const goToProfile = useCallback(() => {
    router.push('/(owner)/profile');
  }, []);

  const openOrder = useCallback((order: Order) => {
    router.push({
      pathname: '/order-detail',
      params: { id: String(order.id) },
    });
  }, []);

  const handleInventory = useCallback(() => {
    Alert.alert(
      'Inventory',
      'Full inventory management is coming soon. Low-stock alerts are shown on your dashboard.'
    );
  }, []);

  const renderRecentOrder = (order: Order) => {
    const meta = getStatusMeta(order.status);
    const customerName = order.customer?.name ?? 'Walk-in Customer';
    return (
      <Card key={order.id} style={styles.recentCard} onPress={() => openOrder(order)}>
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
  };

  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Dashboard"
        subtitle={businessName || 'Business Overview'}
        rightAction={
          <TouchableOpacity onPress={goToProfile} activeOpacity={0.7}>
            <Avatar uri={user?.avatar} name={user?.name ?? 'Owner'} size={36} />
          </TouchableOpacity>
        }
      />
      {loadError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity
            onPress={handleRefresh}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
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
        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="💰"
            value={formatTZS(todaySales)}
            label="Today's Sales"
            accent={ACCENTS.sales}
          />
          <SummaryCard
            icon="📈"
            value={formatTZS(revenue)}
            label="Revenue"
            accent={ACCENTS.revenue}
          />
          <SummaryCard
            icon="🧾"
            value={String(ordersCount)}
            label="Orders"
            accent={ACCENTS.orders}
          />
          <SummaryCard
            icon="⚠️"
            value={String(lowStockCount)}
            label="Low Stock Alerts"
            accent={lowStockCount > 0 ? ACCENTS.lowAlert : ACCENTS.lowOk}
          />
        </View>

        <View style={styles.quickActions}>
          <QuickAction icon="🛒" label="New Order" onPress={goToOrders} />
          <QuickAction icon="📊" label="View Reports" onPress={goToReports} />
          <QuickAction icon="🏷️" label="Inventory" onPress={handleInventory} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={goToOrders} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <EmptyState
            icon={<Text style={styles.emptyIcon}>🧾</Text>}
            title="No orders yet"
            subtitle="New orders from your customers will appear here."
            actionTitle="Go to Orders"
            onAction={goToOrders}
          />
        ) : (
          <View style={styles.recentList}>{recentOrders.map(renderRecentOrder)}</View>
        )}
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
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl + SPACING.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.red[100],
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  errorText: {
    flex: 1,
    color: COLORS.red[700],
    fontSize: FONTS.size.sm,
    marginRight: SPACING.sm,
  },
  retryText: {
    color: COLORS.red[700],
    fontSize: FONTS.size.sm,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
  },
  summaryCard: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryIconText: {
    fontSize: FONTS.size.xl - 2,
  },
  summaryValue: {
    fontSize: FONTS.size.xl,
    fontWeight: '800',
    marginTop: SPACING.sm + 2,
  },
  summaryLabel: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.xs,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  quickTile: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  quickIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickIcon: {
    fontSize: FONTS.size.xl - 2,
  },
  quickLabel: {
    fontSize: FONTS.size.sm,
    fontWeight: '600',
    color: COLORS.gray[700],
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm + 2,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  viewAll: {
    fontSize: FONTS.size.sm,
    fontWeight: '700',
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
    fontWeight: '700',
    color: COLORS.text,
  },
  recentCustomer: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  recentDate: {
    fontSize: FONTS.size.xs,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  recentRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs + 2,
  },
  emptyIcon: {
    fontSize: 32,
  },
});
