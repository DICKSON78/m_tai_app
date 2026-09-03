import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../src/api/client';
import Badge from '../../src/components/Badge';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS, FONTS, SPACING } from '../../src/constants/theme';

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning,
  picked_up: '#8B5CF6',
  in_transit: '#5B8DEF',
  delivered: COLORS.success,
  cancelled: COLORS.error,
};

interface DeliveryItem {
  id: number;
  status: string;
  pickup_address: string;
  delivery_address: string;
  estimated_delivery?: string;
  order?: { id: number; order_number: string; total?: number };
}

function normalizePaginated<T>(payload: unknown): { items: T[]; currentPage: number; lastPage: number } {
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

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusMeta(status: string): { label: string; color: string } {
  const key = (status || '').toLowerCase();
  const color = STATUS_COLORS[key] ?? COLORS.gray[500];
  const label = key
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { label: label || 'Unknown', color };
}

export default function DeliveriesScreen() {
  const router = useRouter();

  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSeqRef = useRef(0);

  const fetchDeliveries = useCallback(async (targetPage: number, mode: 'replace' | 'append') => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;
    try {
      const res = await api.get('/customer/deliveries', { params: { page: targetPage } });
      if (requestId !== requestSeqRef.current) return;
      const result = normalizePaginated<DeliveryItem>(res.data);
      setPage(result.currentPage);
      setLastPage(result.lastPage);
      setDeliveries((prev) =>
        mode === 'append' && result.currentPage > 1 ? [...prev, ...result.items] : result.items
      );
      setError(null);
    } catch (err: any) {
      if (requestId !== requestSeqRef.current) return;
      if (mode === 'replace') {
        setDeliveries([]);
        setError(
          err?.response?.data?.message || err?.message || 'Could not load deliveries.'
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
    fetchDeliveries(1, 'replace');
  }, [fetchDeliveries]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDeliveries(1, 'replace');
  }, [fetchDeliveries]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || refreshing || initialLoading || page >= lastPage || error) return;
    setLoadingMore(true);
    fetchDeliveries(page + 1, 'append');
  }, [loadingMore, refreshing, initialLoading, page, lastPage, error, fetchDeliveries]);

  const handleRetry = useCallback(() => {
    setInitialLoading(true);
    fetchDeliveries(1, 'replace');
  }, [fetchDeliveries]);

  const openDelivery = useCallback(
    (id: number) => {
      router.push({ pathname: '/delivery-detail', params: { id: String(id) } });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: DeliveryItem }) => {
      const meta = statusMeta(item.status);
      const orderNumber = item.order?.order_number
        ? `#${item.order.order_number}`
        : `#${item.id}`;

      return (
        <Card style={styles.deliveryCard} onPress={() => openDelivery(item.id)}>
          <View style={styles.topRow}>
            <Text style={styles.orderNumber}>{orderNumber}</Text>
            <Badge label={meta.label} color={meta.color} size="sm" />
          </View>
          <View style={styles.addressRow}>
            <Text style={styles.addressLabel}>To</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {item.delivery_address}
            </Text>
          </View>
          {item.estimated_delivery ? (
            <View style={styles.etaRow}>
              <Text style={styles.etaLabel}>Estimated</Text>
              <Text style={styles.etaValue}>{formatDate(item.estimated_delivery)}</Text>
            </View>
          ) : null}
        </Card>
      );
    },
    [openDelivery]
  );

  const listFooter = useMemo(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>Loading more…</Text>
      </View>
    );
  }, [loadingMore]);

  const listEmpty = useMemo(() => {
    if (initialLoading || loadingMore) return null;
    if (error) {
      return (
        <EmptyState
          title="Failed to load deliveries"
          subtitle={error}
          actionTitle="Try Again"
          onAction={handleRetry}
          style={styles.empty}
        />
      );
    }
    return (
      <EmptyState
        icon={<MaterialIcons name="local-shipping" size={32} color={COLORS.gray[400]} />}
        title="No deliveries yet"
        subtitle="Your deliveries will appear here once an order is shipped."
        style={styles.empty}
      />
    );
  }, [initialLoading, loadingMore, error, handleRetry]);

  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="My Deliveries" />

      <FlatList
        data={deliveries}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
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
  deliveryCard: {
    gap: SPACING.sm + 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  orderNumber: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  addressLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    color: COLORS.gray[400],
  },
  addressText: {
    flex: 1,
    fontSize: FONTS.size.sm,
    color: COLORS.text,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  etaLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    color: COLORS.gray[400],
  },
  etaValue: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
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
});
