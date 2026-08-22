import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../src/api/client';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Header from '../../src/components/Header';
import Input from '../../src/components/Input';
import LoadingScreen from '../../src/components/LoadingScreen';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, RADIUS, SPACING } from '../../src/constants/theme';

type RangeKey = 'today' | 'week' | 'month' | 'custom';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'custom', label: 'Custom' },
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

function pickArray(source: Record<string, unknown>, keys: string[]): Record<string, unknown>[] {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value as Record<string, unknown>[];
  }
  return [];
}

function formatTZS(amount: number): string {
  const rounded = Math.round(amount);
  const withSeparators = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `TZS ${withSeparators}`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function weekBounds(): [string, string] {
  const now = new Date();
  const weekdayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - weekdayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return [toISODate(monday), toISODate(sunday)];
}

function monthBounds(): [string, string] {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return [toISODate(first), toISODate(last)];
}

function getProductName(item: Record<string, unknown>): string {
  const nested = item.product as { name?: unknown } | null | undefined;
  if (typeof item.name === 'string' && item.name.trim() !== '') return item.name;
  if (typeof item.product_name === 'string' && item.product_name.trim() !== '') {
    return item.product_name;
  }
  if (nested && typeof nested.name === 'string' && nested.name.trim() !== '') {
    return nested.name;
  }
  const id =
    typeof item.product_id === 'number'
      ? item.product_id
      : typeof item.id === 'number'
        ? item.id
        : undefined;
  return id != null ? `Item #${id}` : 'Unknown product';
}

function getProductQuantity(item: Record<string, unknown>): number {
  return pickNumber(item, ['quantity', 'qty', 'sold', 'units_sold', 'total_quantity']);
}

function getProductRevenue(item: Record<string, unknown>): number {
  return pickNumber(item, ['revenue', 'total_sales', 'total_revenue', 'sales', 'total']);
}

interface MetricProps {
  label: string;
  value: string;
  color?: string;
}

function Metric({ label, value, color }: MetricProps) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text
        style={[styles.metricValue, color ? { color } : null]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {value}
      </Text>
    </View>
  );
}

export default function OwnerReportsScreen() {
  const [range, setRange] = useState<RangeKey>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [appliedCustom, setAppliedCustom] = useState<{ from: string; to: string } | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  const [salesData, setSalesData] = useState<Record<string, unknown> | null>(null);
  const [profitData, setProfitData] = useState<Record<string, unknown> | null>(null);
  const [topProducts, setTopProducts] = useState<Record<string, unknown>[]>([]);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [profitError, setProfitError] = useState<string | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const buildParams = useCallback((): Record<string, string> => {
    const params: Record<string, string> = {};
    if (range === 'today') {
      params.period = 'today';
      const today = toISODate(new Date());
      params.from = today;
      params.to = today;
    } else if (range === 'week') {
      params.period = 'week';
      const [from, to] = weekBounds();
      params.from = from;
      params.to = to;
    } else if (range === 'month') {
      params.period = 'month';
      const [from, to] = monthBounds();
      params.from = from;
      params.to = to;
    } else if (appliedCustom) {
      params.period = 'custom';
      params.from = appliedCustom.from;
      params.to = appliedCustom.to;
    }
    return params;
  }, [range, appliedCustom]);

  const loadReports = useCallback(async () => {
    if (range === 'custom' && !appliedCustom) return;
    setSalesError(null);
    setProfitError(null);
    const config = { params: buildParams() };
    const [salesRes, profitRes] = await Promise.allSettled([
      api.get('/reports/sales', config),
      api.get('/reports/profit', config),
    ]);
    if (salesRes.status === 'fulfilled') {
      const body = normalizeObject(salesRes.value.data);
      setSalesData(body);
      setTopProducts(
        pickArray(body, ['top_products', 'topProducts', 'best_sellers', 'best_products'])
      );
    } else {
      setSalesData(null);
      setTopProducts([]);
      setSalesError(extractErrorMessage(salesRes.reason, 'Could not load the sales summary.'));
    }
    if (profitRes.status === 'fulfilled') {
      setProfitData(normalizeObject(profitRes.value.data));
    } else {
      setProfitData(null);
      setProfitError(
        extractErrorMessage(profitRes.reason, 'Could not load the profit and loss report.')
      );
    }
  }, [range, appliedCustom, buildParams]);

  useEffect(() => {
    loadReports().finally(() => setInitialLoading(false));
  }, [loadReports]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  }, [loadReports]);

  const selectRange = useCallback((key: RangeKey) => {
    setRange(key);
    if (key !== 'custom') {
      setCustomError(null);
    }
  }, []);

  const handleApplyCustom = useCallback(() => {
    const from = customFrom.trim();
    const to = customTo.trim();
    if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) {
      setCustomError('Enter both dates in YYYY-MM-DD format.');
      return;
    }
    if (from > to) {
      setCustomError('The start date must be before the end date.');
      return;
    }
    setCustomError(null);
    setAppliedCustom({ from, to });
  }, [customFrom, customTo]);

  const salesMetrics = useMemo(() => {
    const source = salesData ?? {};
    const totalSales = pickNumber(source, [
      'total_sales',
      'gross_sales',
      'net_sales',
      'sales',
      'revenue',
    ]);
    const ordersCount = pickNumber(source, [
      'orders_count',
      'total_orders',
      'orders',
      'transactions',
    ]);
    const avgOrder =
      pickNumber(source, ['average_order_value', 'avg_order_value']) ||
      (ordersCount > 0 ? totalSales / ordersCount : 0);
    const itemsSold = pickNumber(source, [
      'items_sold',
      'units_sold',
      'total_items',
      'quantity_sold',
    ]);
    return { totalSales, ordersCount, avgOrder, itemsSold };
  }, [salesData]);

  const profitMetrics = useMemo(() => {
    const source = profitData ?? {};
    const revenue = pickNumber(source, ['revenue', 'total_revenue', 'net_sales', 'total_sales']);
    const grossRaw = pickNumber(source, [
      'gross_profit',
      'net_profit',
      'profit',
      'gross_income',
      'earnings',
    ]);
    const costRaw = pickNumber(source, [
      'cost_of_goods_sold',
      'cost_of_goods',
      'cogs',
      'cost',
      'expenses',
      'total_cost',
      'total_expenses',
    ]);
    const grossProfit =
      grossRaw > 0 || grossRaw < 0 || costRaw > 0 ? grossRaw : revenue - costRaw;
    const cost = costRaw > 0 ? costRaw : Math.max(0, revenue - grossProfit);
    const marginRaw = pickNumber(source, [
      'margin_percentage',
      'gross_margin_percentage',
      'profit_margin',
      'margin',
    ]);
    const margin =
      marginRaw > 0
        ? marginRaw
        : revenue > 0
          ? Math.max(0, Math.min(100, (grossProfit / revenue) * 100))
          : 0;
    return { revenue, cost, grossProfit, margin };
  }, [profitData]);

  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Reports" subtitle="Business performance" />
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
        <View style={styles.chipRow}>
          {RANGES.map(({ key, label }) => {
            const isActive = range === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => selectRange(key)}
                activeOpacity={0.8}
                style={[styles.chip, isActive && styles.chipActive]}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {range === 'custom' ? (
          <Card style={styles.customCard}>
            <Input
              label="From"
              value={customFrom}
              onChangeText={setCustomFrom}
              placeholder="YYYY-MM-DD"
            />
            <Input
              label="To"
              value={customTo}
              onChangeText={setCustomTo}
              placeholder="YYYY-MM-DD"
            />
            {customError ? <Text style={styles.customError}>{customError}</Text> : null}
            {!appliedCustom && !customError ? (
              <Text style={styles.customHint}>Enter a date range, then tap Apply.</Text>
            ) : null}
            <Button title="Apply Range" onPress={handleApplyCustom} style={styles.applyButton} />
          </Card>
        ) : null}

        <Card style={styles.reportCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💰</Text>
            <Text style={styles.cardTitle}>Sales Summary</Text>
          </View>
          {salesError ? (
            <Text style={styles.sectionError}>{salesError}</Text>
          ) : (
            <>
              <View style={styles.metricGrid}>
                <Metric
                  label="Total Sales"
                  value={formatTZS(salesMetrics.totalSales)}
                  color={COLORS.primaryDark}
                />
                <Metric label="Orders" value={String(salesMetrics.ordersCount)} />
                <Metric label="Avg Order Value" value={formatTZS(salesMetrics.avgOrder)} />
                <Metric label="Items Sold" value={String(salesMetrics.itemsSold)} />
              </View>
              {range === 'custom' && appliedCustom ? (
                <Text style={styles.rangeNote}>
                  {appliedCustom.from} → {appliedCustom.to}
                </Text>
              ) : null}
            </>
          )}
        </Card>

        <Card style={styles.reportCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📊</Text>
            <Text style={styles.cardTitle}>Profit &amp; Loss</Text>
          </View>
          {profitError ? (
            <Text style={styles.sectionError}>{profitError}</Text>
          ) : (
            <View style={styles.metricGrid}>
              <Metric label="Revenue" value={formatTZS(profitMetrics.revenue)} />
              <Metric label="Cost of Goods" value={formatTZS(profitMetrics.cost)} />
              <Metric
                label="Gross Profit"
                value={formatTZS(profitMetrics.grossProfit)}
                color={COLORS.success}
              />
              <Metric
                label="Margin"
                value={formatPercent(profitMetrics.margin)}
                color={COLORS.success}
              />
            </View>
          )}
        </Card>

        <Card style={styles.reportCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🏆</Text>
            <Text style={styles.cardTitle}>Top Products</Text>
          </View>
          {topProducts.length === 0 ? (
            <Text style={styles.emptyProducts}>
              No product sales recorded for this period yet.
            </Text>
          ) : (
            topProducts.slice(0, 10).map((item, index) => (
              <View
                key={
                  typeof item.product_id === 'number' || typeof item.id === 'number'
                    ? String(item.product_id ?? item.id)
                    : `product-${index}`
                }
                style={[
                  styles.productRow,
                  index < Math.min(topProducts.length, 10) - 1 && styles.productDivider,
                ]}
              >
                <View style={[styles.rankBadge, index < 3 && styles.rankBadgeTop]}>
                  <Text style={[styles.rankText, index < 3 && styles.rankTextTop]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {getProductName(item)}
                  </Text>
                  <Text style={styles.productQty}>{getProductQuantity(item)} sold</Text>
                </View>
                <PriceTag price={getProductRevenue(item)} size="sm" />
              </View>
            ))
          )}
        </Card>
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
    padding: SPACING.md,
    paddingBottom: SPACING.xxl + SPACING.lg,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm - 1,
    paddingHorizontal: SPACING.md,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONTS.size.sm,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  chipTextActive: {
    color: COLORS.white,
  },
  customCard: {
    marginTop: SPACING.md,
    gap: SPACING.sm + 2,
  },
  customError: {
    fontSize: FONTS.size.sm,
    color: COLORS.error,
  },
  customHint: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  applyButton: {
    marginTop: SPACING.xs,
  },
  reportCard: {
    marginTop: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  cardIcon: {
    fontSize: FONTS.size.xl - 2,
  },
  cardTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: SPACING.md,
  },
  metric: {
    width: '50%',
    paddingRight: SPACING.sm,
  },
  metricLabel: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: FONTS.size.lg,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionError: {
    fontSize: FONTS.size.sm,
    color: COLORS.red[700],
  },
  rangeNote: {
    marginTop: SPACING.md,
    fontSize: FONTS.size.sm,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  emptyProducts: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
    paddingVertical: SPACING.sm + 2,
  },
  productDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeTop: {
    backgroundColor: COLORS.primaryLight,
  },
  rankText: {
    fontSize: FONTS.size.sm,
    fontWeight: '700',
    color: COLORS.gray[600],
  },
  rankTextTop: {
    color: COLORS.primaryDark,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  productQty: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
