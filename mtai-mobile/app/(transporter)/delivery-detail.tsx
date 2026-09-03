import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../src/api/client';
import { Delivery } from '../../src/api/types';
import Avatar from '../../src/components/Avatar';
import Badge from '../../src/components/Badge';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import DeliveryMap from '../../src/components/DeliveryMap';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';

const STATUS_FLOW = ['assigned', 'picked_up', 'in_transit', 'delivered'] as const;

type FlowStatus = (typeof STATUS_FLOW)[number];

const STEP_LABELS = ['Assigned', 'Picked Up', 'In Transit', 'Delivered'];

const NEXT_ACTION: Record<
  Exclude<FlowStatus, 'delivered'>,
  { next: FlowStatus; label: string }
> = {
  assigned: { next: 'picked_up', label: 'Start Pickup' },
  picked_up: { next: 'in_transit', label: 'In Transit' },
  in_transit: { next: 'delivered', label: 'Delivered' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: COLORS.gray[500] },
  available: { label: 'Available', color: COLORS.primary },
  assigned: { label: 'Assigned', color: COLORS.info },
  picked_up: { label: 'Picked Up', color: COLORS.primaryDark },
  in_transit: { label: 'In Transit', color: COLORS.warning },
  delivered: { label: 'Delivered', color: COLORS.success },
  cancelled: { label: 'Cancelled', color: COLORS.red[500] },
};

function normalizeDetail(payload: unknown): Delivery {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const data = (payload as { data?: unknown }).data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Delivery;
    }
  }
  return payload as Delivery;
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

function humanizeStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

function statusMeta(status: string): { label: string; color: string } {
  return STATUS_META[status] ?? { label: humanizeStatus(status), color: COLORS.gray[400] };
}

function orderLabel(delivery: Delivery): string {
  const number = delivery.order?.order_number;
  if (number) return number.startsWith('#') ? number : `#${number}`;
  return `#${delivery.id}`;
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

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
    </View>
  );
}

function AddressBlock({
  tag,
  tagColor,
  address,
}: {
  tag: string;
  tagColor: string;
  address: string;
}) {
  return (
    <View style={styles.addressBlock}>
      <View style={[styles.addressTag, { backgroundColor: tagColor }]}>
        <Text style={styles.addressTagText}>{tag}</Text>
      </View>
      <Text style={styles.addressText}>{address}</Text>
    </View>
  );
}

export default function DeliveryDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const deliveryId = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const insets = useSafeAreaInsets();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDelivery = useCallback(async () => {
    if (!Number.isFinite(deliveryId)) {
      setLoadError('Invalid delivery reference.');
      setLoading(false);
      return;
    }
    try {
      const response = await api.get(`/transporter/deliveries/${deliveryId}`);
      setDelivery(normalizeDetail(response.data));
      setLoadError(null);
    } catch (error) {
      setLoadError(extractErrorMessage(error, 'Could not load this delivery.'));
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

  const applyStatusUpdate = useCallback(
    async (next: FlowStatus, successTitle: string) => {
      if (!delivery || updating) return;
      setUpdating(true);
      try {
        const response = await api.post(`/transporter/deliveries/${delivery.id}/status`, {
          status: next,
        });
        const updated = normalizeDetail(response.data);
        setDelivery((prev) =>
          prev ? ({ ...prev, ...updated, status: updated.status ?? next } as Delivery) : prev
        );
        Alert.alert(
          successTitle,
          next === 'delivered'
            ? `Order ${orderLabel(delivery)} has been completed. Great job!`
            : `Order ${orderLabel(delivery)} is now ${humanizeStatus(next).toLowerCase()}.`
        );
      } catch (error) {
        Alert.alert('Update failed', extractErrorMessage(error, 'Please try again.'));
      } finally {
        setUpdating(false);
      }
    },
    [delivery, updating]
  );

  const handleAccept = useCallback(async () => {
    if (!delivery || accepting) return;
    setAccepting(true);
    try {
      await api.post(`/transporter/deliveries/${delivery.id}/accept`);
      await fetchDelivery();
      Alert.alert('Delivery accepted', 'Head to the pickup point to begin.');
    } catch (error) {
      Alert.alert('Could not accept', extractErrorMessage(error, 'Please try again.'));
    } finally {
      setAccepting(false);
    }
  }, [delivery, accepting, fetchDelivery]);

  const handleReject = useCallback(async () => {
    if (!delivery || rejecting) return;
    Alert.alert(
      'Reject this delivery?',
      `You will no longer be offered order ${orderLabel(delivery)}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setRejecting(true);
            try {
              await api.post(`/transporter/deliveries/${delivery.id}/reject`);
              await fetchDelivery();
              Alert.alert('Delivery rejected', 'This delivery has been released back to the pool.');
            } catch (error) {
              Alert.alert('Could not reject', extractErrorMessage(error, 'Please try again.'));
            } finally {
              setRejecting(false);
            }
          },
        },
      ]
    );
  }, [delivery, rejecting, fetchDelivery]);

  const openDirections = useCallback((latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Navigation unavailable', 'Could not open maps on this device.')
    );
  }, []);

  const callCustomer = useCallback(() => {
    const phone = delivery?.order?.customer?.phone;
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('Call failed', 'Could not place the call on this device.')
    );
  }, [delivery]);

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
          onAction={() => {
            setLoading(true);
            void fetchDelivery();
          }}
        />
      </SafeAreaView>
    );
  }

  const meta = statusMeta(delivery.status);
  const eta = formatDateTime(delivery.estimated_delivery);
  const customer = delivery.order?.customer;
  const order = delivery.order;
  const flowIndex = (STATUS_FLOW as readonly string[]).indexOf(delivery.status);
  const isCompleted = delivery.status === 'delivered';
  const isCancelled = delivery.status === 'cancelled';
  const isPendingLike = delivery.status === 'pending' || delivery.status === 'available';
  const nextAction =
    flowIndex >= 0 && flowIndex < STATUS_FLOW.length - 1
      ? NEXT_ACTION[delivery.status as Exclude<FlowStatus, 'delivered'>]
      : null;
  const destinationCoords =
    delivery.latitude != null && delivery.longitude != null
      ? { latitude: delivery.latitude, longitude: delivery.longitude }
      : null;

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
            {order ? <PriceTag price={order.total} /> : null}
          </View>
          <Text style={styles.orderNumber}>{orderLabel(delivery)}</Text>
          {eta ? <Text style={styles.etaText}>Estimated completion · {eta}</Text> : null}
        </Card>

        {flowIndex >= 0 ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Progress</Text>
            <View style={styles.stepsRow}>
              {STATUS_FLOW.map((step, index) => (
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

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          {destinationCoords ? (
            <>
              <DeliveryMap
                coordinate={destinationCoords}
                address={delivery.delivery_address}
                onNavigate={() =>
                  openDirections(destinationCoords.latitude, destinationCoords.longitude)
                }
              />
              <View style={styles.mapAddressBlock}>
                <Text style={styles.mapAddressText} numberOfLines={2}>
                  {delivery.delivery_address}
                </Text>
                <Text style={styles.mapAddressCoords}>
                  {destinationCoords.latitude.toFixed(5)}, {destinationCoords.longitude.toFixed(5)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.mapPreview}>
              <View style={styles.mapPin}>
                <View style={styles.mapPinInner} />
              </View>
              <Text style={styles.mapPreviewAddress} numberOfLines={2}>
                {delivery.delivery_address}
              </Text>
              <Text style={styles.mapPreviewHint}>
                No location coordinates have been set for this delivery yet.
              </Text>
            </View>
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Addresses</Text>
          <AddressBlock tag="PICKUP" tagColor={COLORS.green[500]} address={delivery.pickup_address} />
          <AddressBlock tag="DROP-OFF" tagColor={COLORS.red[500]} address={delivery.delivery_address} />
        </Card>

        {order ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            <InfoRow label="Order number" value={order.order_number} />
            <InfoRow label="Store" value={order.business?.name} />
            <InfoRow label="Items" value={order.items_count} />
            <InfoRow label="Placed" value={formatDateTime(order.created_at)} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Order Total</Text>
              <PriceTag price={order.total} size="lg" />
            </View>
          </Card>
        ) : null}

        {customer ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Customer</Text>
            <View style={styles.customerRow}>
              <Avatar uri={customer.avatar} name={customer.name} size={48} />
              <View style={styles.customerInfo}>
                <Text style={styles.customerName} numberOfLines={1}>
                  {customer.name}
                </Text>
                {customer.phone ? (
                  <Text style={styles.customerPhone}>{customer.phone}</Text>
                ) : null}
              </View>
              {customer.phone ? (
                <Button title="Call" variant="outline" size="sm" onPress={callCustomer} />
              ) : null}
            </View>
          </Card>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        {isCancelled ? (
          <Text style={styles.footerNoteCancelled}>This delivery was cancelled.</Text>
        ) : isCompleted ? (
          <View style={styles.completedNote}>
            <Text style={styles.completedNoteText}>Delivery complete — nothing more to do.</Text>
          </View>
        ) : isPendingLike ? (
          <View style={styles.footerActions}>
            <Button
              title="Reject"
              variant="outline"
              size="lg"
              style={styles.footerActionHalf}
              loading={rejecting}
              onPress={handleReject}
            />
            <Button
              title="Accept Delivery"
              size="lg"
              style={styles.footerActionHalf}
              onPress={handleAccept}
              loading={accepting}
            />
          </View>
        ) : nextAction ? (
          <Button
            title={nextAction.label}
            size="lg"
            onPress={() => {
              if (!nextAction) return;
              if (nextAction.next === 'delivered') {
                Alert.alert(
                  'Complete delivery?',
                  `Confirm that order ${orderLabel(delivery)} was handed over to the customer.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Yes, Delivered',
                      onPress: () => void applyStatusUpdate('delivered', 'Delivery completed'),
                    },
                  ]
                );
                return;
              }
              void applyStatusUpdate(nextAction.next, 'Status updated');
            }}
            loading={updating}
          />
        ) : null}
      </View>
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
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  etaText: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs + 2,
  },
  sectionTitle: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
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
     fontFamily: FONTS.bold,
   },
   mapAddressBlock: {
    marginTop: SPACING.sm,
    gap: 2,
  },
  mapAddressText: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  mapAddressCoords: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    fontVariant: ['tabular-nums'],
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
  mapPreviewAddress: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    textAlign: 'center',
  },
  mapPreviewCoords: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
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
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  addressText: {
    flex: 1,
    fontSize: FONTS.size.md,
    color: COLORS.gray[700],
    lineHeight: 21,
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
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    textAlign: 'right',
    marginLeft: SPACING.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
  },
  totalLabel: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  customerPhone: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray[200],
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  footerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  footerActionHalf: {
    flex: 1,
  },
  completedNote: {
    backgroundColor: COLORS.green[100],
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  completedNoteText: {
    color: COLORS.green[700],
    fontFamily: FONTS.semibold,
    fontSize: FONTS.size.md,
  },
  footerNoteCancelled: {
    color: COLORS.red[700],
    fontFamily: FONTS.semibold,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
});
