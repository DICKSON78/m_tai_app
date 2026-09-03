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
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../../src/api/client';
import Button from '../../../src/components/Button';
import Card from '../../../src/components/Card';
import Header from '../../../src/components/Header';
import Input from '../../../src/components/Input';
import LoadingScreen from '../../../src/components/LoadingScreen';
import PriceTag from '../../../src/components/PriceTag';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../../src/constants/theme';
import { useAuthStore } from '../../../src/store/authStore';

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

function extractBusinessId(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const raw = body as { data?: unknown };
  const data =
    raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)
      ? (raw.data as Record<string, unknown>)
      : (body as Record<string, unknown>);
  const id = data.id ?? data.business_id;
  return id != null ? String(id) : null;
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

function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  const trimZeros = (value: number) => value.toFixed(1).replace(/\.0$/, '');
  if (abs >= 1_000_000) return `TZS ${trimZeros(amount / 1_000_000)}M`;
  if (abs >= 10_000) return `TZS ${trimZeros(amount / 1_000)}K`;
  return `TZS ${formatTZS(amount)}`;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function formatMoneyCompact(amount: number): string {
  return formatCompact(amount);
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

function ProfitDonut({ percent, size = 96, color = COLORS.primaryDark }: { percent: number; size?: number; color?: string }) {  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = (clamped / 100) * circumference;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        overflow: 'hidden',
        ...SHADOWS.sm,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 6,
          left: 6,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          borderColor: COLORS.gray[100],
          borderWidth: 12,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 6,
          left: 6,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          borderColor: color,
          borderWidth: 12,
          borderRightColor: arc > 0 && arc < circumference ? COLORS.gray[100] : color,
          borderBottomColor: arc > 0 && arc < circumference ? COLORS.gray[100] : color,
          transform: [
            { rotate: `${270 + (arc / circumference) * 180}deg` },
            { translateX: 0 },
            { translateY: 0 },
          ],
        }}
      />
      <Text style={styles.donutValue}>{formatPercent(percent)}</Text>
    </View>
  );
}

function CompositionBar({
  total,
  cost,
  profit,
}: {
  total: number;
  cost: number;
  profit: number;
}) {
  if (total <= 0) {
    return (
      <View style={styles.compositionTrack}>
        <View style={[styles.compositionFill, { width: '100%', backgroundColor: COLORS.gray[200] }]} />
      </View>
    );
  }
  const costShare = Math.max(0, Math.min(1, cost / total));
  const profitShare = Math.max(0, Math.min(1, profit / total));
  return (
    <View style={styles.compositionTrack}>
      <View style={[styles.compositionFill, { width: `${costShare * 100}%`, backgroundColor: COLORS.gray[300] }]} />
      <View style={[styles.compositionFill, { width: `${profitShare * 100}%`, backgroundColor: COLORS.primaryDark }]} />
    </View>
  );
}

export default function OwnerReportsScreen() {
  const user = useAuthStore((state) => state.user);
  const [businessId, setBusinessId] = useState<string | null>(
    user?.current_business_id != null ? String(user.current_business_id) : null
  );

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
      params.period = 'daily';
      const today = toISODate(new Date());
      params.date_from = today;
      params.date_to = today;
    } else if (range === 'week') {
      params.period = 'weekly';
      const [from, to] = weekBounds();
      params.date_from = from;
      params.date_to = to;
    } else if (range === 'month') {
      params.period = 'monthly';
      const [from, to] = monthBounds();
      params.date_from = from;
      params.date_to = to;
    } else if (appliedCustom) {
      params.period = 'daily';
      params.date_from = appliedCustom.from;
      params.date_to = appliedCustom.to;
    }
    return params;
  }, [range, appliedCustom]);

  const loadReports = useCallback(async () => {
    if (range === 'custom' && !appliedCustom) return;
    setSalesError(null);
    setProfitError(null);
    const config = { params: buildParams() };
    let bizId = businessId;
    if (!bizId) {
      try {
        const profileRes = await api.get('/business/profile');
        bizId = extractBusinessId(profileRes.data);
        if (bizId) setBusinessId(bizId);
      } catch {
        bizId = null;
      }
    }
    if (!bizId) {
      setSalesData(null);
      setTopProducts([]);
      setProfitData(null);
      setSalesError('Could not determine your business account. Please pull to refresh.');
      setProfitError('Could not determine your business account. Please pull to refresh.');
      return;
    }
    const [salesRes, profitRes] = await Promise.allSettled([
      api.get(`/owner/businesses/${bizId}/reports/sales`, config),
      api.get(`/owner/businesses/${bizId}/reports/profit`, config),
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
  }, [range, appliedCustom, buildParams, businessId]);

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
      <Header title="Reports" subtitle="Business performance" onBack={() => router.back()} />
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
        {salesError && profitError ? (
          <Text style={styles.globalError}>
            {salesError || profitError || 'Could not load reports.'}
          </Text>
        ) : null}

        <View style={styles.heroCard}>
          <View style={styles.heroCircleOne} />
          <View style={styles.heroCircleTwo} />
          <Text style={styles.heroLabel}>TOTAL SALES</Text>
          <Text style={styles.heroBalance} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
            {formatTZS(salesMetrics.totalSales)}
          </Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <MaterialIcons name="shopping-bag" size={15} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroStatValue}>{salesMetrics.ordersCount}</Text>
              <Text style={styles.heroStatLabel}>Orders</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <MaterialIcons name="local-offer" size={15} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroStatValue}>{salesMetrics.itemsSold}</Text>
              <Text style={styles.heroStatLabel}>Items Sold</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <MaterialIcons name="compare-arrows" size={15} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroStatValue}>{formatMoneyCompact(salesMetrics.avgOrder)}</Text>
              <Text style={styles.heroStatLabel}>Avg Order</Text>
            </View>
          </View>
          <View style={styles.heroDivider} />
          {range === 'custom' && appliedCustom ? (
            <Text style={styles.heroDate}>{appliedCustom.from} → {appliedCustom.to}</Text>
          ) : (
            <Text style={styles.heroDate}>
              {RANGES.find((r) => r.key === range)?.label ?? 'Period'} overview
            </Text>
          )}
        </View>

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

        {!salesError ? (
          <Card style={styles.reportCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: COLORS.teal[50] }]}>
                <MaterialIcons name="insights" size={18} color={COLORS.primaryDark} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Sales Breakdown</Text>
                <Text style={styles.cardSubtitle}>Where your sales came from</Text>
              </View>
            </View>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: COLORS.primaryDark }]} />
                <Text style={styles.breakdownLabel}>Gross Profit</Text>
                <Text style={[styles.breakdownValue, { color: COLORS.primaryDark }]}>
                  {formatTZS(profitMetrics.grossProfit)}
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.breakdownDot, { backgroundColor: COLORS.gray[300] }]} />
                <Text style={styles.breakdownLabel}>Cost of Goods</Text>
                <Text style={[styles.breakdownValue, { color: COLORS.text }]}>
                  {formatTZS(profitMetrics.cost)}
                </Text>
              </View>
            </View>
            {profitError ? (
              <Text style={styles.sectionError}>{profitError}</Text>
            ) : (
              <CompositionBar
                total={profitMetrics.revenue}
                cost={profitMetrics.cost}
                profit={profitMetrics.grossProfit}
              />
            )}
          </Card>
        ) : (
          <Card style={styles.reportCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: COLORS.teal[50] }]}>
                <MaterialIcons name="payments" size={18} color={COLORS.primaryDark} />
              </View>
              <Text style={styles.cardTitle}>Sales Summary</Text>
            </View>
            <Text style={styles.sectionError}>{salesError}</Text>
          </Card>
        )}

        {!profitError ? (
          <Card style={styles.reportCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: COLORS.teal[50] }]}>
                <MaterialIcons name="donut-large" size={18} color={COLORS.primaryDark} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Profit Margin</Text>
                <Text style={styles.cardSubtitle}>Revenue vs profit efficiency</Text>
              </View>
            </View>
            <View style={styles.donutWrap}>
              <ProfitDonut percent={profitMetrics.margin} />
              <View style={styles.donutLegend}>
                <View style={styles.donutLegendRow}>
                  <Text style={styles.donutLegendLabel}>Revenue</Text>
                  <Text style={styles.donutLegendValue}>{formatTZS(profitMetrics.revenue)}</Text>
                </View>
                <View style={styles.donutLegendRow}>
                  <Text style={styles.donutLegendLabel}>Cost of Goods</Text>
                  <Text style={styles.donutLegendValue}>{formatTZS(profitMetrics.cost)}</Text>
                </View>
                <View style={styles.donutLegendRow}>
                  <Text style={styles.donutLegendLabel}>Gross Profit</Text>
                  <Text style={[styles.donutLegendValue, { color: COLORS.success }]}>
                    {formatTZS(profitMetrics.grossProfit)}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        ) : (
          <Card style={styles.reportCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: COLORS.teal[50] }]}>
                <MaterialIcons name="donut-large" size={18} color={COLORS.primaryDark} />
              </View>
              <Text style={styles.cardTitle}>Profit &amp; Loss</Text>
            </View>
            <Text style={styles.sectionError}>{profitError}</Text>
          </Card>
        )}

        <Card style={styles.reportCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconCircle, { backgroundColor: COLORS.teal[50] }]}>
              <MaterialIcons name="emoji-events" size={18} color={COLORS.primaryDark} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Top Products</Text>
              <Text style={styles.cardSubtitle}>Best sellers this period</Text>
            </View>
          </View>
          {topProducts.length === 0 ? (
            <Text style={styles.emptyProducts}>
              No product sales recorded for this period yet.
            </Text>
          ) : (
            topProducts.slice(0, 6).map((item, index) => (
              <View
                key={
                  typeof item.product_id === 'number' || typeof item.id === 'number'
                    ? String(item.product_id ?? item.id)
                    : `product-${index}`
                }
                style={[
                  styles.productRow,
                  index < Math.min(topProducts.length, 6) - 1 && styles.productDivider,
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
    marginTop: SPACING.md,
  },
  heroCard: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  heroCircleOne: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -50,
    top: -70,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroCircleTwo: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    right: 50,
    bottom: -40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroBalance: {
    color: COLORS.white,
    fontSize: 34,
    fontFamily: FONTS.bold,
    marginTop: SPACING.xs,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  heroStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    flexWrap: 'wrap',
  },
  heroStatValue: {
    color: COLORS.white,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.medium,
    width: '100%',
    textAlign: 'center',
  },
  heroStatDivider: {
    width: StyleSheet.hairlineWidth,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  heroDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: SPACING.md,
  },
  heroDate: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: SPACING.xs,
  },
  breakdownLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  breakdownValue: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    marginTop: 2,
  },
  compositionTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: COLORS.gray[100],
    marginTop: SPACING.md + 2,
  },
  compositionFill: {
    height: 12,
  },
  donutWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.sm,
  },
  donutValue: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  donutLegend: {
    flex: 1,
    gap: SPACING.sm,
  },
  donutLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  donutLegendLabel: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  donutLegendValue: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
    color: COLORS.text,
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
    fontFamily: FONTS.semibold,
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
  cardIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 1,
  },
  globalError: {
    color: COLORS.red[700],
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    marginTop: SPACING.md,
  },
  sectionError: {
    fontSize: FONTS.size.sm,
    color: COLORS.red[700],
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
    backgroundColor: COLORS.teal[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeTop: {
    backgroundColor: COLORS.primaryLight,
  },
  rankText: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  rankTextTop: {
    color: COLORS.primaryDark,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  productQty: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
