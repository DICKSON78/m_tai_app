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
import api from '../../src/api/client';
import Badge from '../../src/components/Badge';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';

interface AttendanceRecord {
  id?: number | string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatClock(value: unknown): string {
  const date = parseDate(value);
  if (!date) return '—';
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '0h 00m';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function formatDayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  if (Number.isNaN(date.getTime())) return key;
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayMonth = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  return `${weekday}, ${dayMonth}`;
}

function normalizeRecord(raw: any): AttendanceRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const clockInRaw =
    raw.clock_in ?? raw.clockIn ?? raw.check_in ?? raw.checkin_at ?? raw.started_at ?? raw.punch_in;
  const clockOutRaw =
    raw.clock_out ?? raw.clockOut ?? raw.check_out ?? raw.checkout_at ?? raw.ended_at ?? raw.punch_out;
  const dateRaw =
    raw.date ?? raw.day ??
    parseDate(clockInRaw)?.toISOString() ??
    parseDate(raw.created_at)?.toISOString();

  if (!dateRaw) return null;

  const parsed = parseDate(dateRaw) ?? parseDate(clockInRaw) ?? parseDate(raw.created_at);
  if (!parsed) return null;

  return {
    id: raw.id,
    date: toDateKey(parsed),
    clockIn: clockInRaw ? String(clockInRaw) : null,
    clockOut: clockOutRaw ? String(clockOutRaw) : null,
  };
}

function normalizeAttendancePayload(payload: any): {
  records: AttendanceRecord[];
  openRecord: AttendanceRecord | null;
} {
  const body = payload && typeof payload === 'object' ? payload : {};
  let rawList: any[] = [];
  if (Array.isArray(body)) {
    rawList = body;
  } else if (Array.isArray(body.data)) {
    rawList = body.data;
  } else if (Array.isArray(body.data?.data)) {
    rawList = body.data.data;
  } else if (Array.isArray(body.records)) {
    rawList = body.records;
  } else if (Array.isArray(body.history)) {
    rawList = body.history;
  }

  const records = rawList
    .map(normalizeRecord)
    .filter((r): r is AttendanceRecord => r !== null);

  let todayRaw = body.today ?? body.attendance_today ?? body.current_shift;
  if (!todayRaw && Array.isArray(body.data) && !Array.isArray((body.data as any)[0])) {
    todayRaw = body.data;
  }

  const todayKey = toDateKey(new Date());
  let openRecord = normalizeRecord(todayRaw);
  if (openRecord && openRecord.date !== todayKey && !openRecord.clockOut) {
    openRecord = null;
  }
  if (!openRecord) {
    openRecord = records.find((r) => r.date === todayKey) ?? null;
  }
  return { records, openRecord };
}

export default function AttendanceScreen() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestSeqRef = useRef(0);

  const fetchAttendance = useCallback(async () => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;

    try {
      const res = await api.get('/owner/hr/attendance');
      if (requestId !== requestSeqRef.current) return;

      const normalized = normalizeAttendancePayload(res.data);
      setRecords(normalized.records);
      setTodayRecord(normalized.openRecord);
      setError(null);
    } catch (err: any) {
      if (requestId !== requestSeqRef.current) return;
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Something went wrong while loading attendance.'
      );
    } finally {
      if (requestId === requestSeqRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAttendance();
  }, [fetchAttendance]);

  const isClockedIn = Boolean(
    todayRecord?.clockIn && !todayRecord?.clockOut
  );

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isClockedIn) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isClockedIn]);

  const elapsedMs = useMemo(() => {
    if (!todayRecord?.clockIn) return 0;
    const start = parseDate(todayRecord.clockIn)?.getTime();
    if (!start) return 0;
    return Math.max(0, now - start);
  }, [todayRecord, now]);

  const toggleClock = useCallback(async () => {
    if (submitting || initialLoading) return;
    const action = isClockedIn ? 'clock_out' : 'clock_in';

    setSubmitting(true);
    try {
      await api.post('/owner/hr/attendance', {
        action,
        type: isClockedIn ? 'out' : 'in',
        timestamp: new Date().toISOString(),
      });
      await fetchAttendance();
    } catch (err: any) {
      Alert.alert(
        isClockedIn ? 'Clock Out Failed' : 'Clock In Failed',
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }, [submitting, initialLoading, isClockedIn, fetchAttendance]);

  const last7Days = useMemo(() => {
    const days: { key: string; record: AttendanceRecord | null }[] = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      const match =
        i === 0 && todayRecord?.clockIn ? todayRecord : records.find((r) => r.date === key);
      if (!match && i === 0 && !records.some((r) => r.date === key)) {
        days.push({ key, record: null });
        continue;
      }
      days.push({ key, record: match ?? null });
    }
    return days;
  }, [records, todayRecord]);

  const renderHistoryRow = useCallback(
    ({ item }: { item: { key: string; record: AttendanceRecord | null } }) => {
      const { key, record } = item;
      const worked =
        record?.clockIn && record?.clockOut
          ? formatDuration(
              (parseDate(record.clockOut)?.getTime() ?? 0) -
                (parseDate(record.clockIn)?.getTime() ?? 0)
            )
          : record?.clockIn && !record?.clockOut
            ? 'On shift'
            : null;

      return (
        <View style={[styles.historyRow, !record && styles.historyRowMuted]}>
          <Text style={[styles.historyDate, !record && styles.mutedText]}>{formatDayLabel(key)}</Text>
          <Text style={[styles.historyTime, !record && styles.mutedText]}>
            {formatClock(record?.clockIn)}
          </Text>
          <Text style={[styles.historyTime, !record && styles.mutedText]}>
            {formatClock(record?.clockOut)}
          </Text>
          <Text
            style={[
              styles.historyWorked,
              worked === 'On shift' && styles.historyWorkedActive,
              !worked && styles.mutedText,
            ]}
          >
            {worked ?? '—'}
          </Text>
        </View>
      );
    },
    []
  );

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Attendance" />
        <View style={styles.initialLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.initialLoadingText}>Loading attendance…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const historyData = last7Days;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="Attendance"
        subtitle={new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      />

      <FlatList
        data={historyData}
        keyExtractor={(item) => item.key}
        renderItem={renderHistoryRow}
        ListHeaderComponent={
          <View style={styles.topSection}>
            <Card style={styles.statusCard}>
              <View style={styles.statusTopRow}>
                <Badge
                  label={isClockedIn ? 'On Shift' : 'Off Shift'}
                  color={isClockedIn ? COLORS.primaryLight : COLORS.gray[100]}
                  textColor={isClockedIn ? COLORS.primaryDark : COLORS.gray[500]}
                  size="sm"
                />
                {isClockedIn ? (
                  <Text style={styles.elapsed}>{formatDuration(elapsedMs)} elapsed</Text>
                ) : null}
              </View>

              {todayRecord?.clockIn ? (
                <View style={styles.todayTimes}>
                  <View style={styles.todayTimeBlock}>
                    <Text style={styles.todayLabel}>Clocked In</Text>
                    <Text style={styles.todayValue}>{formatClock(todayRecord.clockIn)}</Text>
                  </View>
                  <View style={styles.todayDivider} />
                  <View style={styles.todayTimeBlock}>
                    <Text style={styles.todayLabel}>Clocked Out</Text>
                    <Text style={styles.todayValue}>
                      {formatClock(todayRecord.clockOut)}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.statusHint}>
                  You have not clocked in yet today. Tap the button below when your shift starts.
                </Text>
              )}
            </Card>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={toggleClock}
              disabled={submitting}
              style={[styles.clockButton, isClockedIn && styles.clockButtonOut]}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} size="large" />
              ) : (
                <>
                  <Text style={styles.clockButtonIcon}>{isClockedIn ? '⏹' : '▶'}</Text>
                  <Text style={styles.clockButtonText}>
                    {isClockedIn ? 'Clock Out' : 'Clock In'}
                  </Text>
                  <Text style={styles.clockButtonSub}>
                    {isClockedIn
                      ? 'Tap to end your shift'
                      : new Date().toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {error ? (
              <TouchableOpacity onPress={() => fetchAttendance()} activeOpacity={0.8}>
                <Text style={styles.errorBanner}>⚠ {error} — tap to retry</Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Last 7 Days</Text>
              <Text style={styles.sectionCaption}>In · Out · Worked</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Text style={styles.emptyIcon}>🕐</Text>}
            title="No attendance yet"
            subtitle="Your recent shift history will show up here."
            style={styles.emptyState}
          />
        }
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
  topSection: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  statusCard: {
    gap: SPACING.md,
  },
  statusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  elapsed: {
    fontSize: FONTS.size.sm,
    fontWeight: '700',
    color: COLORS.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  statusHint: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  todayTimes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayTimeBlock: {
    flex: 1,
  },
  todayLabel: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.gray[400],
    marginBottom: 2,
  },
  todayValue: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  todayDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: COLORS.gray[200],
    marginHorizontal: SPACING.md,
  },
  clockButton: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.xl - 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    ...SHADOWS.md,
  },
  clockButtonOut: {
    backgroundColor: COLORS.red[500],
  },
  clockButtonIcon: {
    fontSize: FONTS.size.xxl,
    lineHeight: FONTS.size.xxxl - 4,
    color: COLORS.white,
  },
  clockButtonText: {
    fontSize: FONTS.size.xl,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: COLORS.white,
  },
  clockButtonSub: {
    fontSize: FONTS.size.sm,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  errorBanner: {
    fontSize: FONTS.size.sm,
    fontWeight: '600',
    color: COLORS.error,
    textAlign: 'center',
    lineHeight: 19,
  },
  historyHeader: {
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionCaption: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  historyRowMuted: {
    opacity: 0.55,
  },
  historyDate: {
    flex: 1.3,
    fontSize: FONTS.size.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  historyTime: {
    flex: 1,
    fontSize: FONTS.size.sm,
    color: COLORS.gray[700],
    fontVariant: ['tabular-nums'],
  },
  historyWorked: {
    width: 64,
    textAlign: 'right',
    fontSize: FONTS.size.sm,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  historyWorkedActive: {
    color: COLORS.warning,
  },
  mutedText: {
    color: COLORS.gray[400],
  },
  emptyState: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 32,
  },
});
