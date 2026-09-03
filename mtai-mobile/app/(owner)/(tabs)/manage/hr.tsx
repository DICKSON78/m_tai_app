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
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../../../src/api/client';
import Badge from '../../../../src/components/Badge';
import Card from '../../../../src/components/Card';
import EmptyState from '../../../../src/components/EmptyState';
import Header from '../../../../src/components/Header';
import SearchBar from '../../../../src/components/SearchBar';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../../../src/constants/theme';

const SEARCH_DEBOUNCE_MS = 300;

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  status: string;
  email?: string;
  phone?: string;
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

function normalizeEmployee(raw: unknown): Employee | null {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;
  return {
    id: Number(e.id ?? 0),
    name: String(e.name ?? e.full_name ?? 'Unknown'),
    position: String(e.position ?? e.job_title ?? ''),
    department: String(e.department ?? e.department_name ?? ''),
    status: String(e.status ?? e.employment_status ?? 'active').toLowerCase(),
    email: typeof e.email === 'string' ? e.email : undefined,
    phone: typeof e.phone === 'string' ? e.phone : undefined,
  };
}

function getStatusMeta(status: string): { label: string; bg: string; text: string } {
  switch (status) {
    case 'active':
      return { label: 'Active', bg: COLORS.green[100], text: COLORS.green[700] };
    case 'on_leave':
    case 'on leave':
      return { label: 'On Leave', bg: 'rgba(245, 158, 11, 0.14)', text: '#92400E' };
    case 'inactive':
    case 'terminated':
      return { label: 'Inactive', bg: COLORS.red[100], text: COLORS.red[700] };
    default:
      return {
        label: status.charAt(0).toUpperCase() + status.slice(1),
        bg: COLORS.gray[100],
        text: COLORS.gray[700],
      };
  }
}

export default function OwnerHRScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      const res = await api.get('/owner/hr/employees');
      if (requestId !== requestSeqRef.current) return;
      const raw = extractArray(res.data);
      setEmployees(raw.map(normalizeEmployee).filter(Boolean) as Employee[]);
    } catch (err) {
      if (requestId !== requestSeqRef.current) return;
      setError(extractErrorMessage(err, 'Could not load employees.'));
    } finally {
      if (requestId === requestSeqRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!query) return employees;
    return employees.filter((emp) =>
      [emp.name, emp.position, emp.department, emp.email, emp.phone]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query))
    );
  }, [employees, query]);

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === 'active').length;
    const onLeave = employees.filter(
      (e) => e.status === 'on_leave' || e.status === 'on leave'
    ).length;
    return { total, active, onLeave };
  }, [employees]);

  const goToAttendance = useCallback(() => {
    router.push('/(employee)/attendance');
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Employee }) => {
      const meta = getStatusMeta(item.status);
      return (
        <TouchableOpacity activeOpacity={0.85}>
          <Card style={styles.employeeCard}>
            <View style={styles.employeeTopRow}>
              <Text style={styles.employeeName} numberOfLines={1}>
                {item.name}
              </Text>
              <Badge label={meta.label} color={meta.bg} textColor={meta.text} size="sm" />
            </View>
            {item.position ? (
              <Text style={styles.employeePosition} numberOfLines={1}>
                {item.position}
              </Text>
            ) : null}
            {item.department ? (
              <View style={styles.deptChip}>
                <Text style={styles.deptText} numberOfLines={1}>
                  {item.department}
                </Text>
              </View>
            ) : null}
          </Card>
        </TouchableOpacity>
      );
    },
    []
  );

  const listEmpty = useMemo(() => {
    if (initialLoading || refreshing) return null;
    if (error) {
      return (
        <EmptyState
          title="Failed to load employees"
          subtitle={error}
          actionTitle="Try Again"
          onAction={fetchData}
          style={styles.empty}
        />
      );
    }
    if (employees.length === 0) {
      return (
        <EmptyState
          icon={<MaterialIcons name="people" size={32} color={COLORS.gray[400]} />}
          title="No employees"
          subtitle="Employee records will appear here once added."
          style={styles.empty}
        />
      );
    }
    return (
      <EmptyState
        icon={<MaterialIcons name="search" size={32} color={COLORS.gray[400]} />}
        title="No matches"
        subtitle={`Nothing found for "${searchText.trim()}". Try a different name or department.`}
        actionTitle="Clear Search"
        onAction={() => setSearchText('')}
        style={styles.empty}
      />
    );
  }, [initialLoading, refreshing, error, employees.length, searchText, fetchData]);

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="HR" onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading employees…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="HR" subtitle={`${employees.length} employee${employees.length === 1 ? '' : 's'}`} onBack={() => router.back()} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.controls}>
            <SearchBar
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by name, department…"
              style={styles.searchBar}
            />

            <View style={styles.statsRow}>
              <Card style={styles.statCard}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={[styles.statValue, { color: COLORS.green[700] }]}>{stats.active}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </Card>
              <Card style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#92400E' }]}>{stats.onLeave}</Text>
                <Text style={styles.statLabel}>On Leave</Text>
              </Card>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={goToAttendance}>
                <MaterialIcons name="event" size={20} color={COLORS.white} />
                <Text style={styles.actionLabel}>View Attendance</Text>
              </TouchableOpacity>
            </View>
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
  controls: {
    padding: SPACING.md,
    gap: SPACING.sm + 2,
  },
  searchBar: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm + 4,
  },
  statValue: {
    fontSize: FONTS.size.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  actionLabel: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  listContent: {
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  employeeCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm + 4,
  },
  employeeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  employeeName: {
    flexShrink: 1,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  employeePosition: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  deptChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm + 2,
    marginTop: SPACING.sm,
  },
  deptText: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    color: COLORS.primaryDark,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
  },
});
