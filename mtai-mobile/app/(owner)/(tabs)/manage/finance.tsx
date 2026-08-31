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
import api from '../../src/api/client';
import Card from '../../src/components/Card';
import Header from '../../src/components/Header';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';

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

const ACCOUNT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  asset: { bg: 'rgba(91, 141, 239, 0.14)', text: '#5B8DEF' },
  liability: { bg: COLORS.red[100], text: COLORS.red[700] },
  equity: { bg: 'rgba(139, 92, 246, 0.14)', text: '#8B5CF6' },
  revenue: { bg: COLORS.green[100], text: COLORS.green[700] },
  expense: { bg: '#FEF3C7', text: '#B45309' },
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
        api.get('/owner/finance/chart-of-accounts'),
        api.get('/owner/finance/journal-entries'),
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
        <Header title="Finance" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading finance data…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Finance" subtitle="Financial overview" />
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

        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(91, 141, 239, 0.14)' }]}>
              <Text style={styles.summaryIconText}>🏦</Text>
            </View>
            <Text style={[styles.summaryValue, { color: '#5B8DEF' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              {formatTZS(summary.totalAssets)}
            </Text>
            <Text style={styles.summaryLabel}>Total Assets</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: COLORS.red[100] }]}>
              <Text style={styles.summaryIconText}>📋</Text>
            </View>
            <Text style={[styles.summaryValue, { color: COLORS.red[700] }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              {formatTZS(summary.totalLiabilities)}
            </Text>
            <Text style={styles.summaryLabel}>Total Liabilities</Text>
          </Card>
          <Card style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: 'rgba(139, 92, 246, 0.14)' }]}>
              <Text style={styles.summaryIconText}>💎</Text>
            </View>
            <Text style={[styles.summaryValue, { color: '#8B5CF6' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              {formatTZS(summary.totalEquity)}
            </Text>
            <Text style={styles.summaryLabel}>Total Equity</Text>
          </Card>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Journal Entries</Text>
        </View>
        {entries.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No journal entries recorded yet.</Text>
          </Card>
        ) : (
          entries.slice(0, 10).map((entry) => (
            <Card key={entry.id} style={styles.entryCard}>
              <View style={styles.entryTopRow}>
                <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                {entry.reference ? (
                  <Text style={styles.entryRef}>Ref: {entry.reference}</Text>
                ) : null}
              </View>
              <Text style={styles.entryDescription} numberOfLines={2}>
                {entry.description}
              </Text>
              <View style={styles.entryAmounts}>
                <View style={styles.amountChip}>
                  <Text style={styles.amountLabel}>Debit</Text>
                  <Text style={[styles.amountValue, { color: COLORS.primaryDark }]}>
                    {formatTZS(entry.total_debit)}
                  </Text>
                </View>
                <View style={styles.amountChip}>
                  <Text style={styles.amountLabel}>Credit</Text>
                  <Text style={[styles.amountValue, { color: COLORS.red[700] }]}>
                    {formatTZS(entry.total_credit)}
                  </Text>
                </View>
              </View>
            </Card>
          ))
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
            const colors = ACCOUNT_TYPE_COLORS[type] ?? { bg: COLORS.gray[100], text: COLORS.gray[700] };
            const label = ACCOUNT_TYPE_LABELS[type] ?? type;
            return (
              <Card key={type} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.groupBadgeText, { color: colors.text }]}>{label}</Text>
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
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  summaryCard: {
    flexBasis: '31%',
    flexGrow: 1,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryIconText: {
    fontSize: FONTS.size.lg,
  },
  summaryValue: {
    fontSize: FONTS.size.md,
    fontWeight: '800',
    marginTop: SPACING.sm,
  },
  summaryLabel: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.xs,
  },
  sectionHeader: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm + 2,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyCard: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  entryCard: {
    marginBottom: SPACING.sm + 4,
  },
  entryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs + 2,
  },
  entryDate: {
    fontSize: FONTS.size.sm,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  entryRef: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
  },
  entryDescription: {
    fontSize: FONTS.size.sm,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  entryAmounts: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  amountChip: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
  },
  amountLabel: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: FONTS.size.sm,
    fontWeight: '700',
    marginTop: 2,
  },
  groupCard: {
    marginBottom: SPACING.sm + 4,
  },
  groupHeader: {
    marginBottom: SPACING.sm,
  },
  groupBadge: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm + 4,
  },
  groupBadgeText: {
    fontSize: FONTS.size.xs,
    fontWeight: '700',
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
    fontWeight: '600',
    color: COLORS.textLight,
  },
  accountName: {
    fontSize: FONTS.size.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 1,
  },
  accountBalance: {
    fontSize: FONTS.size.sm,
    fontWeight: '700',
  },
});
