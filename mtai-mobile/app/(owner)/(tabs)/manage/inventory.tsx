import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import SearchBar from '../../../../src/components/SearchBar';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../../../src/constants/theme';

const SEARCH_DEBOUNCE_MS = 300;

interface ProductItem {
  id: number;
  name: string;
  sku?: string;
  quantity: number;
  low_stock_threshold: number;
  location?: string;
}

interface StockStatus {
  label: string;
  bg: string;
  text: string;
}

function getStockStatus(quantity: number, threshold: number): StockStatus {
  if (quantity <= 0) {
    return { label: 'Out of Stock', bg: COLORS.red[100], text: COLORS.red[700] };
  }
  if (quantity <= threshold) {
    return { label: 'Low Stock', bg: 'rgba(245, 158, 11, 0.14)', text: '#92400E' };
  }
  return { label: 'In Stock', bg: COLORS.green[100], text: COLORS.green[700] };
}

function extractArray(body: any): any[] {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.data?.data)) return body.data.data;
  for (const key of ['products', 'items', 'stock', 'inventory']) {
    if (Array.isArray(body[key])) return body[key];
  }
  return [];
}

function normalizeProduct(raw: any, index: number): ProductItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const rawQty = raw.quantity ?? raw.stock_quantity ?? raw.stock ?? raw.qty ?? 0;
  const qty = Number(rawQty);
  const idRaw = raw.id ?? raw.product_id ?? index;
  const threshold = Number(raw.low_stock_threshold ?? raw.min_stock ?? raw.threshold ?? 5);

  return {
    id: Number.isFinite(Number(idRaw)) ? Number(idRaw) : index,
    name: String(raw.name ?? raw.product_name ?? 'Unknown product'),
    sku: raw.sku != null ? String(raw.sku) : undefined,
    quantity: Number.isFinite(qty) ? qty : 0,
    low_stock_threshold: Number.isFinite(threshold) ? threshold : 5,
    location: raw.location ?? raw.location_name ?? raw.shelf_location ?? undefined,
  };
}

function normalizeProductList(payload: unknown): ProductItem[] {
  const list = extractArray(payload);
  const items: ProductItem[] = [];
  list.forEach((raw, index) => {
    const item = normalizeProduct(raw, index);
    if (item) items.push(item);
  });
  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

function extractId(body: any): string | null {
  if (!body || typeof body !== 'object') return null;
  const data = body.data && typeof body.data === 'object' ? body.data : body;
  const id = data.id ?? data.business_id ?? data.businessId;
  return id != null ? String(id) : null;
}

export default function OwnerInventoryScreen() {
  const [items, setItems] = useState<ProductItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

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

    try {
      let bizId = businessId;

      if (!bizId) {
        const profileRes = await api.get('/business/profile');
        bizId = extractId(profileRes.data);
        if (!bizId) {
          throw new Error('Could not determine business ID.');
        }
        if (requestId !== requestSeqRef.current) return;
        setBusinessId(bizId);
      }

      const res = await api.get(`/owner/businesses/${bizId}/products`);

      if (requestId !== requestSeqRef.current) return;
      setItems(normalizeProductList(res.data));
      setError(null);
    } catch (err: any) {
      if (requestId !== requestSeqRef.current) return;
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Something went wrong while loading inventory.'
      );
    } finally {
      if (requestId === requestSeqRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, [businessId]);

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

  const adjustStock = useCallback(
    async (product: ProductItem, delta: number) => {
      const newQty = product.quantity + delta;
      if (newQty < 0) return;

      if (delta === 0) return;

      try {
        await api.post(`/owner/products/${product.id}/stock`, {
          quantity: Math.abs(delta),
          action: delta > 0 ? 'add' : 'subtract',
        });
        setItems((prev) =>
          prev.map((item) =>
            item.id === product.id ? { ...item, quantity: newQty } : item
          )
        );
      } catch (err: any) {
        Alert.alert(
          'Adjustment Failed',
          err?.response?.data?.message || err?.message || 'Could not update stock.'
        );
      }
    },
    []
  );

  const filtered = useMemo(() => {
    if (!query) return items;
    return items.filter((item) =>
      [item.name, item.sku, item.location]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query))
    );
  }, [items, query]);

  const summary = useMemo(() => {
    const out = filtered.filter((i) => i.quantity <= 0).length;
    const low = filtered.filter(
      (i) => i.quantity > 0 && i.quantity <= i.low_stock_threshold
    ).length;
    return { total: filtered.length, low, out };
  }, [filtered]);

  const renderItem = useCallback(
    ({ item }: { item: StockItem }) => {
      const status = getStockStatus(item.quantity, item.low_stock_threshold);
      return (
        <TouchableOpacity activeOpacity={0.85}>
          <Card style={styles.itemCard}>
            <View style={styles.itemMain}>
              <View style={styles.itemTopRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Badge
                  label={status.label}
                  color={status.bg}
                  textColor={status.text}
                  size="sm"
                />
              </View>

              <View style={styles.metaRow}>
                {item.sku ? (
                  <View style={[styles.metaChip, styles.skuChip]}>
                    <Text style={styles.skuText}>SKU · {item.sku}</Text>
                  </View>
                ) : null}
                {item.location ? (
                  <View style={[styles.metaChip, styles.locationChip]}>
                    <MaterialIcons
                      name="location-on"
                      size={12}
                      color={COLORS.primaryDark}
                      style={{ marginRight: 3 }}
                    />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.qtySection}>
              <View style={[styles.qtyBox, { backgroundColor: status.bg }]}>
                <Text style={[styles.qtyValue, { color: status.text }]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.qtyLabel, { color: status.text }]}>in stock</Text>
              </View>

              <View style={styles.adjustRow}>
                <TouchableOpacity
                  style={[styles.adjustBtn, item.quantity <= 0 && styles.adjustBtnDisabled]}
                  activeOpacity={0.7}
                  disabled={item.quantity <= 0}
                  onPress={() => adjustStock(item, -1)}
                >
                  <Text style={styles.adjustBtnText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.adjustBtn}
                  activeOpacity={0.7}
                  onPress={() => adjustStock(item, 1)}
                >
                  <Text style={styles.adjustBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      );
    },
    [adjustStock]
  );

  const listEmpty = useMemo(() => {
    if (initialLoading || refreshing) return null;
    if (error) {
      return (
        <EmptyState
          title="Failed to load inventory"
          subtitle={error}
          actionTitle="Try Again"
          onAction={handleRetry}
          style={styles.empty}
        />
      );
    }
    if (items.length === 0) {
      return (
        <EmptyState
          icon={<MaterialIcons name="inventory-2" size={32} color={COLORS.gray[400]} />}
          title="No products"
          subtitle="Inventory will appear here once products are added to your business."
          style={styles.empty}
        />
      );
    }
    return (
      <EmptyState
        icon={<MaterialIcons name="search" size={32} color={COLORS.gray[400]} />}
        title="No matches"
        subtitle={`Nothing found for "${searchText.trim()}". Try a different name or SKU.`}
        actionTitle="Clear Search"
        onAction={() => setSearchText('')}
        style={styles.empty}
      />
    );
  }, [initialLoading, refreshing, error, items.length, searchText, handleRetry]);

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Inventory" onBack={() => router.back()} />
        <View style={styles.initialLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.initialLoadingText}>Loading inventory…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Inventory"
        subtitle={`${items.length} product${items.length === 1 ? '' : 's'} tracked`}
        onBack={() => router.back()}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={controls.wrap}>
            <SearchBar
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by name or SKU…"
              style={controls.searchBar}
            />

            {!error && items.length > 0 ? (
              <View style={controls.summaryRow}>
                <Text style={controls.summaryText}>
                  {summary.total} shown · {summary.low} low · {summary.out} out of stock
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.listContent}
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

type StockItem = ProductItem;

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
  listContent: {
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm + 4,
  },
  itemMain: {
    flex: 1,
    minWidth: 0,
    gap: SPACING.sm - 2,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  itemName: {
    flexShrink: 1,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.full,
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm + 2,
    alignSelf: 'flex-start',
  },
  skuChip: {
    backgroundColor: COLORS.gray[100],
  },
  skuText: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    color: COLORS.gray[600],
    fontVariant: ['tabular-nums'],
  },
  locationChip: {
    backgroundColor: COLORS.primaryLight,
    maxWidth: 180,
  },
  locationText: {
    flexShrink: 1,
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    color: COLORS.primaryDark,
  },
  qtySection: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  qtyBox: {
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  qtyValue: {
    fontSize: FONTS.size.xl,
    fontFamily: FONTS.bold,
    lineHeight: 26,
  },
  qtyLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  adjustBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustBtnDisabled: {
    opacity: 0.35,
  },
  adjustBtnText: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    lineHeight: 20,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
  },
});

const controls = StyleSheet.create({
  wrap: {
    padding: SPACING.md,
    gap: SPACING.sm + 2,
  },
  searchBar: {
    flex: 1,
  },
  summaryRow: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm + 4,
    ...SHADOWS.sm,
  },
  summaryText: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    color: COLORS.textLight,
  },
});
