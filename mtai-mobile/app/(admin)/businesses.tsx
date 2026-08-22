import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../src/api/client';
import Avatar from '../../src/components/Avatar';
import Badge from '../../src/components/Badge';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import SearchBar from '../../src/components/SearchBar';
import { COLORS, FONTS, SPACING } from '../../src/constants/theme';

interface AdminBusiness {
  id: number;
  name: string;
  status?: string;
  created_at?: string;
  owner_name?: string;
  owner?: { name?: string } | string | null;
  orders_count?: number;
}

const STATUS_COLORS: Record<string, string> = {
  active: COLORS.success,
  approved: COLORS.success,
  verified: COLORS.success,
  published: COLORS.success,
  pending: COLORS.warning,
  inactive: COLORS.warning,
  draft: COLORS.warning,
  unverified: COLORS.warning,
  suspended: COLORS.error,
  rejected: COLORS.error,
  blocked: COLORS.error,
  closed: COLORS.error,
  banned: COLORS.error,
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

function getOwnerName(business: AdminBusiness): string | null {
  if (business.owner_name) return business.owner_name;
  if (typeof business.owner === 'string') return business.owner;
  if (business.owner && typeof business.owner === 'object' && business.owner.name) {
    return business.owner.name;
  }
  return null;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `${month} ${date.getDate()}, ${date.getFullYear()}`;
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

export default function AdminBusinessesScreen() {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSeqRef = useRef(0);
  const searchMountedRef = useRef(false);

  const fetchBusinesses = useCallback(
    async (targetPage: number, mode: 'replace' | 'append') => {
      requestSeqRef.current += 1;
      const requestId = requestSeqRef.current;

      try {
        const res = await api.get('/admin/businesses', {
          params: { page: targetPage, search: searchQuery.trim() || undefined },
        });
        if (requestId !== requestSeqRef.current) return;

        const result = normalizePaginated<AdminBusiness>(res.data);
        setPage(result.currentPage);
        setLastPage(result.lastPage);
        setTotalResults(result.total);
        setBusinesses((prev) =>
          mode === 'append' && result.currentPage > 1
            ? [...prev, ...result.items]
            : result.items
        );
        setError(null);
      } catch (err: any) {
        if (requestId !== requestSeqRef.current) return;
        if (mode === 'replace') {
          setBusinesses([]);
          setError(
            err?.response?.data?.message ||
              err?.message ||
              'Something went wrong while loading businesses.'
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
    [searchQuery]
  );

  useEffect(() => {
    fetchBusinesses(1, 'replace');
  }, []);

  useEffect(() => {
    if (!searchMountedRef.current) {
      searchMountedRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      setRefreshing(true);
      fetchBusinesses(1, 'replace');
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchBusinesses]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBusinesses(1, 'replace');
  }, [fetchBusinesses]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || refreshing || initialLoading || page >= lastPage || error) return;
    setLoadingMore(true);
    fetchBusinesses(page + 1, 'append');
  }, [loadingMore, refreshing, initialLoading, page, lastPage, error, fetchBusinesses]);

  const renderBusinessCard = useCallback(({ item }: { item: AdminBusiness }) => {
    const status = getStatusMeta(item.status);
    const ownerName = getOwnerName(item);
    const ordersCount =
      typeof item.orders_count === 'number'
        ? item.orders_count
        : Array.isArray((item as any).orders)
          ? (item as any).orders.length
          : null;

    return (
      <Card style={styles.businessCard}>
        <View style={styles.cardHeader}>
          <Avatar name={item.name} size={44} />
          <View style={styles.headerInfo}>
            <Text style={styles.businessName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.ownerLine} numberOfLines={1}>
              {ownerName ? `Owner · ${ownerName}` : 'No owner assigned'}
            </Text>
          </View>
          <Badge label={status.label} color={status.color} size="sm" />
        </View>

        <View style={styles.cardFooter}>
          {item.created_at ? (
            <Text style={styles.metaText} numberOfLines={1}>
              Created {formatDate(item.created_at)}
            </Text>
          ) : (
            <View />
          )}
          {ordersCount !== null ? (
            <Badge
              label={`${formatCount(ordersCount)} ${ordersCount === 1 ? 'order' : 'orders'}`}
              color={COLORS.gray[100]}
              textColor={COLORS.gray[600]}
              size="sm"
            />
          ) : null}
        </View>
      </Card>
    );
  }, []);

  const listFooter = useMemo(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>Loading more businesses…</Text>
      </View>
    );
  }, [loadingMore]);

  const listEmpty = useMemo(() => {
    if (initialLoading || loadingMore) return null;
    if (error) {
      return (
        <EmptyState
          title="Failed to load businesses"
          subtitle={error}
          actionTitle="Try Again"
          onAction={handleRefresh}
          style={styles.empty}
        />
      );
    }
    if (searchQuery.trim()) {
      return (
        <EmptyState
          title="No businesses found"
          subtitle={`No businesses match "${searchQuery.trim()}".`}
          style={styles.empty}
        />
      );
    }
    return (
      <EmptyState
        icon={<Text style={styles.emptyIcon}>🏢</Text>}
        title="No businesses yet"
        subtitle="Businesses registered on M-TAI will appear here."
        style={styles.empty}
      />
    );
  }, [initialLoading, loadingMore, error, searchQuery, handleRefresh]);

  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Businesses"
        subtitle={
          totalResults !== null && !error
            ? `${formatCount(totalResults)} ${totalResults === 1 ? 'business' : 'businesses'}`
            : undefined
        }
      />
      <View style={styles.searchWrap}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search businesses or owners"
        />
      </View>
      <FlatList
        data={businesses}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderBusinessCard}
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

function formatCount(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  businessCard: {
    gap: SPACING.sm + 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  ownerLine: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray[200],
    paddingTop: SPACING.sm + 2,
  },
  metaText: {
    flexShrink: 1,
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
