import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../src/api/client';
import Badge from '../../src/components/Badge';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';

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

function extractArray(body: any): any[] {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.data?.data)) return body.data.data;
  return [];
}

function extractId(body: any): string | null {
  if (!body || typeof body !== 'object') return null;
  const data = body.data && typeof body.data === 'object' ? body.data : body;
  const id = data.id ?? data.business_id ?? data.businessId;
  return id != null ? String(id) : null;
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
      return { label: 'Qualified', bg: COLORS.green[100], text: COLORS.green[700] };
    case 'contacted':
      return { label: 'Contacted', bg: 'rgba(91, 141, 239, 0.14)', text: '#5B8DEF' };
    case 'converted':
      return { label: 'Converted', bg: '#EDE9FE', text: '#7C3AED' };
    default:
      return { label: 'New', bg: '#FEF3C7', text: '#B45309' };
  }
}

function getDealStatus(status: string): { label: string; bg: string; text: string } {
  switch (status.toLowerCase()) {
    case 'won':
      return { label: 'Won', bg: COLORS.green[100], text: COLORS.green[700] };
    case 'lost':
      return { label: 'Lost', bg: COLORS.red[100], text: COLORS.red[700] };
    case 'in_progress':
      return { label: 'In Progress', bg: 'rgba(91, 141, 239, 0.14)', text: '#5B8DEF' };
    default:
      return { label: 'Open', bg: '#FEF3C7', text: '#B45309' };
  }
}

export default function CRMScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const requestSeqRef = useRef(0);

  const fetchData = useCallback(async () => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;

    try {
      let bizId = businessId;
      if (!bizId) {
        const profileRes = await api.get('/business/profile');
        bizId = extractId(profileRes.data);
        if (!bizId) throw new Error('Could not determine business ID.');
        if (requestId !== requestSeqRef.current) return;
        setBusinessId(bizId);
      }

      const [leadsRes, dealsRes, actRes] = await Promise.all([
        api.get(`/owner/businesses/${bizId}/leads`),
        api.get(`/owner/businesses/${bizId}/deals`),
        api.get(`/owner/businesses/${bizId}/activities`),
      ]);

      if (requestId !== requestSeqRef.current) return;

      setLeads(extractArray(leadsRes.data).map(normalizeLead).filter(Boolean) as Lead[]);
      setDeals(extractArray(dealsRes.data).map(normalizeDeal).filter(Boolean) as Deal[]);
      setActivities(extractArray(actRes.data).map(normalizeActivity).filter(Boolean) as Activity[]);
      setError(null);
    } catch (err: any) {
      if (requestId !== requestSeqRef.current) return;
      setError(err?.response?.data?.message || err?.message || 'Failed to load CRM data.');
    } finally {
      if (requestId === requestSeqRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, [businessId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const totalDealValue = deals.reduce((sum, d) => sum + d.value, 0);

  const renderActivity = ({ item }: { item: Activity }) => (
    <Card style={styles.card}>
      <View style={styles.activityRow}>
        <View style={styles.activityDot} />
        <View style={styles.activityInfo}>
          <Text style={styles.activityType}>{item.type}</Text>
          <Text style={styles.activityDesc} numberOfLines={2}>{item.description}</Text>
          {item.created_at ? <Text style={styles.activityDate}>{formatDate(item.created_at)}</Text> : null}
        </View>
      </View>
    </Card>
  );

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="CRM" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="CRM" subtitle={`${leads.length} leads · ${deals.length} deals`} />
      <FlatList
        data={activities}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderActivity}
        ListHeaderComponent={
          <View style={styles.sectionWrap}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.pipelineGrid}>
              <Card style={styles.pipelineCard}>
                <Text style={styles.pipelineValue}>{leads.length}</Text>
                <Text style={styles.pipelineLabel}>Leads</Text>
              </Card>
              <Card style={styles.pipelineCard}>
                <Text style={styles.pipelineValue}>{deals.length}</Text>
                <Text style={styles.pipelineLabel}>Deals</Text>
              </Card>
              <Card style={[styles.pipelineCard, { flexBasis: '100%' }]}>
                <Text style={[styles.pipelineValue, { color: COLORS.primaryDark }]}>{formatTZS(totalDealValue)}</Text>
                <Text style={styles.pipelineLabel}>Total Deal Value</Text>
              </Card>
            </View>

            {leads.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Recent Leads</Text>
                {leads.slice(0, 5).map((lead) => {
                  const st = getLeadStatus(lead.status);
                  return (
                    <Card key={String(lead.id)} style={styles.card}>
                      <View style={styles.cardRow}>
                        <View style={styles.cardInfo}>
                          <Text style={styles.cardTitle} numberOfLines={1}>{lead.name}</Text>
                          {lead.email ? <Text style={styles.cardMeta} numberOfLines={1}>{lead.email}</Text> : null}
                        </View>
                        <Badge label={st.label} color={st.bg} textColor={st.text} size="sm" />
                      </View>
                    </Card>
                  );
                })}
              </>
            )}

            {deals.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Recent Deals</Text>
                {deals.slice(0, 5).map((deal) => {
                  const st = getDealStatus(deal.status);
                  return (
                    <Card key={String(deal.id)} style={styles.card}>
                      <View style={styles.cardRow}>
                        <View style={styles.cardInfo}>
                          <Text style={styles.cardTitle} numberOfLines={1}>{deal.title}</Text>
                          <Text style={styles.cardMeta}>{formatTZS(deal.value)}</Text>
                        </View>
                        <Badge label={st.label} color={st.bg} textColor={st.text} size="sm" />
                      </View>
                    </Card>
                  );
                })}
              </>
            )}

            {activities.length > 0 && (
              <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Recent Activities</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon={<Text style={styles.emptyIcon}>👥</Text>}
              title="No CRM data"
              subtitle="Leads, deals, and activities will appear here."
              style={styles.empty}
            />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loadingText: { fontSize: FONTS.size.sm, color: COLORS.textLight },
  listContent: { paddingBottom: SPACING.xl, flexGrow: 1 },
  sectionWrap: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  sectionTitle: { fontSize: FONTS.size.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm + 2, marginTop: SPACING.sm },
  pipelineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  pipelineCard: { flexBasis: '48%', flexGrow: 1, alignItems: 'center', paddingVertical: SPACING.md },
  pipelineValue: { fontSize: FONTS.size.xl, fontWeight: '800', color: COLORS.text },
  pipelineLabel: { fontSize: FONTS.size.xs, fontWeight: '600', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: SPACING.xs },
  card: { marginBottom: SPACING.sm + 4 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  cardInfo: { flex: 1, gap: SPACING.xs },
  cardTitle: { fontSize: FONTS.size.md, fontWeight: '700', color: COLORS.text },
  cardMeta: { fontSize: FONTS.size.sm, color: COLORS.textLight },
  activityRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'flex-start' },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 5 },
  activityInfo: { flex: 1, gap: 2 },
  activityType: { fontSize: FONTS.size.sm, fontWeight: '700', color: COLORS.text, textTransform: 'capitalize' },
  activityDesc: { fontSize: FONTS.size.sm, color: COLORS.textLight },
  activityDate: { fontSize: FONTS.size.xs, color: COLORS.gray[400], marginTop: 2 },
  errorBanner: { backgroundColor: COLORS.red[100], borderRadius: RADIUS.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  errorText: { color: COLORS.red[700], fontSize: FONTS.size.sm },
  empty: { flex: 1, justifyContent: 'center' },
  emptyIcon: { fontSize: 32 },
});
