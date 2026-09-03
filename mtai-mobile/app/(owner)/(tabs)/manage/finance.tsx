import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../../../src/api/client';
import Card from '../../../../src/components/Card';
import Header from '../../../../src/components/Header';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../../../src/constants/theme';

interface Account {
  id: number;
  name: string;
  code: string;
  type: string;
  balance: number;
}

interface JournalEntry {
  id: number;
  date: string;
  description: string;
  reference?: string;
  total_debit: number;
  total_credit: number;
}

interface FinanceSummary {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

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

function extractArray(body: unknown): unknown[] {
  if (!body || typeof body !== 'object') return [];
  const b = body as Record<string, unknown>;
  const inner = b.data;
  if (inner && typeof inner === 'object') {
    const innerB = inner as Record<string, unknown>;
    if (Array.isArray(innerB.data)) return innerB.data;
    if (Array.isArray(inner)) return inner;
  }
  if (Array.isArray(b)) return b;
  return [];
}

function normalizeAccount(raw: unknown): Account | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  return {
    id: Number(a.id ?? 0),
    name: String(a.name ?? 'Unknown'),
    code: String(a.code ?? ''),
    type: String(a.type ?? a.account_type ?? '').toLowerCase(),
    balance: Number(a.balance ?? a.current_balance ?? 0),
  };
}

function normalizeEntry(raw: unknown): JournalEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  return {
    id: Number(e.id ?? 0),
    date: String(e.date ?? e.entry_date ?? e.created_at ?? ''),
    description: String(e.description ?? e.narration ?? ''),
    reference: e.reference ? String(e.reference) : undefined,
    total_debit: Number(e.total_debit ?? e.debit ?? 0),
    total_credit: Number(e.total_credit ?? e.credit ?? 0),
  };
}

function formatTZS(amount: number): string {
  const rounded = Math.round(amount);
  const withSeparators = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `TZS ${withSeparators}`;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expenses',
};

const ACCOUNT_TYPE_STYLES: Record<
  string,
  { icon: keyof typeof MaterialIcons.glyphMap; bg: string; text: string }
> = {
  asset: { icon: 'account-balance', bg: COLORS.teal[50], text: COLORS.primaryDark },
  liability: { icon: 'credit-card', bg: COLORS.red[100], text: COLORS.red[700] },
  equity: { icon: 'pie-chart', bg: COLORS.teal[100] ?? COLORS.teal[50], text: COLORS.primaryDark },
  revenue: { icon: 'trending-up', bg: COLORS.green[100], text: COLORS.green[700] },
  expense: { icon: 'payments', bg: COLORS.red[50], text: COLORS.red[700] },
};

export default function OwnerFinanceScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [accountsRes, entriesRes] = await Promise.allSettled([
        api.get('/owner/finance/accounts'),
        api.get('/owner/finance/journal'),
      ]);

      if (accountsRes.status === 'fulfilled') {
        const raw = extractArray(accountsRes.value.data);
        setAccounts(raw.map(normalizeAccount).filter(Boolean) as Account[]);
      } else {
        setAccounts([]);
      }

      if (entriesRes.status === 'fulfilled') {
        const raw = extractArray(entriesRes.value.data);
        setEntries(raw.map(normalizeEntry).filter(Boolean) as JournalEntry[]);
      } else {
        setEntries([]);
      }

      if (accountsRes.status === 'rejected' && entriesRes.status === 'rejected') {
        setError(
          extractErrorMessage(accountsRes.reason, 'Could not load finance data.')
        );
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load finance data.'));
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setInitialLoading(false));
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const summary = useMemo<FinanceSummary>(() => {
    const totals: Record<string, number> = {};
    for (const acct of accounts) {
      totals[acct.type] = (totals[acct.type] ?? 0) + acct.balance;
    }
    return {
      totalAssets: totals.asset ?? 0,
      totalLiabilities: totals.liability ?? 0,
      totalEquity: totals.equity ?? 0,
    };
  }, [accounts]);

  const groupedAccounts = useMemo(() => {
    const groups: Record<string, Account[]> = {};
    for (const acct of accounts) {
      const key = acct.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(acct);
    }
    return groups;
  }, [accounts]);

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Finance" onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading finance data…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Finance" subtitle="Financial overview" onBack={() => router.back()} />
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
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <View style={styles.heroCircleOne} />
          <View style={styles.heroCircleTwo} />
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>TOTAL EQUITY</Text>
            <MaterialIcons name="verified-user" size={16} color="rgba(255,255,255,0.9)" />
          </View>
          <Text
            style={styles.heroBalance}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {formatTZS(summary.totalEquity)}
          </Text>

          <View style={styles.heroFlowRow}>
            <View style={styles.heroFlowItem}>
              <View style={[styles.heroFlowIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <MaterialIcons name="north-east" size={18} color={COLORS.white} />
              </View>
              <View style={styles.heroFlowText}>
                <Text style={styles.heroFlowLabel}>Assets</Text>
                <Text style={styles.heroFlowValue} numberOfLines={1}>
                  {formatTZS(summary.totalAssets)}
                </Text>
              </View>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroFlowItem}>
              <View style={[styles.heroFlowIcon, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <MaterialIcons name="south-west" size={18} color={COLORS.white} />
              </View>
              <View style={styles.heroFlowText}>
                <Text style={styles.heroFlowLabel}>Liabilities</Text>
                <Text style={styles.heroFlowValue} numberOfLines={1}>
                  {formatTZS(summary.totalLiabilities)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transactions</Text>
          <Text style={styles.sectionCount}>{entries.length}</Text>
        </View>
        {entries.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No journal entries recorded yet.</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {entries.slice(0, 10).map((entry, index) => {
              const isOut = entry.total_debit > 0;
              return (
                <View
                  key={entry.id}
                  style={[styles.statementRow, index < Math.min(entries.length, 10) - 1 && styles.statementDivider]}
                >
                  <View style={[styles.statementIcon, isOut ? styles.statementIconOut : styles.statementIconIn]}>
                    <MaterialIcons
                      name={isOut ? 'arrow-upward' : 'arrow-downward'}
                      size={18}
                      color={isOut ? COLORS.red[700] : COLORS.primaryDark}
                    />
                  </View>
                  <View style={styles.statementInfo}>
                    <Text style={styles.statementDesc} numberOfLines={1}>
                      {entry.description || 'Journal entry'}
                    </Text>
                    <View style={styles.statementMeta}>
                      <Text style={styles.statementDate}>{formatDate(entry.date)}</Text>
                      {entry.reference ? (
                        <Text style={styles.statementRef}> · {entry.reference}</Text>
                      ) : null}
                    </View>
                  </View>
                  <Text style={[styles.statementAmount, isOut ? styles.amountOut : styles.amountIn]}>
                    {isOut ? '−' : '+'}
                    {formatTZS(Math.abs(isOut ? entry.total_debit : entry.total_credit))}
                  </Text>
                </View>
              );
            })}
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account Balances</Text>
        </View>
        {Object.keys(groupedAccounts).length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No accounts found.</Text>
          </Card>
        ) : (
          Object.entries(groupedAccounts).map(([type, accts]) => {
            const acctStyle = ACCOUNT_TYPE_STYLES[type] ?? {
              icon: 'account-balance' as const,
              bg: COLORS.gray[100],
              text: COLORS.gray[700],
            };
            const label = ACCOUNT_TYPE_LABELS[type] ?? type;
            return (
              <Card key={type} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupBadge, { backgroundColor: acctStyle.bg }]}>
                    <MaterialIcons name={acctStyle.icon} size={14} color={acctStyle.text} />
                    <Text style={[styles.groupBadgeText, { color: acctStyle.text }]}>{label}</Text>
                  </View>
                </View>
                {accts.map((a, idx) => (
                  <View
                    key={a.id || idx}
                    style={[styles.accountRow, idx < accts.length - 1 && styles.accountDivider]}
                  >
                    <View style={styles.accountInfo}>
                      {a.code ? <Text style={styles.accountCode}>{a.code}</Text> : null}
                      <Text style={styles.accountName} numberOfLines={1}>{a.name}</Text>
                    </View>
                    <Text style={[styles.accountBalance, { color: COLORS.text }]}>
                      {formatTZS(a.balance)}
                    </Text>
                  </View>
                ))}
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl + SPACING.lg,
  },
  errorBanner: {
    backgroundColor: COLORS.red[100],
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.red[700],
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
  },
  heroCard: {
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
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  heroFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  heroFlowItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  heroFlowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroFlowText: {
    flex: 1,
  },
  heroFlowLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.medium,
  },
  heroFlowValue: {
    color: COLORS.white,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    marginTop: 1,
  },
  heroStatDivider: {
    width: StyleSheet.hairlineWidth,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: SPACING.sm,
  },
  listCard: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  statementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
    paddingVertical: SPACING.sm + 4,
  },
  statementDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  statementIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statementIconIn: {
    backgroundColor: COLORS.teal[50],
  },
  statementIconOut: {
    backgroundColor: COLORS.red[100],
  },
  statementInfo: {
    flex: 1,
  },
  statementDesc: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  statementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statementDate: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  statementRef: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.regular,
    color: COLORS.gray[400],
  },
  statementAmount: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
  },
  amountIn: {
    color: COLORS.primaryDark,
  },
  amountOut: {
    color: COLORS.red[700],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md + 4,
    marginBottom: SPACING.sm + 2,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
    color: COLORS.gray[400],
  },
  emptyCard: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  groupCard: {
    marginBottom: SPACING.sm + 4,
  },
  groupHeader: {
    marginBottom: SPACING.sm,
  },
  groupBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm + 4,
  },
  groupBadgeText: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  accountDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  accountInfo: {
    flex: 1,
  },
  accountCode: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    color: COLORS.textLight,
  },
  accountName: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    marginTop: 1,
  },
  accountBalance: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
  },
});