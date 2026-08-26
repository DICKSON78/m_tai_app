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
import api from '../../src/api/client';
import Badge from '../../src/components/Badge';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import SearchBar from '../../src/components/SearchBar';
import { COLORS, FONTS, SPACING } from '../../src/constants/theme';

interface AdminOrder {
  id: number;
  order_number?: string;
  total?: number;
  total_amount?: number;
  status?: string;
  created_at?: string;
  customer?: { name?: string } | string | null;
  customer_name?: string;
  business?: { name?: string } | string | null;
  business_name?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning,
  confirmed: COLORS.primary,
  completed: COLORS.success,
  cancelled: COLORS.error,
  delivered: COLORS.success,
  processing: '#5B8DEF',
};

function getStatusMeta(status?: string): { label: string; color: string } {
  const key = (status || '').toLowerCase();
  return {
    label: key
      ? key
          .split(/[_\s]+/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : 'Unknown',
    color: STATUS_COLORS[key] ?? COLORS.gray[500],
  };
}

function getCustomerName(order: AdminOrder): string {
  if (order.customer_name) return order.customer_name;
  if (typeof order.customer === 'string') return order.customer;
  if (order.customer && typeof order.customer === 'object' && order.customer.name) {
    return order.customer.name;
  }
  return 'Guest';
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatMoney(amount: number): string {
  return `TZS ${Math.round(amount).toLocaleString()}`;
}

function formatCount(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSeqRef = useRef(0);
  const searchMountedRef = useRef(false);

  const fetchOrders = useCallback(
    async (targetPage: number, mode: 'replace' | 'append') => {
      requestSeqRef.current += 1;
      const requestId = requestSeqRef.current;

      try {
        const params: Record<string, any> = {
          page: targetPage,
          per_page: 15,
        };
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (statusFilter) params.status = statusFilter;

        const res = await api.get('/admin/orders', { params });
        if (requestId !== requestSeqRef.current) return;

        const result = normalizePaginated<AdminOrder>(res.data);
        setPage(result.currentPage);
        setLastPage(result.lastPage);
        setTotalResults(result.total);
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
    [searchQuery, statusFilter]
  );

  useEffect(() => {
    fetchOrders(1, 'replace');
  }, [statusFilter, fetchOrders]);

  useEffect(() => {
    if (!searchMountedRef.current) {
      searchMountedRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      setRefreshing(true);
      fetchOrders(1, 'replace');
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchOrders]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(1, 'replace');
  }, [fetchOrders]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || refreshing || initialLoading || page >= lastPage || error) return;
    setLoadingMore(true);
    fetchOrders(page + 1, 'append');
  }, [loadingMore, refreshing, initialLoading, page, lastPage, error, fetchOrders]);

  const renderOrderCard = useCallback(({ item }: { item: AdminOrder }) => {
    const status = getStatusMeta(item.status);
    const customerName = getCustomerName(item);
    const total = item.total ?? item.total_amount ?? 0;

    return (
      <Card style={styles.orderCard}>
        <View style={styles.cardTop}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber} numberOfLines={1}>
              #{item.order_number || item.id}
            </Text>
            <Text style={styles.customerName} numberOfLines={1}>
              {customerName}
            </Text>
          </View>
          <Badge label={status.label} color={status.color} size="sm" />
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.orderTotal}>{formatMoney(total)}</Text>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>
      </Card>
    );
  }, []);

  const listFooter = useMemo(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>Loading more orders...</Text>
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
          onAction={handleRefresh}
          style={styles.empty}
        />
      );
    }
    if (searchQuery.trim() || statusFilter) {
      return (
        <EmptyState
          title="No orders found"
          subtitle="No orders match your filters. Try adjusting them."
          style={styles.empty}
        />
      );
    }
    return (
      <EmptyState
        icon={<Text style={styles.emptyIcon}>🛒</Text>}
        title="No orders yet"
        subtitle="Platform orders will appear here as they come in."
        style={styles.empty}
      />
    );
  }, [initialLoading, loadingMore, error, searchQuery, statusFilter, handleRefresh]);

  const statusFilters = useMemo(
    () => [
      { value: '', label: 'All' },
      { value: 'pending', label: 'Pending' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
    []
  );

  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Orders"
        subtitle={
          totalResults !== null && !error
            ? `${formatCount(totalResults)} ${totalResults === 1 ? 'order' : 'orders'}`
            : undefined
        }
      />
      <View style={styles.searchWrap}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by order number or customer"
        />
        <View style={styles.filterRow}>
          {statusFilters.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setStatusFilter(f.value)}
              activeOpacity={0.7}
              style={[
                styles.filterChip,
                statusFilter === f.value && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === f.value && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item, index) =>
          item.id !== undefined ? String(item.id) : `order-${index}`
        }
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
        keyboardShouldPersistTaps="handled"
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
  searchWrap: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
    gap: SPACING.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.xs + 2,
  },
  filterChip: {
    paddingVertical: SPACING.xs + 1,
    paddingHorizontal: SPACING.sm + 4,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  orderCard: {
    gap: SPACING.sm + 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
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
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray[200],
    paddingTop: SPACING.sm + 2,
  },
  orderTotal: {
    fontSize: FONTS.size.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  orderDate: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
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
