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
import { User } from '../../src/api/types';
import Avatar from '../../src/components/Avatar';
import Badge from '../../src/components/Badge';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import SearchBar from '../../src/components/SearchBar';
import { COLORS, FONTS, SPACING } from '../../src/constants/theme';

const ROLE_COLORS: Record<string, string> = {
  admin: COLORS.secondary,
  business_owner: '#8B5CF6',
  employee: '#5B8DEF',
  transporter: COLORS.warning,
  customer: COLORS.success,
};

interface AdminUser extends User {
  created_at?: string;
}

function getRoleMeta(role?: string): { label: string; color: string } {
  const key = (role || '').toLowerCase();
  return {
    label: key
      ? key
          .split(/[_\s]+/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : 'Unknown',
    color: ROLE_COLORS[key] ?? COLORS.gray[500],
  };
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const month = date.toLocaleString('en-US', { month: 'short' });
  return `Joined ${month} ${date.getDate()}, ${date.getFullYear()}`;
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

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
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

  const fetchUsers = useCallback(
    async (targetPage: number, mode: 'replace' | 'append') => {
      requestSeqRef.current += 1;
      const requestId = requestSeqRef.current;

      try {
        const res = await api.get('/admin/users', {
          params: { page: targetPage, search: searchQuery.trim() || undefined },
        });
        if (requestId !== requestSeqRef.current) return;

        const result = normalizePaginated<AdminUser>(res.data);
        setPage(result.currentPage);
        setLastPage(result.lastPage);
        setTotalResults(result.total);
        setUsers((prev) =>
          mode === 'append' && result.currentPage > 1
            ? [...prev, ...result.items]
            : result.items
        );
        setError(null);
      } catch (err: any) {
        if (requestId !== requestSeqRef.current) return;
        if (mode === 'replace') {
          setUsers([]);
          setError(
            err?.response?.data?.message ||
              err?.message ||
              'Something went wrong while loading users.'
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
    fetchUsers(1, 'replace');
  }, []);

  useEffect(() => {
    if (!searchMountedRef.current) {
      searchMountedRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      setRefreshing(true);
      fetchUsers(1, 'replace');
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchUsers]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers(1, 'replace');
  }, [fetchUsers]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || refreshing || initialLoading || page >= lastPage || error) return;
    setLoadingMore(true);
    fetchUsers(page + 1, 'append');
  }, [loadingMore, refreshing, initialLoading, page, lastPage, error, fetchUsers]);

  const renderUserCard = useCallback(({ item }: { item: AdminUser }) => {
    const role = getRoleMeta(item.role);

    return (
      <Card style={styles.userCard}>
        <View style={styles.cardHeader}>
          <Avatar uri={item.avatar} name={item.name} size={44} />
          <View style={styles.headerInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
          <Badge label={role.label} color={role.color} size="sm" />
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.metaText} numberOfLines={1}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </Card>
    );
  }, []);

  const listFooter = useMemo(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>Loading more users…</Text>
      </View>
    );
  }, [loadingMore]);

  const listEmpty = useMemo(() => {
    if (initialLoading || loadingMore) return null;
    if (error) {
      return (
        <EmptyState
          title="Failed to load users"
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
          title="No users found"
          subtitle={`No users match "${searchQuery.trim()}".`}
          style={styles.empty}
        />
      );
    }
    return (
      <EmptyState
        icon={<Text style={styles.emptyIcon}>👥</Text>}
        title="No users yet"
        subtitle="People who join M-TAI will appear here."
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
        title="Users"
        subtitle={
          totalResults !== null && !error
            ? `${formatCount(totalResults)} ${totalResults === 1 ? 'user' : 'users'}`
            : undefined
        }
      />
      <View style={styles.searchWrap}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name or email"
        />
      </View>
      <FlatList
        data={users}
        keyExtractor={(item, index) =>
          item.id !== undefined ? String(item.id) : `user-${index}`
        }
        renderItem={renderUserCard}
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
  userCard: {
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
  userName: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
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
