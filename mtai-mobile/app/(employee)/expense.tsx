import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/api/client';
import Badge from '../../src/components/Badge';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import Input from '../../src/components/Input';
import LoadingScreen from '../../src/components/LoadingScreen';
import SearchBar from '../../src/components/SearchBar';
import { COLORS, FONTS, RADIUS, SPACING } from '../../src/constants/theme';

const EXPENSE_CATEGORIES = [
  'Transport',
  'Meals',
  'Supplies',
  'Fuel',
  'Accommodation',
  'Communication',
  'Other',
];

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning,
  approved: COLORS.success,
  rejected: COLORS.error,
};

interface Expense {
  id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
  status: string;
  created_at: string;
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

function formatTZS(amount: number): string {
  const rounded = Math.round(amount);
  return `TZS ${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ExpenseScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [query, setQuery] = useState('');

  const [formVisible, setFormVisible] = useState(false);
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const requestSeqRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchText.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchExpenses = useCallback(async (targetPage: number, mode: 'replace' | 'append') => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;
    try {
      const res = await api.get('/employee/expenses', { params: { page: targetPage } });
      if (requestId !== requestSeqRef.current) return;
      const result = normalizePaginated<Expense>(res.data);
      setPage(result.currentPage);
      setLastPage(result.lastPage);
      setExpenses((prev) =>
        mode === 'append' && result.currentPage > 1 ? [...prev, ...result.items] : result.items
      );
      setError(null);
    } catch (err: any) {
      if (requestId !== requestSeqRef.current) return;
      if (mode === 'replace') {
        setExpenses([]);
        setError(
          err?.response?.data?.message || err?.message || 'Could not load expenses.'
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
    fetchExpenses(1, 'replace');
  }, [fetchExpenses]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExpenses(1, 'replace');
  }, [fetchExpenses]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || refreshing || initialLoading || page >= lastPage || error) return;
    setLoadingMore(true);
    fetchExpenses(page + 1, 'append');
  }, [loadingMore, refreshing, initialLoading, page, lastPage, error, fetchExpenses]);

  const handleRetry = useCallback(() => {
    setInitialLoading(true);
    fetchExpenses(1, 'replace');
  }, [fetchExpenses]);

  const openForm = useCallback(() => {
    setFormAmount('');
    setFormCategory('');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormErrors({});
    setFormVisible(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormVisible(false);
    setFormErrors({});
  }, []);

  const handleSubmitExpense = useCallback(async () => {
    const nextErrors: Record<string, string> = {};
    const amountNum = parseFloat(formAmount);
    if (!formAmount.trim() || isNaN(amountNum) || amountNum <= 0) {
      nextErrors.amount = 'Enter a valid amount greater than 0';
    }
    if (!formCategory.trim()) {
      nextErrors.category = 'Please select a category';
    }
    if (!formDescription.trim()) {
      nextErrors.description = 'Description is required';
    }
    if (!formDate.trim()) {
      nextErrors.date = 'Date is required';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }
    setFormErrors({});

    setSubmitting(true);
    try {
      await api.post('/employee/expenses', {
        amount: amountNum,
        category: formCategory.trim(),
        description: formDescription.trim(),
        date: formDate.trim(),
      });
      setFormVisible(false);
      Alert.alert('Expense submitted', 'Your expense report has been submitted for approval.');
      fetchExpenses(1, 'replace');
    } catch (err: any) {
      Alert.alert(
        'Submission failed',
        err?.response?.data?.message || err?.message || 'Could not submit expense. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }, [formAmount, formCategory, formDescription, formDate, fetchExpenses]);

  const filtered = useMemo(() => {
    if (!query) return expenses;
    return expenses.filter((e) =>
      [e.description, e.category, String(e.amount)]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(query))
    );
  }, [expenses, query]);

  const renderItem = useCallback(({ item }: { item: Expense }) => {
    const statusColor = STATUS_COLORS[item.status] ?? COLORS.gray[500];
    const statusLabel = item.status.charAt(0).toUpperCase() + item.status.slice(1);
    return (
      <Card style={styles.expenseCard}>
        <View style={styles.expenseTopRow}>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={styles.expenseCategory}>{item.category}</Text>
          </View>
          <View style={styles.expenseRight}>
            <Text style={styles.expenseAmount}>{formatTZS(item.amount)}</Text>
            <Badge label={statusLabel} color={statusColor} size="sm" />
          </View>
        </View>
        <Text style={styles.expenseDate}>{formatDate(item.date || item.created_at)}</Text>
      </Card>
    );
  }, []);

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
          title="Failed to load expenses"
          subtitle={error}
          actionTitle="Try Again"
          onAction={handleRetry}
          style={styles.empty}
        />
      );
    }
    if (expenses.length === 0) {
      return (
        <EmptyState
          icon={<Text style={styles.emptyIcon}>💰</Text>}
          title="No expenses yet"
          subtitle="Submit your first expense report using the button below."
          style={styles.empty}
        />
      );
    }
    return (
      <EmptyState
        icon={<Text style={styles.emptyIcon}>🔍</Text>}
        title="No matches"
        subtitle={`Nothing found for "${searchText.trim()}".`}
        actionTitle="Clear Search"
        onAction={() => setSearchText('')}
        style={styles.empty}
      />
    );
  }, [initialLoading, loadingMore, error, expenses.length, searchText, handleRetry]);

  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Expenses"
        rightAction={
          <TouchableOpacity style={styles.addButton} activeOpacity={0.7} onPress={openForm}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.searchWrap}>
            <SearchBar
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search expenses…"
            />
          </View>
        }
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />

      <Modal visible={formVisible} transparent animationType="fade" onRequestClose={closeForm}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeForm}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>New Expense</Text>
            <Text style={styles.modalSubtitle}>Fill in the details below to submit an expense.</Text>

            <Input
              label="Amount (TZS)"
              value={formAmount}
              onChangeText={(t) => { setFormAmount(t); if (formErrors.amount) setFormErrors((p) => ({ ...p, amount: '' })); }}
              placeholder="0"
              keyboardType="numeric"
              error={formErrors.amount}
              style={styles.fieldSpacing}
            />

            <Text style={styles.categoryLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.map((cat) => {
                const selected = formCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.7}
                    onPress={() => { setFormCategory(cat); if (formErrors.category) setFormErrors((p) => ({ ...p, category: '' })); }}
                    style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  >
                    <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {formErrors.category ? <Text style={styles.errorText}>{formErrors.category}</Text> : null}

            <Input
              label="Description"
              value={formDescription}
              onChangeText={(t) => { setFormDescription(t); if (formErrors.description) setFormErrors((p) => ({ ...p, description: '' })); }}
              placeholder="What was this expense for?"
              multiline
              error={formErrors.description}
              style={styles.fieldSpacing}
            />

            <Input
              label="Date"
              value={formDate}
              onChangeText={(t) => { setFormDate(t); if (formErrors.date) setFormErrors((p) => ({ ...p, date: '' })); }}
              placeholder="YYYY-MM-DD"
              error={formErrors.date}
              style={styles.fieldSpacing}
            />

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="secondary" onPress={closeForm} style={styles.modalActionBtn} />
              <Button title="Submit" onPress={handleSubmitExpense} loading={submitting} style={styles.modalActionBtn} />
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
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: FONTS.size.xl,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 22,
  },
  searchWrap: {
    padding: SPACING.md,
    paddingBottom: 0,
  },
  listContent: {
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  expenseCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm + 4,
  },
  expenseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  expenseCategory: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs + 2,
  },
  expenseAmount: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  expenseDate: {
    fontSize: FONTS.size.sm,
    color: COLORS.gray[400],
    marginTop: SPACING.sm,
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
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs + 2,
    marginBottom: SPACING.md,
    lineHeight: 19,
  },
  fieldSpacing: {
    marginBottom: SPACING.md,
  },
  categoryLabel: {
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm - 2,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  categoryChip: {
    paddingVertical: SPACING.sm - 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  categoryChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  categoryChipText: {
    fontSize: FONTS.size.sm,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  categoryChipTextSelected: {
    color: COLORS.primaryDark,
  },
  errorText: {
    fontSize: FONTS.size.sm,
    color: COLORS.error,
    marginTop: -(SPACING.sm + 2),
    marginBottom: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm + 2,
    marginTop: SPACING.sm,
  },
  modalActionBtn: {
    flex: 1,
  },
});
