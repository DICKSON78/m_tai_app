import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../src/api/client';
import { Order } from '../../src/api/types';
import Badge from '../../src/components/Badge';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, SPACING } from '../../src/constants/theme';

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
  };
}

export default function OrdersScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSeqRef = useRef(0);

  const fetchOrders = useCallback(async (targetPage: number, mode: 'replace' | 'append') => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;

    try {
      const res = await api.get('/customer/orders', { params: { page: targetPage } });
      if (requestId !== requestSeqRef.current) return;

      const result = normalizePaginated<Order>(res.data);
      setPage(result.currentPage);
      setLastPage(result.lastPage);
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
            'Something went wrong while loading your orders.'
        );
      }
    } finally {
      if (requestId === requestSeqRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  }, []);

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
      router.push({ pathname: '/order-detail', params: { id: String(order.id) } });
    },
    [router]
  );

  const renderOrderCard = useCallback(
    ({ item }: { item: Order }) => {
      const status = getStatusMeta(item.status);
      const itemCount =
        item.items_count ?? (Array.isArray((item as any).items) ? (item as any).items.length : undefined);

      return (
        <Card style={styles.orderCard} onPress={() => openOrder(item)}>
          <View style={styles.orderTopRow}>
            <Text style={styles.orderNumber}>#{item.order_number}</Text>
            <Badge label={status.label} color={status.color} size="sm" />
          </View>

          <View style={styles.orderMetaRow}>
            <View style={styles.orderMeta}>
              <Text style={styles.metaLabel}>Placed</Text>
              <Text style={styles.metaValue}>{formatDate(item.created_at)}</Text>
            </View>
            {typeof itemCount === 'number' ? (
              <View style={styles.orderMeta}>
                <Text style={styles.metaLabel}>Items</Text>
                <Text style={styles.metaValue}>{itemCount}</Text>
              </View>
            ) : null}
            <View style={[styles.orderMeta, styles.orderTotal]}>
              <Text style={styles.metaLabel}>Total</Text>
              <PriceTag price={item.total} size="md" />
            </View>
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
    return (
      <EmptyState
        icon={<Text style={styles.emptyIcon}>📦</Text>}
        title="No orders yet"
        subtitle="When you place an order it will show up here."
        actionTitle="Start Shopping"
        onAction={() => router.push('/')}
        style={styles.empty}
      />
    );
  }, [initialLoading, loadingMore, error, handleRetry, router]);

  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="My Orders" />

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
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
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  orderCard: {
    gap: SPACING.sm + 2,
  },
  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  orderNumber: {
    flexShrink: 1,
    fontSize: FONTS.size.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  orderMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  orderMeta: {
    marginRight: SPACING.lg,
  },
  orderTotal: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: 0,
  },
  metaLabel: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.gray[400],
    marginBottom: 2,
  },
  metaValue: {
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.text,
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
