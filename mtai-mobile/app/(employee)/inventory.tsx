import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../src/api/client';
import Badge from '../../src/components/Badge';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import SearchBar from '../../src/components/SearchBar';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';

const SEARCH_DEBOUNCE_MS = 300;
const LOW_STOCK_THRESHOLD = 5;

interface StockItem {
  id: number;
  name: string;
  sku?: string;
  barcode?: string;
  stockQuantity: number;
  location?: string;
}

interface StockStatus {
  label: string;
  bg: string;
  text: string;
}

function getStockStatus(quantity: number): StockStatus {
  if (quantity <= 0) {
    return { label: 'Out of Stock', bg: COLORS.red[100], text: COLORS.red[700] };
  }
  if (quantity <= LOW_STOCK_THRESHOLD) {
    return { label: 'Low Stock', bg: 'rgba(245, 158, 11, 0.14)', text: '#92400E' };
  }
  return { label: 'In Stock', bg: COLORS.green[100], text: COLORS.green[700] };
}

function extractArray(body: any): any[] {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.data?.data)) return body.data.data;
  for (const key of ['stock', 'inventory', 'products', 'items']) {
    if (Array.isArray(body[key])) return body[key];
  }
  return [];
}

function normalizeItem(raw: any, index: number): StockItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const product = raw.product ?? {};
  const rawQty =
    raw.stock_quantity ?? raw.quantity ?? raw.stock ?? raw.qty ?? product.stock_quantity;
  const qty = Number(rawQty);
  const idRaw = raw.id ?? raw.product_id ?? product.id ?? index;

  return {
    id: Number.isFinite(Number(idRaw)) ? Number(idRaw) : index,
    name: String(raw.name ?? raw.product_name ?? product.name ?? 'Unknown product'),
    sku:
      raw.sku != null
        ? String(raw.sku)
        : product.sku != null
          ? String(product.sku)
          : undefined,
    barcode:
      raw.barcode != null
        ? String(raw.barcode)
        : product.barcode != null
          ? String(product.barcode)
          : undefined,
    stockQuantity: Number.isFinite(qty) ? qty : 0,
    location:
      raw.location ??
      raw.location_name ??
      raw.shelf_location ??
      raw.bin_location ??
      raw.warehouse_location ??
      product.location,
  };
}

function normalizeStockList(payload: unknown): StockItem[] {
  const list = extractArray(payload);
  const items: StockItem[] = [];
  list.forEach((raw, index) => {
    const item = normalizeItem(raw, index);
    if (item) items.push(item);
  });
  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

export default function InventoryScreen() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [query, setQuery] = useState('');

  const [scanVisible, setScanVisible] = useState(false);
  const [scanValue, setScanValue] = useState('');

  const requestSeqRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchText.trim().toLowerCase()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchStock = useCallback(async () => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;

    try {
      const res = await api.get('/employee/inventory');

      if (requestId !== requestSeqRef.current) return;
      setItems(normalizeStockList(res.data));
      setError(null);
    } catch (err: any) {
      if (requestId !== requestSeqRef.current) return;
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Something went wrong while loading stock.'
      );
    } finally {
      if (requestId === requestSeqRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStock();
  }, [fetchStock]);

  const handleRetry = useCallback(() => {
    setInitialLoading(true);
    setError(null);
    fetchStock();
  }, [fetchStock]);

  const submitScan = useCallback(() => {
    const code = scanValue.trim();
    if (!code) return;
    setSearchText(code);
    setScanValue('');
    setScanVisible(false);
  }, [scanValue]);

  const filtered = useMemo(() => {
    if (!query) return items;
    return items.filter((item) =>
      [
        item.name,
        item.sku,
        item.barcode,
        item.location,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query))
    );
  }, [items, query]);

  const summary = useMemo(() => {
    const out = filtered.filter((i) => i.stockQuantity <= 0).length;
    const low = filtered.filter(
      (i) => i.stockQuantity > 0 && i.stockQuantity <= LOW_STOCK_THRESHOLD
    ).length;
    return { total: filtered.length, low, out };
  }, [filtered]);

  const renderItem = useCallback(({ item }: { item: StockItem }) => {
    const status = getStockStatus(item.stockQuantity);
    return (
      <Card style={styles.itemCard}>
        <View style={styles.itemMain}>
          <View style={styles.itemTopRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Badge label={status.label} color={status.bg} textColor={status.text} size="sm" />
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

        <View style={[styles.qtyBox, { backgroundColor: status.bg }]}>
          <Text style={[styles.qtyValue, { color: status.text }]}>{item.stockQuantity}</Text>
          <Text style={[styles.qtyLabel, { color: status.text }]}>in stock</Text>
        </View>
      </Card>
    );
  }, []);

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
          title="No stock records"
          subtitle="Inventory data will appear here once products are added to your store."
          style={styles.empty}
        />
      );
    }
    return (
      <EmptyState
        icon={<MaterialIcons name="search" size={32} color={COLORS.gray[400]} />}
        title="No matches"
        subtitle={`Nothing found for “${searchText.trim()}”. Try a different name or SKU.`}
        actionTitle="Clear Search"
        onAction={() => setSearchText('')}
        style={styles.empty}
      />
    );
  }, [initialLoading, refreshing, error, items.length, searchText, handleRetry]);

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Inventory" />
        <View style={styles.initialLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.initialLoadingText}>Loading stock…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Inventory" subtitle={`${items.length} product${items.length === 1 ? '' : 's'} tracked`} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={controls.wrap}>
            <View style={controls.row}>
              <SearchBar
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search by name or SKU…"
                style={controls.searchBar}
              />
              <TouchableOpacity
                style={controls.scanButton}
                activeOpacity={0.8}
                onPress={() => {
                  setScanValue('');
                  setScanVisible(true);
                }}
              >
                <MaterialIcons name="center-focus-strong" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

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

      <Modal
        visible={scanVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setScanVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setScanVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Find by Barcode</Text>
            <Text style={styles.modalSubtitle}>
              Scan with your hardware scanner or type the code to filter inventory.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={scanValue}
              onChangeText={setScanValue}
              placeholder="Barcode"
              placeholderTextColor={COLORS.gray[400]}
              autoFocus
              autoCapitalize="characters"
              autoCorrect={false}
              onSubmitEditing={submitScan}
              returnKeyType="search"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                activeOpacity={0.8}
                onPress={() => setScanVisible(false)}
              >
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                activeOpacity={0.8}
                disabled={!scanValue.trim()}
                onPress={submitScan}
              >
                <Text style={styles.modalPrimaryText}>Search</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  empty: {
    flex: 1,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  modalTitle: {
    fontSize: FONTS.size.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs + 2,
    lineHeight: 19,
  },
  modalInput: {
    marginTop: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm + 2,
    marginTop: SPACING.lg,
  },
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
  },
  modalSecondaryText: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.gray[700],
  },
  modalPrimaryButton: {
    flex: 1,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    opacity: 1,
  },
  modalPrimaryText: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});

const controls = StyleSheet.create({
  wrap: {
    padding: SPACING.md,
    gap: SPACING.sm + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  searchBar: {
    flex: 1,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
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
