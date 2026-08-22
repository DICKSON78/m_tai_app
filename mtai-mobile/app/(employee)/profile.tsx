import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../src/api/client';
import { User } from '../../src/api/types';
import Avatar from '../../src/components/Avatar';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Header from '../../src/components/Header';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';

type EmployeeUser = User & {
  employee_number?: string | null;
  staff_number?: string | null;
  emp_no?: string | null;
  department?: string | { name?: string | null } | null;
  position?: string | { title?: string | null; name?: string | null } | null;
};

interface EmployeeStats {
  attendanceRate: number | null;
  salesThisMonth: number | null;
}

const ROLE_LABELS: Record<User['role'], string> = {
  customer: 'Customer',
  transporter: 'Transporter',
  employee: 'Employee',
  business_owner: 'Business Owner',
  admin: 'Administrator',
};

function formatTZS(amount: number): string {
  const rounded = Math.round(amount);
  const withSeparators = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `TZS ${withSeparators}`;
}

function asText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return asText(obj.name ?? obj.title);
  }
  return null;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function extractRecords(body: any): any[] {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.data?.data)) return body.data.data;
  for (const key of ['records', 'history', 'attendance']) {
    if (Array.isArray(body[key])) return body[key];
  }
  return [];
}

function computeAttendanceRate(body: any): number | null {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let expected = 0;
  const cursor = new Date(monthStart);
  while (cursor <= now) {
    if (cursor.getDay() !== 0) expected += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  if (expected === 0) return null;

  const presentDates = new Set<string>();
  extractRecords(body).forEach((raw) => {
    if (!raw || typeof raw !== 'object') return;
    const hasAttendance =
      raw.clock_in ?? raw.check_in ?? raw.started_at ?? raw.status != null;
    if (!hasAttendance) return;
    const dateValue = raw.date ?? raw.day ?? raw.clock_in ?? raw.check_in ?? raw.created_at;
    if (!dateValue) return;
    const parsed = new Date(String(dateValue));
    if (Number.isNaN(parsed.getTime())) return;
    if (parsed < monthStart || parsed > now) return;
    presentDates.add(toDateKey(parsed));
  });

  if (presentDates.size === 0) return null;
  return Math.min(100, Math.round((presentDates.size / expected) * 100));
}

function extractOrders(body: any): any[] {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.data?.data)) return body.data.data;
  return [];
}

function computeMonthSales(body: any): number | null {
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const orders = extractOrders(body);
  if (!orders.length && !Array.isArray(body?.data)) return null;

  let total = 0;
  let matched = false;
  orders.forEach((order) => {
    if (!order || typeof order !== 'object') return;
    const createdAt = order.created_at ? String(order.created_at) : '';
    if (!createdAt.startsWith(monthPrefix)) return;
    const amount = Number(order.total ?? order.total_amount ?? order.grand_total);
    if (Number.isFinite(amount)) {
      total += amount;
      matched = true;
    }
  });

  return matched ? total : orders.length > 0 ? 0 : null;
}

export default function EmployeeProfileScreen() {
  const router = useRouter();

  const user = useAuthStore((state) => state.user) as EmployeeUser | null;
  const logout = useAuthStore((state) => state.logout);

  const [stats, setStats] = useState<EmployeeStats>({
    attendanceRate: null,
    salesThisMonth: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);

    const results = await Promise.allSettled([
      api.get('/hr/attendance'),
      api.get('/orders/my', { params: { page: 1, per_page: 100 } }),
    ]);

    const nextStats: EmployeeStats = { attendanceRate: null, salesThisMonth: null };

    if (results[0].status === 'fulfilled') {
      nextStats.attendanceRate = computeAttendanceRate(results[0].value.data);
    }
    if (results[1].status === 'fulfilled') {
      nextStats.salesThisMonth = computeMonthSales(results[1].value.data);
    }

    setStats(nextStats);
    setStatsLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const employeeNumber = useMemo(
    () =>
      asText(user?.employee_number) ??
      asText(user?.staff_number) ??
      asText(user?.emp_no),
    [user]
  );
  const department = useMemo(() => asText(user?.department), [user]);
  const position = useMemo(() => asText(user?.position), [user]);

  const infoRows = useMemo(
    () => [
      { label: 'Employee No', value: employeeNumber ?? '—' },
      { label: 'Department', value: department ?? '—' },
      { label: 'Position', value: position ?? '—' },
      { label: 'Email', value: user?.email ?? '—' },
      ...(user?.phone ? [{ label: 'Phone', value: user.phone }] : []),
    ],
    [employeeNumber, department, position, user]
  );

  const quickLinks = useMemo(
    () => [
      { icon: '🧾', label: 'POS', route: '/' as const },
      { icon: '🏷', label: 'Inventory', route: '/inventory' as const },
      { icon: '🕐', label: 'Attendance', route: '/attendance' as const },
    ],
    []
  );

  const performLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch {
      setLoggingOut(false);
      setLogoutVisible(false);
    }
  }, [logout, router]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Profile" />

      <ScrollView contentContainerStyle={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <Avatar name={user?.name || '?'} uri={user?.avatar} size={84} />
          </View>
          <Text style={styles.name}>{user?.name || 'Employee'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {user ? ROLE_LABELS[user.role] ?? user.role : '—'}
            </Text>
          </View>
          {position ? <Text style={styles.position}>{position}</Text> : null}
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Attendance Rate</Text>
            {statsLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.statSpinner} />
            ) : (
              <Text style={[styles.statValue, styles.statValuePrimary]}>
                {stats.attendanceRate != null ? `${stats.attendanceRate}%` : '—'}
              </Text>
            )}
            <Text style={styles.statCaption}>This month</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Sales</Text>
            {statsLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={styles.statSpinner} />
            ) : (
              <Text style={styles.statValue} numberOfLines={1}>
                {stats.salesThisMonth != null ? formatTZS(stats.salesThisMonth) : '—'}
              </Text>
            )}
            <Text style={styles.statCaption}>This month</Text>
          </Card>
        </View>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Employee Information</Text>
          {infoRows.map((row) => (
            <View key={row.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </Card>

        <View style={styles.linksGrid}>
          {quickLinks.map((link) => (
            <TouchableOpacity
              key={link.label}
              activeOpacity={0.85}
              style={styles.linkTile}
              onPress={() => router.navigate(link.route)}
            >
              <Text style={styles.linkIcon}>{link.icon}</Text>
              <Text style={styles.linkLabel}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Log Out"
          variant="danger"
          size="lg"
          onPress={() => setLogoutVisible(true)}
          style={styles.logoutButton}
        />

        <Text style={styles.version}>M-TAI v1.0.0 · Staff Portal</Text>
      </ScrollView>

      <ConfirmDialog
        visible={logoutVisible}
        title="Log Out"
        message="Are you sure you want to log out of your staff account?"
        confirmLabel="Log Out"
        loading={loggingOut}
        onCancel={() => setLogoutVisible(false)}
        onConfirm={performLogout}
      />
    </SafeAreaView>
  );
}

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  loading,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!visible) return null;

  return (
    <View style={styles.dialogOverlay}>
      <TouchableOpacity style={styles.dialogBackdrop} activeOpacity={1} onPress={loading ? undefined : onCancel}>
        <TouchableOpacity activeOpacity={1} style={styles.dialogCard}>
          <View style={styles.dialogIconWrap}>
            <Text style={styles.dialogIcon}>⎋</Text>
          </View>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogMessage}>{message}</Text>
          <View style={styles.dialogActions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onCancel}
              disabled={loading}
              style={styles.dialogButton}
            />
            <Button
              title={confirmLabel}
              variant="danger"
              onPress={onConfirm}
              loading={loading}
              style={styles.dialogButton}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  hero: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingTop: SPACING.xl - 8,
    paddingBottom: SPACING.lg + SPACING.sm,
    borderBottomLeftRadius: RADIUS.xl + 8,
    borderBottomRightRadius: RADIUS.xl + 8,
  },
  avatarRing: {
    padding: 4,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  name: {
    fontSize: FONTS.size.xxl - 4,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: SPACING.md,
  },
  roleBadge: {
    marginTop: SPACING.xs + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  roleBadgeText: {
    fontSize: FONTS.size.sm,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  position: {
    fontSize: FONTS.size.sm,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: SPACING.xs + 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm + 4,
    marginHorizontal: SPACING.lg,
    marginTop: -(SPACING.xl - 16),
  },
  statCard: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.gray[400],
  },
  statSpinner: {
    height: 30,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: FONTS.size.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  statValuePrimary: {
    color: COLORS.primaryDark,
  },
  statCaption: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
  },
  sectionCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm + 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  infoLabel: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
  },
  infoValue: {
    flexShrink: 1,
    marginLeft: SPACING.md,
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  linksGrid: {
    flexDirection: 'row',
    gap: SPACING.sm + 4,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  linkTile: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    gap: SPACING.xs + 2,
    ...SHADOWS.sm,
  },
  linkIcon: {
    fontSize: FONTS.size.xxl,
    lineHeight: FONTS.size.xxxl - 6,
  },
  linkLabel: {
    fontSize: FONTS.size.xs,
    fontWeight: '700',
    color: COLORS.gray[700],
  },
  logoutButton: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  version: {
    textAlign: 'center',
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: SPACING.lg,
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'center',
  },
  dialogBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  dialogCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  dialogIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.red[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dialogIcon: {
    fontSize: FONTS.size.xxl,
    lineHeight: FONTS.size.xxxl - 8,
    color: COLORS.red[700],
  },
  dialogTitle: {
    fontSize: FONTS.size.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  dialogMessage: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs + 2,
    lineHeight: 20,
  },
  dialogActions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: SPACING.sm + 2,
    marginTop: SPACING.lg,
  },
  dialogButton: {
    flex: 1,
  },
});
