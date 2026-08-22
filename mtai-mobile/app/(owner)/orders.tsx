import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../src/api/client';
import { Order } from '../../src/api/types';
import Avatar from '../../src/components/Avatar';
import Badge from '../../src/components/Badge';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';

type StatusFilter = 'all' | 'pending' | 'processing' | 'completed';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'completed', label: 'Completed' },
];

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

interface PageResult<T> {
  items: T[];
  currentPage: number;
  lastPage: number;
  total: number;
}

function normalizePaginated<T>(payload: unknown): PageResult<T> {
  const body = payload as Record<string, any> | null;
  const paginated =
    body && typeof body === 'object' && Array.isArray(body.data?.data) ? body.data : body;
  const items: T[] = Array.isArray(paginated?.data) ? paginated.data : [];
  return {
    items,
    currentPage: typeof paginated?.current_page === 'number' ? paginated.current_page : 1,
    lastPage: typeof paginated?.last_page === 'number' ? paginated.last_page : 1,
    total: typeof paginated?.total === 'number' ? paginated.total : items.length,
  };
}

const EMPTY_COPY: Record<StatusFilter, { title: string; subtitle: string }> = {
  all: {
    title: 'No orders yet',
    subtitle: 'Orders placed by customers will appear here.',
  },
  pending: {
    title: 'No pending orders',
    subtitle: 'Newly placed orders waiting for action will show up here.',
  },
  processing: {
    title: 'No processing orders',
    subtitle: 'Orders currently being prepared will appear here.',
  },
  completed: {
    title: 'No completed orders',
    subtitle: 'Delivered and completed orders will appear here.',
  },
};

export default function OwnerOrdersScreen() {
  const router = useRouter();

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSeqRef = useRef(0);

  const fetchOrders = useCallback(
    async (targetPage: number, mode: 'replace' | 'append') => {
      requestSeqRef.current += 1;
      const requestId = requestSeqRef.current;

      try {
        const params: Record<string, string | number> = { page: targetPage };
        if (filter !== 'all') {
          params.status = filter;
        }
        const res = await api.get('/orders', { params });
        if (requestId !== requestSeqRef.current) return;

        const result = normalizePaginated<Order>(res.data);
        setPage(result.currentPage);
        setLastPage(result.lastPage);
        setTotalCount(result.total);
        setOrders((prev) =>
          mode === 'append' && result.currentPage > 1
            ? [...prev, ...result.items]
            : result.items
        );
        setError(null);
      } catch (err: any) {
        if (requestId !== requestSeqRef.current) return;
        if (mode === 'replace') {
          setOrders([]);
          setError(
            err?.response?.data?.message ||
              err?.message ||
              'Something went wrong while loading orders.'
          );
        }
      } finally {
        if (requestId === requestSeqRef.current) {
          setInitialLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [filter]
  );

  useEffect(() => {
    fetchOrders(1, 'replace');
  }, [fetchOrders]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(1, 'replace');
  }, [fetchOrders]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || refreshing || initialLoading || page >= lastPage || error) return;
    setLoadingMore(true);
    fetchOrders(page + 1, 'append');
  }, [loadingMore, refreshing, initialLoading, page, lastPage, error, fetchOrders]);

  const handleRetry = useCallback(() => {
    setInitialLoading(true);
    fetchOrders(1, 'replace');
  }, [fetchOrders]);

  const openOrder = useCallback(
    (order: Order) => {
      router.push({
        pathname: '/order-detail',
        params: { id: String(order.id) },
      });
    },
    [router]
  );

  const renderSegmentedControl = useCallback(
    () => (
      <View style={styles.segmentWrap}>
        <View style={styles.segment}>
          {FILTERS.map(({ key, label }) => {
            const isActive = filter === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setFilter(key)}
                activeOpacity={0.8}
                style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    ),
    [filter]
  );

  const renderOrderCard = useCallback(
    ({ item }: { item: Order }) => {
      const meta = getStatusMeta(item.status);
      const customerName = item.customer?.name ?? 'Walk-in Customer';
      const itemCount =
        item.items_count ??
        (Array.isArray((item as any).items) ? (item as any).items.length : undefined);

      return (
        <Card style={styles.orderCard} onPress={() => openOrder(item)}>
          <View style={styles.orderTopRow}>
            <Avatar uri={item.customer?.avatar} name={customerName} size={40} />
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>#{item.order_number}</Text>
              <Text style={styles.customerName} numberOfLines={1}>
                {customerName}
              </Text>
            </View>
            <Badge label={meta.label} color={meta.color} size="sm" />
          </View>

          <View style={styles.orderMetaRow}>
            <Text style={styles.metaDate}>{formatDate(item.created_at)}</Text>
            {typeof itemCount === 'number' ? (
              <Text style={styles.metaItems}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Text>
            ) : null}
            <PriceTag price={item.total} size="md" style={styles.orderTotal} />
          </View>
        </Card>
      );
    },
    [openOrder]
  );

  const listFooter = useMemo(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>Loading more orders…</Text>
      </View>
    );
  }, [loadingMore]);

  const listEmpty = useMemo(() => {
    if (initialLoading || loadingMore) return null;
    if (error) {
      return (
        <EmptyState
          title="Failed to load orders"
          subtitle={error}
          actionTitle="Try Again"
          onAction={handleRetry}
          style={styles.empty}
        />
      );
    }
    const copy = EMPTY_COPY[filter];
    return (
      <EmptyState
        icon={<Text style={styles.emptyIcon}>📦</Text>}
        title={copy.title}
        subtitle={copy.subtitle}
        actionTitle="Refresh"
        onAction={handleRefresh}
        style={styles.empty}
      />
    );
  }, [initialLoading, loadingMore, error, filter, handleRetry, handleRefresh]);

  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Orders"
        subtitle={totalCount > 0 ? `${totalCount} ${totalCount === 1 ? 'order' : 'orders'}` : undefined}
      />
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrderCard}
        ListHeaderComponent={renderSegmentedControl}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        contentContainerStyle={
          orders.length === 0 ? styles.listContentEmpty : styles.listContent
        }
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  segmentWrap: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.full,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  segmentText: {
    fontSize: FONTS.size.xs + 1,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  segmentTextActive: {
    color: COLORS.primaryDark,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  orderCard: {
    gap: SPACING.sm + 2,
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  customerName: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  orderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray[200],
    paddingTop: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  metaDate: {
    fontSize: FONTS.size.xs,
    color: COLORS.gray[400],
    fontWeight: '500',
  },
  metaItems: {
    fontSize: FONTS.size.xs,
    color: COLORS.gray[400],
    fontWeight: '500',
  },
  orderTotal: {
    marginLeft: 'auto',
  },
  footer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 32,
  },
});
