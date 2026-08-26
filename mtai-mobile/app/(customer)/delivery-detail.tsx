import React, { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../src/api/client';
import Avatar from '../../src/components/Avatar';
import Badge from '../../src/components/Badge';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, RADIUS, SPACING } from '../../src/constants/theme';

const STATUS_FLOW = ['pending', 'picked_up', 'in_transit', 'delivered'] as const;

const STEP_LABELS = ['Pending', 'Picked Up', 'In Transit', 'Delivered'];

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: COLORS.warning },
  picked_up: { label: 'Picked Up', color: '#8B5CF6' },
  in_transit: { label: 'In Transit', color: '#5B8DEF' },
  delivered: { label: 'Delivered', color: COLORS.success },
  cancelled: { label: 'Cancelled', color: COLORS.red[500] },
};

interface DeliveryDetail {
  id: number;
  status: string;
  pickup_address: string;
  delivery_address: string;
  latitude?: number | null;
  longitude?: number | null;
  estimated_delivery?: string | null;
  order?: {
    id: number;
    order_number: string;
    total: number;
    items_count?: number;
    created_at: string;
    items?: { id: number; name?: string; product_name?: string; price: number; quantity: number }[];
  };
  transporter?: {
    id: number;
    name: string;
    phone?: string;
    avatar?: string;
    vehicle_type?: string;
    vehicle_plate?: string;
  };
}

function normalizeDetail(payload: unknown): DeliveryDetail {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const data = (payload as { data?: unknown }).data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as DeliveryDetail;
    }
  }
  return payload as DeliveryDetail;
}

function formatDateTime(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

function statusMeta(status: string): { label: string; color: string } {
  return STATUS_META[status] ?? {
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
    color: COLORS.gray[400],
  };
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
    </View>
  );
}

export default function DeliveryDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const deliveryId = Number(Array.isArray(params.id) ? params.id[0] : params.id);

  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDelivery = useCallback(async () => {
    if (!Number.isFinite(deliveryId)) {
      setLoadError('Invalid delivery reference.');
      setLoading(false);
      return;
    }
    try {
      const response = await api.get(`/customer/deliveries/${deliveryId}`);
      setDelivery(normalizeDetail(response.data));
      setLoadError(null);
    } catch (error: any) {
      setLoadError(
        error?.response?.data?.message || error?.message || 'Could not load this delivery.'
      );
    } finally {
      setLoading(false);
    }
  }, [deliveryId]);

  useEffect(() => {
    void fetchDelivery();
  }, [fetchDelivery]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDelivery();
    setRefreshing(false);
  }, [fetchDelivery]);

  if (loading && !delivery) {
    return <LoadingScreen />;
  }

  if (!delivery) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Header title="Delivery Detail" onBack={() => router.back()} />
        <EmptyState
          title="Delivery unavailable"
          subtitle={loadError ?? 'This delivery could not be found.'}
          actionTitle="Try Again"
          onAction={() => { setLoading(true); void fetchDelivery(); }}
        />
      </SafeAreaView>
    );
  }

  const meta = statusMeta(delivery.status);
  const flowIndex = (STATUS_FLOW as readonly string[]).indexOf(delivery.status);
  const hasCoords = delivery.latitude != null && delivery.longitude != null;
  const order = delivery.order;
  const transporter = delivery.transporter;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Delivery Detail" subtitle={meta.label} onBack={() => router.back()} />
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
        <Card style={styles.section}>
          <View style={styles.summaryRow}>
            <Badge label={meta.label} color={meta.color} />
            {order?.total != null ? <PriceTag price={order.total} /> : null}
          </View>
          <Text style={styles.orderNumber}>#{order?.order_number ?? delivery.id}</Text>
          {delivery.estimated_delivery ? (
            <Text style={styles.etaText}>
              Estimated delivery · {formatDateTime(delivery.estimated_delivery)}
            </Text>
          ) : null}
        </Card>

        {flowIndex >= 0 ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Progress</Text>
            <View style={styles.stepsRow}>
              {(STATUS_FLOW as readonly string[]).map((step, index) => (
                <React.Fragment key={step}>
                  {index > 0 ? (
                    <View style={[styles.stepLine, index <= flowIndex && styles.stepLineDone]} />
                  ) : null}
                  <View style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepDot,
                        index < flowIndex && styles.stepDotDone,
                        index === flowIndex && styles.stepDotCurrent,
                      ]}
                    >
                      {index === flowIndex ? <View style={styles.stepDotInner} /> : null}
                    </View>
                    <Text style={[styles.stepLabel, index <= flowIndex && styles.stepLabelActive]}>
                      {STEP_LABELS[index]}
                    </Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </Card>
        ) : null}

        {hasCoords ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Map Preview</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.mapPreview}
              onPress={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${delivery.latitude},${delivery.longitude}&travelmode=driving`;
                Linking.openURL(url).catch(() => {});
              }}
            >
              <View style={styles.mapPin}>
                <View style={styles.mapPinInner} />
              </View>
              <Text style={styles.mapPreviewCoords}>
                {delivery.latitude!.toFixed(5)}, {delivery.longitude!.toFixed(5)}
              </Text>
              <Text style={styles.mapPreviewHint}>Tap to open directions</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Addresses</Text>
          <View style={styles.addressBlock}>
            <View style={[styles.addressTag, { backgroundColor: COLORS.green[500] }]}>
              <Text style={styles.addressTagText}>PICKUP</Text>
            </View>
            <Text style={styles.addressText}>{delivery.pickup_address}</Text>
          </View>
          <View style={styles.addressBlock}>
            <View style={[styles.addressTag, { backgroundColor: COLORS.red[500] }]}>
              <Text style={styles.addressTagText}>DROP-OFF</Text>
            </View>
            <Text style={styles.addressText}>{delivery.delivery_address}</Text>
          </View>
        </Card>

        {transporter ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Transporter</Text>
            <View style={styles.transporterRow}>
              <Avatar uri={transporter.avatar} name={transporter.name} size={48} />
              <View style={styles.transporterInfo}>
                <Text style={styles.transporterName} numberOfLines={1}>
                  {transporter.name}
                </Text>
                {transporter.phone ? (
                  <Text style={styles.transporterPhone}>{transporter.phone}</Text>
                ) : null}
              </View>
            </View>
            {transporter.vehicle_type ? <InfoRow label="Vehicle" value={transporter.vehicle_type} /> : null}
            {transporter.vehicle_plate ? <InfoRow label="Plate" value={transporter.vehicle_plate} /> : null}
          </Card>
        ) : null}

        {order ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            <InfoRow label="Order number" value={order.order_number} />
            <InfoRow label="Items" value={order.items_count} />
            <InfoRow label="Placed" value={formatDateTime(order.created_at)} />
            {Array.isArray(order.items) && order.items.length > 0 ? (
              <View style={styles.itemsList}>
                {order.items.map((item) => (
                  <View key={String(item.id)} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name || item.product_name || `Item #${item.id}`}
                    </Text>
                    <Text style={styles.itemQty}>×{item.quantity}</Text>
                    <PriceTag price={item.price * item.quantity} size="sm" />
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <PriceTag price={order.total} size="lg" />
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl * 2,
  },
  section: {
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  orderNumber: {
    fontSize: FONTS.size.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  etaText: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs + 2,
  },
  sectionTitle: {
    fontSize: FONTS.size.sm,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepItem: {
    alignItems: 'center',
    width: 64,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotDone: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepDotCurrent: {
    borderColor: COLORS.primary,
  },
  stepDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.gray[200],
    marginTop: 9,
    marginHorizontal: -18,
  },
  stepLineDone: {
    backgroundColor: COLORS.primary,
  },
  stepLabel: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  mapPreview: {
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.gray[300],
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  mapPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  mapPinInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.white,
  },
  mapPreviewCoords: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  mapPreviewHint: {
    fontSize: FONTS.size.xs,
    color: COLORS.gray[400],
    marginTop: SPACING.sm,
  },
  addressBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  addressTag: {
    borderRadius: RADIUS.sm,
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm,
    marginTop: 1,
  },
  addressTagText: {
    color: COLORS.white,
    fontSize: FONTS.size.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addressText: {
    flex: 1,
    fontSize: FONTS.size.md,
    color: COLORS.gray[700],
    lineHeight: 21,
  },
  transporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  transporterInfo: {
    flex: 1,
  },
  transporterName: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  transporterPhone: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  infoLabel: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
  },
  infoValue: {
    flex: 1,
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
    marginLeft: SPACING.lg,
  },
  itemsList: {
    gap: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
  },
  itemName: {
    flex: 1,
    fontSize: FONTS.size.md,
    color: COLORS.text,
  },
  itemQty: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
  },
  totalLabel: {
    fontSize: FONTS.size.md,
    fontWeight: '700',
    color: COLORS.text,
  },
});
