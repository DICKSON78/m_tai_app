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
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../../../src/api/client';
import Badge from '../../../../src/components/Badge';
import Card from '../../../../src/components/Card';
import EmptyState from '../../../../src/components/EmptyState';
import Header from '../../../../src/components/Header';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../../../src/constants/theme';

interface Warehouse {
  id: number;
  name: string;
  zone_count: number;
  bin_count: number;
  location?: string;
}

interface Transfer {
  id: number;
  from_warehouse: string;
  to_warehouse: string;
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

function normalizeWarehouse(raw: any): Warehouse | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? 'Unnamed'),
    zone_count: Number(raw.zone_count ?? raw.zones ?? 0),
    bin_count: Number(raw.bin_count ?? raw.bins ?? 0),
    location: raw.location ?? raw.address ?? undefined,
  };
}

function normalizeTransfer(raw: any): Transfer | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: Number(raw.id ?? 0),
    from_warehouse: String(raw.from_warehouse ?? raw.source ?? 'Unknown'),
    to_warehouse: String(raw.to_warehouse ?? raw.destination ?? 'Unknown'),
    quantity: Number(raw.quantity ?? 0),
    status: String(raw.status ?? 'pending'),
    created_at: raw.created_at ?? undefined,
  };
}

function getTransferStatus(status: string): { label: string; bg: string; text: string } {
  switch (status.toLowerCase()) {
    case 'completed':
      return { label: 'Completed', bg: COLORS.green[100], text: COLORS.green[700] };
    case 'in_transit':
      return { label: 'In Transit', bg: 'rgba(91, 141, 239, 0.14)', text: COLORS.info };
    case 'cancelled':
      return { label: 'Cancelled', bg: COLORS.red[100], text: COLORS.red[700] };
    case 'pending':
    default:
      return { label: 'Pending', bg: 'rgba(245, 158, 11, 0.14)', text: '#92400E' };
  }
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`;
}

export default function WarehouseScreen() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeqRef = useRef(0);

  const fetchData = useCallback(async () => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;

    const [whRes, trRes] = await Promise.allSettled([
      api.get('/owner/warehouses'),
      api.get('/owner/warehouses/transfers/list'),
    ]);

    if (requestId !== requestSeqRef.current) return;

    if (whRes.status === 'fulfilled') {
      setWarehouses(extractArray(whRes.value.data).map(normalizeWarehouse).filter(Boolean) as Warehouse[]);
    } else {
      setError((whRes.reason as any)?.response?.data?.message || 'Failed to load warehouses.');
    }
    if (trRes.status === 'fulfilled') {
      setTransfers(extractArray(trRes.value.data).map(normalizeTransfer).filter(Boolean) as Transfer[]);
    } else {
      setError((trRes.reason as any)?.response?.data?.message || 'Failed to load stock transfers.');
    }
    if (whRes.status === 'rejected' && trRes.status === 'rejected') {
      setError((whRes.reason as any)?.response?.data?.message || 'Failed to load warehouse data.');
    }

    setInitialLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const renderTransfer = ({ item }: { item: Transfer }) => {
    const st = getTransferStatus(item.status);
    return (
      <Card style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.from_warehouse} → {item.to_warehouse}
            </Text>
            <Text style={styles.cardMeta}>Qty: {item.quantity}{item.created_at ? ` · ${formatDate(item.created_at)}` : ''}</Text>
          </View>
          <Badge label={st.label} color={st.bg} textColor={st.text} size="sm" />
        </View>
      </Card>
    );
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Warehouse" onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Warehouse" subtitle={`${warehouses.length} warehouse${warehouses.length === 1 ? '' : 's'} · ${transfers.length} transfer${transfers.length === 1 ? '' : 's'}`} onBack={() => router.back()} />
      <FlatList
        data={transfers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderTransfer}
        ListHeaderComponent={
          <View style={styles.sectionWrap}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {warehouses.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Warehouses</Text>
                {warehouses.map((wh) => (
                  <Card key={String(wh.id)} style={styles.card}>
                    <View style={styles.cardRow}>
                      <View style={styles.whIcon}>
                        <MaterialIcons name="home-work" size={22} color={COLORS.primaryDark} />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{wh.name}</Text>
                        <Text style={styles.cardMeta}>
                          {wh.zone_count} zone{wh.zone_count === 1 ? '' : 's'} · {wh.bin_count} bin{wh.bin_count === 1 ? '' : 's'}
                        </Text>
                        {wh.location ? <Text style={styles.cardMeta}>{wh.location}</Text> : null}
                      </View>
                    </View>
                  </Card>
                ))}
              </>
            )}

            {transfers.length > 0 && (
              <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Recent Transfers</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          !error ? (
            <EmptyState
              icon={<MaterialIcons name="factory" size={32} color={COLORS.gray[400]} />}
              title="No warehouse data"
              subtitle="Warehouses and transfers will appear here."
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
  sectionTitle: { fontSize: FONTS.size.lg, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: SPACING.sm + 2 },
  card: { marginBottom: SPACING.sm + 4 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  cardInfo: { flex: 1, gap: SPACING.xs },
  cardTitle: { fontSize: FONTS.size.md, fontFamily: FONTS.bold, color: COLORS.text },
  cardMeta: { fontSize: FONTS.size.sm, color: COLORS.textLight },
  whIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.gray[100], justifyContent: 'center', alignItems: 'center' },
  errorBanner: { backgroundColor: COLORS.red[100], borderRadius: RADIUS.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  errorText: { color: COLORS.red[700], fontSize: FONTS.size.sm },
  empty: { flex: 1, justifyContent: 'center' },
});
