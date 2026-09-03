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
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../../../src/api/client';
import EmptyState from '../../../../src/components/EmptyState';
import Header from '../../../../src/components/Header';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../../../src/constants/theme';

interface Lead {
  id: number;
  name: string;
  email?: string;
  status: string;
  value?: number;
  created_at?: string;
}

interface Deal {
  id: number;
  title: string;
  value: number;
  status: string;
  created_at?: string;
}

interface Activity {
  id: number;
  type: string;
  description: string;
  created_at?: string;
}

type Segment = 'leads' | 'deals' | 'activity';

function extractArray(body: any): any[] {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.data?.data)) return body.data.data;
  return [];
}

function normalizeLead(raw: any): Lead | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? raw.contact_name ?? 'Unknown'),
    email: raw.email ?? undefined,
    status: String(raw.status ?? 'new'),
    value: Number(raw.value ?? raw.estimated_value ?? 0) || undefined,
    created_at: raw.created_at ?? undefined,
  };
}

function normalizeDeal(raw: any): Deal | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: Number(raw.id ?? 0),
    title: String(raw.title ?? raw.name ?? 'Untitled'),
    value: Number(raw.value ?? raw.amount ?? 0),
    status: String(raw.status ?? 'open'),
    created_at: raw.created_at ?? undefined,
  };
}

function normalizeActivity(raw: any): Activity | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: Number(raw.id ?? 0),
    type: String(raw.type ?? raw.activity_type ?? 'note'),
    description: String(raw.description ?? raw.title ?? raw.name ?? ''),
    created_at: raw.created_at ?? undefined,
  };
}

function formatTZS(amount: number): string {
  return `TZS ${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
}

function getLeadStatus(status: string): { label: string; bg: string; text: string } {
  switch (status.toLowerCase()) {
    case 'qualified':
      return { label: 'Qualified', bg: COLORS.teal[50], text: COLORS.primaryDark };
    case 'contacted':
      return { label: 'Contacted', bg: 'rgba(14,165,233,0.12)', text: COLORS.info };
    case 'converted':
      return { label: 'Converted', bg: '#EDE9FE', text: COLORS.primaryDark };
    default:
      return { label: 'New', bg: 'rgba(245,158,11,0.14)', text: '#92400E' };
  }
}

function getDealStatus(status: string): { label: string; bg: string; text: string } {
  switch (status.toLowerCase()) {
    case 'won':
      return { label: 'Won', bg: COLORS.teal[50], text: COLORS.primaryDark };
    case 'lost':
      return { label: 'Lost', bg: COLORS.red[100], text: COLORS.red[700] };
    case 'in_progress':
      return { label: 'In Progress', bg: 'rgba(14,165,233,0.12)', text: COLORS.info };
    default:
      return { label: 'Open', bg: 'rgba(245,158,11,0.14)', text: '#92400E' };
  }
}

const SEGMENTS: { key: Segment; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'leads', label: 'Leads', icon: 'person-add' },
  { key: 'deals', label: 'Deals', icon: 'handshake' },
  { key: 'activity', label: 'Activity', icon: 'timeline' },
];

function renderStatusBadge(meta: { label: string; bg: string; text: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.badgeText, { color: meta.text }]}>{meta.label}</Text>
    </View>
  );
}

export default function CRMScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [segment, setSegment] = useState<Segment>('leads');
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeqRef = useRef(0);

  const fetchData = useCallback(async () => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;

    const [leadsRes, dealsRes, actRes] = await Promise.allSettled([
      api.get('/owner/crm/leads'),
      api.get('/owner/crm/deals'),
      api.get('/owner/crm/activities'),
    ]);

    if (requestId !== requestSeqRef.current) return;

    if (leadsRes.status === 'fulfilled') {
      setLeads(extractArray(leadsRes.value.data).map(normalizeLead).filter(Boolean) as Lead[]);
    }
    if (dealsRes.status === 'fulfilled') {
      setDeals(extractArray(dealsRes.value.data).map(normalizeDeal).filter(Boolean) as Deal[]);
    }
    if (actRes.status === 'fulfilled') {
      setActivities(
        extractArray(actRes.value.data).map(normalizeActivity).filter(Boolean) as Activity[]
      );
    }
    const failed = [leadsRes, dealsRes, actRes].filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      setError(
        (failed[0].reason as any)?.response?.data?.message || 'Failed to load some CRM data.'
      );
    } else {
      setError(null);
    }

    setInitialLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const totalDealValue = useMemo(() => deals.reduce((sum, d) => sum + d.value, 0), [deals]);
  const wonValue = useMemo(
    () => deals.filter((d) => d.status.toLowerCase() === 'won').reduce((s, d) => s + d.value, 0),
    [deals]
  );

  const headers = useMemo(
    () => ({
      leads: { title: 'Leads', subtitle: 'Potential customers' },
      deals: { title: 'Deals', subtitle: 'Opportunities & pipeline' },
      activity: { title: 'Activity', subtitle: 'Recent touchpoints' },
    }),
    []
  );

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="CRM" onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const leadStatuses: { [k: string]: number } = {};
  leads.forEach((l) => {
    const key = getLeadStatus(l.status).label;
    leadStatuses[key] = (leadStatuses[key] || 0) + 1;
  });

  const listComponent = (
    <>
      <View style={styles.tabWrap}>
        {SEGMENTS.map((seg) => {
          const active = segment === seg.key;
          const count =
            seg.key === 'leads' ? leads.length : seg.key === 'deals' ? deals.length : activities.length;
          return (
            <TouchableOpacity
              key={seg.key}
              activeOpacity={0.8}
              style={styles.tab}
              onPress={() => setSegment(seg.key)}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{seg.label}</Text>
              <View style={[styles.tabCount, active && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>{count}</Text>
              </View>
              <View style={[styles.tabIndicator, active && styles.tabIndicatorActive]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.heroCard}>
        <View style={styles.heroCircleOne} />
        <View style={styles.heroCircleTwo} />
        <Text style={styles.heroEyebrow}>PIPELINE VALUE</Text>
        <Text style={styles.heroBalance} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
          {formatTZS(totalDealValue)}
        </Text>
        <View style={styles.heroRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{leads.length}</Text>
            <Text style={styles.heroStatLabel}>Leads</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{deals.length}</Text>
            <Text style={styles.heroStatLabel}>Deals</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{formatTZS(wonValue)}</Text>
            <Text style={styles.heroStatLabel}>Won</Text>
          </View>
        </View>
        <View style={styles.heroLine} />
        <Text style={styles.heroWonLabel}>
          {deals.length > 0
            ? `${Math.round((deals.filter((d) => d.status.toLowerCase() === 'won').length / deals.length) * 100)}% of deals won`
            : 'No closed deals yet'}
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="CRM"
        subtitle={`${headers[segment].subtitle} · ${leads.length} leads · ${deals.length} deals`}
        onBack={() => router.back()}
      />
      {segment === 'leads' ? (
        <FlatList
          data={leads}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={listComponent}
          ListEmptyComponent={
            !error ? (
              <EmptyState
                icon={<MaterialIcons name="person-add" size={32} color={COLORS.gray[400]} />}
                title="No leads yet"
                subtitle="Leads will appear here."
                style={styles.empty}
              />
            ) : null
          }
          renderItem={({ item }) => {
            const meta = getLeadStatus(item.status);
            return (
              <TouchableOpacity activeOpacity={0.85}>
                <View style={styles.itemCard}>
                  <View style={styles.itemAvatar}>
                    <Text style={styles.itemAvatarText}>
                      {(item.name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                    {item.email ? <Text style={styles.itemMeta} numberOfLines={1}>{item.email}</Text> : null}
                    <View style={styles.itemFooter}>
                      <Text style={styles.itemDate}>
                        {item.created_at ? formatDate(item.created_at) : ''}
                      </Text>
                      {item.value ? <Text style={styles.itemValue}>{formatTZS(item.value)}</Text> : null}
                    </View>
                  </View>
                  {renderStatusBadge(meta)}
                </View>
              </TouchableOpacity>
            );
          }}
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
      ) : null}

      {segment === 'deals' ? (
        <FlatList
          data={deals}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={listComponent}
          ListEmptyComponent={
            !error ? (
              <EmptyState
                icon={<MaterialIcons name="handshake" size={32} color={COLORS.gray[400]} />}
                title="No deals yet"
                subtitle="Deals will appear here."
                style={styles.empty}
              />
            ) : null
          }
          renderItem={({ item }) => {
            const meta = getDealStatus(item.status);
            return (
              <TouchableOpacity activeOpacity={0.85}>
                <View style={styles.itemCard}>
                  <View style={[styles.itemAvatar, { backgroundColor: COLORS.teal[50] }]}>
                    <MaterialIcons name="handshake" size={18} color={COLORS.primaryDark} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.itemValue}>{formatTZS(item.value)}</Text>
                    {item.created_at ? (
                      <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text>
                    ) : null}
                  </View>
                  {renderStatusBadge(meta)}
                </View>
              </TouchableOpacity>
            );
          }}
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
      ) : null}

      {segment === 'activity' ? (
        <FlatList
          data={activities}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={listComponent}
          ListEmptyComponent={
            !error ? (
              <EmptyState
                icon={<MaterialIcons name="timeline" size={32} color={COLORS.gray[400]} />}
                title="No activity yet"
                subtitle="Activity will appear here."
                style={styles.empty}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.activityCard}>
              <View style={styles.activityDot} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.type}</Text>
                <Text style={styles.itemMeta} numberOfLines={2}>{item.description}</Text>
                {item.created_at ? <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text> : null}
              </View>
            </View>
          )}
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
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { fontSize: FONTS.size.sm, color: COLORS.textLight },
  listContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center' },
  tabWrap: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.gray[500],
  },
  tabLabelActive: {
    color: COLORS.primaryDark,
    fontFamily: FONTS.bold,
  },
  tabCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountActive: {
    backgroundColor: COLORS.teal[50],
  },
  tabCountText: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.bold,
    color: COLORS.gray[500],
  },
  tabCountTextActive: {
    color: COLORS.primaryDark,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: 0,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: 'transparent',
  },
  tabIndicatorActive: {
    width: 44,
    backgroundColor: COLORS.primaryDark,
  },
  heroCard: {
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
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
  heroEyebrow: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroBalance: {
    color: COLORS.white,
    fontSize: 32,
    fontFamily: FONTS.bold,
    marginTop: SPACING.xs,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
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
    marginTop: 2,
  },
  heroDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  heroLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: SPACING.md,
  },
  heroWonLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
  },
  errorBanner: {
    backgroundColor: COLORS.red[100],
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  errorText: { color: COLORS.red[700], fontSize: FONTS.size.sm },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  itemAvatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemAvatarText: { fontSize: FONTS.size.lg, fontFamily: FONTS.bold, color: COLORS.primaryDark },
  itemInfo: { flex: 1, gap: 2 },
  itemTitle: { fontSize: FONTS.size.md, fontFamily: FONTS.semibold, color: COLORS.text },
  itemMeta: { fontSize: FONTS.size.sm, color: COLORS.textLight },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  itemDate: { fontSize: FONTS.size.xs, color: COLORS.gray[400], marginTop: 2 },
  itemValue: { fontSize: FONTS.size.xs, fontFamily: FONTS.semibold, color: COLORS.primaryDark },
  badge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeText: { fontSize: FONTS.size.xs, fontFamily: FONTS.semibold },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 6 },
});
