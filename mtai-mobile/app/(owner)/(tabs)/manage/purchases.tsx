import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../../../src/api/client';
import Badge from '../../../../src/components/Badge';
import Card from '../../../../src/components/Card';
import EmptyState from '../../../../src/components/EmptyState';
import Header from '../../../../src/components/Header';
import PriceTag from '../../../../src/components/PriceTag';
import SearchBar from '../../../../src/components/SearchBar';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../../../src/constants/theme';

const SEARCH_DEBOUNCE_MS = 300;

interface Supplier {
  id: number;
  name: string;
}

interface PurchaseOrder {
  id: number;
  order_number?: string;
  status: string;
  total: number;
  created_at: string;
  supplier?: Supplier;
  items_count?: number;
}

type StatusFilter = 'all' | 'draft' | 'ordered' | 'received' | 'cancelled';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'ordered', label: 'Ordered' },
  { key: 'received', label: 'Received' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: COLORS.gray[400],
  pending: COLORS.warning,
  ordered: COLORS.info,
  confirmed: COLORS.info,
  shipped: COLORS.primaryDark,
  received: COLORS.success,
  completed: COLORS.success,
  cancelled: COLORS.error,
  canceled: COLORS.error,
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

function extractId(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const obj = body as Record<string, unknown>;
  const data = obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : obj;
  const id = data.id ?? data.business_id ?? data.businessId;
  return id != null ? String(id) : null;
}

function extractArray(body: unknown): unknown[] {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  const obj = body as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data;
  if (obj.data && typeof obj.data === 'object') {
    const inner = obj.data as Record<string, unknown>;
    if (Array.isArray(inner.data)) return inner.data;
  }
  return [];
}

function normalizeSupplier(raw: unknown): Supplier | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  const id = s.id ?? s.supplier_id;
  if (id == null) return null;
  return {
    id: Number(id),
    name: String(s.name ?? s.supplier_name ?? 'Unknown supplier'),
  };
}

function normalizePurchaseOrder(raw: unknown): PurchaseOrder | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const id = p.id ?? p.purchase_order_id;
  if (id == null) return null;
  const totalRaw = p.total ?? p.total_amount ?? p.amount ?? 0;
  const total = typeof totalRaw === 'number' ? totalRaw : Number(totalRaw) || 0;
  const supplier = normalizeSupplier(p.supplier) ?? undefined;
  return {
    id: Number(id),
    order_number: p.order_number != null ? String(p.order_number) : undefined,
    status: String(p.status ?? 'draft'),
    total,
    created_at: String(p.created_at ?? p.date ?? ''),
    supplier,
    items_count: typeof p.items_count === 'number' ? p.items_count : undefined,
  };
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

function formatTZS(amount: number): string {
  const rounded = Math.round(amount);
  const withSeparators = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `TZS ${withSeparators}`;
}

interface Accent {
  bg: string;
  text: string;
}

const ACCENTS: Record<string, Accent> = {
  suppliers: { bg: 'rgba(91, 141, 239, 0.14)', text: COLORS.info },
  pending: { bg: 'rgba(245, 158, 11, 0.14)', text: COLORS.warning },
  spent: { bg: COLORS.primaryLight, text: COLORS.primaryDark },
};

function SummaryCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
  label: string;
  accent: Accent;
}) {
  return (
    <Card style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: accent.bg }]}>
        <MaterialIcons name={icon} size={22} color={accent.text} />
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

export default function OwnerPurchasesScreen() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [searchText, setSearchText] = useState('');
  const [query, setQuery] = useState('');

  const requestSeqRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchText.trim().toLowerCase()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchData = useCallback(async () => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;

    const [suppliersRes, ordersRes] = await Promise.allSettled([
      api.get('/owner/purchases/suppliers'),
      api.get('/owner/purchases/orders'),
    ]);

    if (requestId !== requestSeqRef.current) return;

    if (suppliersRes.status === 'fulfilled') {
      const rawSuppliers = extractArray(suppliersRes.value.data);
      const normalizedSuppliers: Supplier[] = [];
      rawSuppliers.forEach((raw) => {
        const s = normalizeSupplier(raw);
        if (s) normalizedSuppliers.push(s);
      });
      setSuppliers(normalizedSuppliers);
    }

    if (ordersRes.status === 'fulfilled') {
      const rawOrders = extractArray(ordersRes.value.data);
      const normalizedOrders: PurchaseOrder[] = [];
      rawOrders.forEach((raw) => {
        const po = normalizePurchaseOrder(raw);
        if (po) normalizedOrders.push(po);
      });
      setOrders(normalizedOrders);
    }

    const failed = [suppliersRes, ordersRes].filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      const reason = failed[0].reason as { response?: { data?: { message?: string } }; message?: string };
      setError(reason?.response?.data?.message || reason?.message || 'Something went wrong while loading purchases.');
    } else {
      setError(null);
    }

    setInitialLoading(false);
    setRefreshing(false);
  }, []);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleRetry = useCallback(() => {
    setInitialLoading(true);
    setError(null);
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    let result = orders;

    if (filter !== 'all') {
      result = result.filter((o) => o.status.toLowerCase() === filter);
    }

    if (query) {
      result = result.filter((o) => {
        const supplierName = o.supplier?.name ?? '';
        const orderNum = o.order_number ?? '';
        return [supplierName, orderNum, o.status]
          .some((field) => field.toLowerCase().includes(query));
      });
    }

    return result;
  }, [orders, filter, query]);

  const summary = useMemo(() => {
    const pendingCount = orders.filter(
      (o) => o.status.toLowerCase() === 'ordered' || o.status.toLowerCase() === 'draft' || o.status.toLowerCase() === 'pending'
    ).length;
    const totalSpent = orders
      .filter((o) => o.status.toLowerCase() === 'received' || o.status.toLowerCase() === 'completed')
      .reduce((sum, o) => sum + o.total, 0);
    return {
      totalSuppliers: suppliers.length,
      pendingCount,
      totalSpent,
    };
  }, [orders, suppliers]);

  const handleFilterChange = useCallback((key: StatusFilter) => {
    setFilter(key);
  }, []);

  const renderSegmentedControl = useCallback(
    () => (
      <View style={styles.segmentWrap}>
        <View style={styles.segment}>
          {FILTERS.map(({ key, label }) => {
            const isActive = filter === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => handleFilterChange(key)}
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
    [filter, handleFilterChange]
  );

  const renderOrderCard = useCallback(
    ({ item }: { item: PurchaseOrder }) => {
      const meta = getStatusMeta(item.status);
      const supplierName = item.supplier?.name ?? 'Unknown Supplier';

      return (
        <Card style={styles.orderCard}>
          <View style={styles.orderTopRow}>
            <View style={styles.supplierAvatar}>
              <Text style={styles.supplierInitial}>
                {supplierName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.orderInfo}>
              <Text style={styles.supplierName} numberOfLines={1}>
                {supplierName}
              </Text>
              {item.order_number ? (
                <Text style={styles.orderNumber}>#{item.order_number}</Text>
              ) : null}
            </View>
            <Badge label={meta.label} color={meta.color} size="sm" />
          </View>

          <View style={styles.orderMetaRow}>
            <Text style={styles.metaDate}>{formatDate(item.created_at)}</Text>
            {typeof item.items_count === 'number' ? (
              <Text style={styles.metaItems}>
                {item.items_count} {item.items_count === 1 ? 'item' : 'items'}
              </Text>
            ) : null}
            <PriceTag price={item.total} size="md" style={styles.orderTotal} />
          </View>
        </Card>
      );
    },
    []
  );

  const listEmpty = useMemo(() => {
    if (initialLoading || refreshing) return null;
    if (error) {
      return (
        <EmptyState
          title="Failed to load purchases"
          subtitle={error}
          actionTitle="Try Again"
          onAction={handleRetry}
          style={styles.empty}
        />
      );
    }
    if (orders.length === 0) {
      return (
        <EmptyState
          icon={<MaterialIcons name="shopping-cart" size={28} color={COLORS.gray[400]} />}
          title="No purchase orders"
          subtitle="Purchase orders from your suppliers will appear here."
          style={styles.empty}
        />
      );
    }
    return (
      <EmptyState
        icon={<MaterialIcons name="search-off" size={28} color={COLORS.gray[400]} />}
        title="No matches"
        subtitle={`Nothing found for "${searchText.trim()}". Try a different search or filter.`}
        actionTitle="Clear Search"
        onAction={() => setSearchText('')}
        style={styles.empty}
      />
    );
  }, [initialLoading, refreshing, error, orders.length, searchText, handleRetry]);

  const listHeader = useMemo(
    () => (
      <>
        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="storefront"
            value={String(summary.totalSuppliers)}
            label="Suppliers"
            accent={ACCENTS.suppliers}
          />
          <SummaryCard
            icon="hourglass-empty"
            value={String(summary.pendingCount)}
            label="Pending"
            accent={ACCENTS.pending}
          />
          <SummaryCard
            icon="payments"
            value={formatTZS(summary.totalSpent)}
            label="Total Spent"
            accent={ACCENTS.spent}
          />
        </View>

        <View style={styles.searchWrap}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search supplier or order…"
            style={styles.searchBar}
          />
        </View>

        {renderSegmentedControl()}
      </>
    ),
    [summary, searchText, renderSegmentedControl]
  );

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Purchases" onBack={() => router.back()} />
        <View style={styles.initialLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.initialLoadingText}>Loading purchases…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Purchases"
        subtitle={`${orders.length} order${orders.length === 1 ? '' : 's'} · ${suppliers.length} supplier${suppliers.length === 1 ? '' : 's'}`}
        onBack={() => router.back()}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderOrderCard}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={
          filtered.length === 0 ? styles.listContentEmpty : styles.listContent
        }
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
  initialLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  initialLoadingText: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  summaryCard: {
    flexBasis: '30%',
    flexGrow: 1,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FONTS.size.xl - 2,
    fontFamily: FONTS.bold,
    marginTop: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.xs,
  },
  searchWrap: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  searchBar: {
    flex: 1,
  },
  segmentWrap: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
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
    fontFamily: FONTS.semibold,
    color: COLORS.textLight,
  },
  segmentTextActive: {
    color: COLORS.primaryDark,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.sm + 4,
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
  supplierAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supplierInitial: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  orderInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  orderNumber: {
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
    fontFamily: FONTS.medium,
  },
  metaItems: {
    fontSize: FONTS.size.xs,
    color: COLORS.gray[400],
    fontFamily: FONTS.medium,
  },
  orderTotal: {
    marginLeft: 'auto',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
  },
});
