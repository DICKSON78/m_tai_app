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

interface BOMItem {
  id: number;
  product_name: string;
  quantity_per_build: number;
  estimated_cost: number;
}

interface WorkOrder {
  id: number;
  product_name: string;
  quantity: number;
  status: string;
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

function normalizeBOM(raw: any): BOMItem | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: Number(raw.id ?? 0),
    product_name: String(raw.product_name ?? raw.name ?? 'Unnamed'),
    quantity_per_build: Number(raw.quantity_per_build ?? raw.quantity ?? 0),
    estimated_cost: Number(raw.estimated_cost ?? raw.cost ?? 0),
  };
}

function normalizeWorkOrder(raw: any): WorkOrder | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: Number(raw.id ?? 0),
    product_name: String(raw.product_name ?? raw.name ?? 'Unnamed'),
    quantity: Number(raw.quantity ?? 0),
    status: String(raw.status ?? 'pending'),
    created_at: raw.created_at ?? undefined,
  };
}

function getWOStatus(status: string): { label: string; bg: string; text: string } {
  switch (status.toLowerCase()) {
    case 'in_progress':
      return { label: 'In Progress', bg: 'rgba(91, 141, 239, 0.14)', text: '#5B8DEF' };
    case 'completed':
      return { label: 'Completed', bg: COLORS.green[100], text: COLORS.green[700] };
    case 'cancelled':
      return { label: 'Cancelled', bg: COLORS.red[100], text: COLORS.red[700] };
    case 'pending':
    default:
      return { label: 'Pending', bg: '#FEF3C7', text: '#B45309' };
  }
}

function formatTZS(amount: number): string {
  return `TZS ${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export default function ManufacturingScreen() {
  const [boms, setBoms] = useState<BOMItem[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
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

      const [bomsRes, woRes] = await Promise.all([
        api.get(`/owner/businesses/${bizId}/bill-of-materials`),
        api.get(`/owner/businesses/${bizId}/work-orders`),
      ]);

      if (requestId !== requestSeqRef.current) return;

      setBoms(extractArray(bomsRes.data).map(normalizeBOM).filter(Boolean) as BOMItem[]);
      setWorkOrders(extractArray(woRes.data).map(normalizeWorkOrder).filter(Boolean) as WorkOrder[]);
      setError(null);
    } catch (err: any) {
      if (requestId !== requestSeqRef.current) return;
      setError(err?.response?.data?.message || err?.message || 'Failed to load manufacturing data.');
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

  const renderBOM = ({ item }: { item: BOMItem }) => (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.product_name}</Text>
          <Text style={styles.cardMeta}>Qty per build: {item.quantity_per_build}</Text>
        </View>
        <Badge label={formatTZS(item.estimated_cost)} color={COLORS.primaryLight} textColor={COLORS.primaryDark} size="sm" />
      </View>
    </Card>
  );

  const renderWorkOrder = ({ item }: { item: WorkOrder }) => {
    const st = getWOStatus(item.status);
    return (
      <Card style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.product_name}</Text>
            <Text style={styles.cardMeta}>Qty: {item.quantity}</Text>
          </View>
          <Badge label={st.label} color={st.bg} textColor={st.text} size="sm" />
        </View>
      </Card>
    );
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Manufacturing" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Manufacturing" subtitle={`${boms.length} BOM${boms.length === 1 ? '' : 's'} · ${workOrders.length} work order${workOrders.length === 1 ? '' : 's'}`} />
      <FlatList
        data={workOrders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderWorkOrder}
        ListHeaderComponent={
          <View style={styles.sectionWrap}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            {boms.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Bill of Materials</Text>
                {boms.map((bom) => (
                  <React.Fragment key={String(bom.id)}>{renderBOM({ item: bom })}</React.Fragment>
                ))}
              </>
            )}
            {workOrders.length > 0 && (
              <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Work Orders</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon={<Text style={styles.emptyIcon}>🏭</Text>}
              title="No manufacturing data"
              subtitle="BOMs and work orders will appear here."
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
  sectionTitle: { fontSize: FONTS.size.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm + 2 },
  card: { marginBottom: SPACING.sm + 4 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  cardInfo: { flex: 1, gap: SPACING.xs },
  cardTitle: { fontSize: FONTS.size.md, fontWeight: '700', color: COLORS.text },
  cardMeta: { fontSize: FONTS.size.sm, color: COLORS.textLight },
  errorBanner: { backgroundColor: COLORS.red[100], borderRadius: RADIUS.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  errorText: { color: COLORS.red[700], fontSize: FONTS.size.sm },
  empty: { flex: 1, justifyContent: 'center' },
  emptyIcon: { fontSize: 32 },
});
