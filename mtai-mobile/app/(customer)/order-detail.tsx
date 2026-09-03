import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../src/api/client';
import { Delivery, Order } from '../../src/api/types';
import Avatar from '../../src/components/Avatar';
import Badge from '../../src/components/Badge';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { saveReceiptPdf, PdfReceipt } from '../../src/utils/pdf';
import * as Print from 'expo-print';

interface OrderItem {
  id: number;
  product_id?: number;
  quantity: number;
  price: number;
  total?: number;
  name?: string;
  product_name?: string;
  product?: { id: number; name: string };
}

interface OrderDetail extends Omit<Order, 'delivery'> {
  items?: OrderItem[];
  delivery_address?: string;
  payment_method?: string;
  subtotal?: number;
  delivery_fee?: number;
  delivery?: Delivery;
}

interface ReceiptItem {
  name: string;
  quantity: number;
  price: string;
  total: string;
}

interface ReceiptData {
  business?: { name?: string; code?: string; address?: string; phone?: string };
  order?: {
    transaction_code?: string;
    date?: string;
    status?: string;
    payment_method?: string;
  };
  items?: ReceiptItem[];
  subtotal?: string;
  discount?: string;
  tax?: string;
  total?: string;
  amount_paid?: string;
  change?: string;
  footer?: string;
}

function receiptLine(label: string, value?: string | number): string {
  const v = value ?? '';
  if (v === '' || v === null || v === undefined) return '';
  const text = String(v);
  return `${label}  ${' '.repeat(Math.max(1, 28 - label.length - text.length))}${text}`;
}

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Order Placed', hint: 'We received your order' },
  { key: 'confirmed', label: 'Confirmed', hint: 'The business confirmed your order' },
  { key: 'processing', label: 'Processing', hint: 'Your order is being prepared' },
  { key: 'out_for_delivery', label: 'Out for Delivery', hint: 'A courier is on the way' },
  { key: 'delivered', label: 'Delivered', hint: 'Enjoy your order' },
];

const STEP_STATUS_ALIASES: Record<string, string> = {
  pending: 'pending',
  awaiting_confirmation: 'pending',
  waiting: 'pending',
  new: 'pending',
  placed: 'pending',
  confirmed: 'confirmed',
  accepted: 'confirmed',
  approved: 'confirmed',
  processing: 'processing',
  preparing: 'processing',
  packing: 'processing',
  packed: 'processing',
  ready: 'processing',
  shipped: 'out_for_delivery',
  out_for_delivery: 'out_for_delivery',
  en_route: 'out_for_delivery',
  on_the_way: 'out_for_delivery',
  delivering: 'out_for_delivery',
  assigned: 'out_for_delivery',
  delivered: 'delivered',
  completed: 'delivered',
  received: 'delivered',
};

const CANCELLED_STATUSES = ['cancelled', 'canceled', 'rejected', 'failed', 'refunded'];

const DELIVERY_STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending Pickup', color: COLORS.warning },
  assigned: { label: 'Courier Assigned', color: '#5B8DEF' },
  picked_up: { label: 'Picked Up', color: '#8B5CF6' },
  in_transit: { label: 'In Transit', color: '#8B5CF6' },
  out_for_delivery: { label: 'Out for Delivery', color: '#8B5CF6' },
  delivered: { label: 'Delivered', color: COLORS.success },
  failed: { label: 'Delivery Failed', color: COLORS.error },
};

function unwrap<T>(payload: unknown): T {
  const body = payload as Record<string, any> | null;
  if (body && typeof body === 'object' && !Array.isArray(body.data) && 'data' in body) {
    return body.data as T;
  }
  return payload as T;
}

function formatTZS(amount: number): string {
  const rounded = Math.round(amount);
  const withSeparators = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `TZS ${withSeparators}`;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${month} ${day}, ${year} · ${hours}:${minutes} ${ampm}`;
}

function getStepIndex(status: string): number {
  const normalized = STEP_STATUS_ALIASES[(status || '').toLowerCase()] ?? 'pending';
  return TIMELINE_STEPS.findIndex((step) => step.key === normalized);
}

function getItemName(item: OrderItem): string {
  return item.product?.name || item.product_name || item.name || `Item #${item.product_id ?? item.id}`;
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [receiptVisible, setReceiptVisible] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const fetchReceipt = useCallback(async () => {
    if (!orderId) return;
    setReceiptLoading(true);
    setReceiptError(null);
    try {
      const res = await api.get(`/orders/${orderId}/receipt`);
      const body = res.data as { receipt?: ReceiptData } | null;
      setReceipt(body?.receipt ?? null);
    } catch (err: any) {
      setReceiptError(
        err?.response?.status === 403
          ? 'You do not have access to this receipt.'
          : err?.response?.data?.message ||
              err?.message ||
              'Could not load the receipt.'
      );
      setReceipt(null);
    } finally {
      setReceiptLoading(false);
    }
  }, [orderId]);

  const openReceipt = useCallback(() => {
    setReceiptVisible(true);
    fetchReceipt();
  }, [fetchReceipt]);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setError('Order not found.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(unwrap<OrderDetail>(res.data));
    } catch (err: any) {
      setError(
        err?.response?.status === 404
          ? 'This order could not be found.'
          : err?.response?.data?.message ||
              err?.message ||
              'Something went wrong while loading the order.'
      );
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancelOrder = useCallback(async () => {
    if (!order || cancelling) return;
    Alert.alert(
      'Cancel order?',
      `This will cancel order #${order.order_number}. This cannot be undone.`,
      [
        { text: 'Keep Order', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await api.post(`/customer/orders/${order.id}/cancel`);
              await fetchOrder();
              Alert.alert(
                'Order cancelled',
                `Order #${order.order_number} has been cancelled.`
              );
            } catch (err: any) {
              Alert.alert(
                'Could not cancel order',
                err?.response?.data?.message || err?.message || 'Please try again.'
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  }, [order, cancelling, fetchOrder]);

  const statusMeta = useMemo(() => {
    const raw = (order?.status || '').toLowerCase();
    const cancelled = CANCELLED_STATUSES.includes(raw);
    let label: string = raw
      .split(/[_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    let color: string = COLORS.warning;
    if (!cancelled) {
      const stepIdx = getStepIndex(order?.status || '');
      color = stepIdx >= TIMELINE_STEPS.length - 1 ? COLORS.success : '#5B8DEF';
    }
    if (raw === 'refunded') color = COLORS.gray[500];
    return { label: label || 'Unknown', color, cancelled };
  }, [order?.status]);

  const currentStep = useMemo(() => getStepIndex(order?.status || ''), [order?.status]);

  const canCancel = !statusMeta.cancelled && currentStep <= 0;

  const items = useMemo(() => order?.items ?? [], [order]);

  const computedSubtotal = useMemo(() => {
    if (typeof order?.subtotal === 'number') return order.subtotal;
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [order?.subtotal, items]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const deliveryMeta = useMemo(() => {
    if (!order?.delivery) return null;
    const key = (order.delivery.status || '').toLowerCase();
    return (
      DELIVERY_STATUS_META[key] ?? {
        label: key
          .split(/[_\s]+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ') || 'Assigned',
        color: COLORS.gray[500],
      }
    );
  }, [order?.delivery]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Order Details" onBack={() => router.back()} />
        <EmptyState
          title="Could not load order"
          subtitle={error ?? 'Please try again.'}
          actionTitle="Retry"
          onAction={fetchOrder}
          style={styles.emptyContainer}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header
          title="Order Details"
          subtitle={`#${order.order_number}`}
          onBack={() => router.back()}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryHeaderRow}>
              <View>
                <Text style={styles.orderNumber}>#{order.order_number}</Text>
                <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
              </View>
              <Badge
                label={statusMeta.label}
                color={statusMeta.cancelled ? COLORS.red[100] : COLORS.primaryLight}
                textColor={statusMeta.cancelled ? COLORS.red[700] : COLORS.primaryDark}
                size="md"
              />
            </View>

            {statusMeta.cancelled ? (
              <View style={styles.cancelledBanner}>
                <Text style={styles.cancelledText}>
                  This order was {statusMeta.label.toLowerCase()}. Contact support if you think this
                  is a mistake.
                </Text>
              </View>
            ) : (
              <View style={styles.timeline}>
                {TIMELINE_STEPS.map((step, index) => {
                  const done = index < currentStep;
                  const active = index === currentStep;
                  const isLast = index === TIMELINE_STEPS.length - 1;
                  return (
                    <View key={step.key} style={styles.timelineStep}>
                      <View style={styles.timelineTrackWrap}>
                        <View
                          style={[
                            styles.timelineDot,
                            (done || active) && styles.timelineDotDone,
                            active && styles.timelineDotActive,
                          ]}
                        >
                          {done ? <Text style={styles.timelineCheck}>✓</Text> : null}
                        </View>
                        {!isLast ? (
                          <View
                            style={[
                              styles.timelineLine,
                              index < currentStep && styles.timelineLineDone,
                            ]}
                          />
                        ) : null}
                      </View>
                      <View style={styles.timelineContent}>
                        <Text
                          style={[
                            styles.timelineLabel,
                            (done || active) && styles.timelineLabelDone,
                            active && styles.timelineLabelActive,
                          ]}
                        >
                          {step.label}
                        </Text>
                        {(active || done) && step.hint ? (
                          <Text style={styles.timelineHint}>{step.hint}</Text>
                        ) : null}
                      </View>
</View>
                );
                })}
              </View>
            )}
            {canCancel ? (
              <Button
                title="Cancel Order"
                variant="danger"
                size="md"
                loading={cancelling}
                onPress={handleCancelOrder}
              />
            ) : null}

            <View style={styles.summaryActions}>
              <Button
                title="View Receipt"
                variant="outline"
                size="md"
                onPress={openReceipt}
              />
            </View>
          </Card>

          {deliveryMeta && order.delivery ? (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Delivery</Text>
              <Badge label={deliveryMeta.label} color={deliveryMeta.color} size="sm" style={styles.deliveryBadge} />

              {order.delivery.transporter ? (
                <View style={styles.transporterRow}>
                  <Avatar name={order.delivery.transporter.name} uri={order.delivery.transporter.avatar} size={40} />
                  <View style={styles.transporterInfo}>
                    <Text style={styles.transporterName}>{order.delivery.transporter.name}</Text>
                    <Text style={styles.transporterRole}>Your courier</Text>
                  </View>
                  {order.delivery.transporter.phone ? (
                    <Text style={styles.transporterPhone}>{order.delivery.transporter.phone}</Text>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.addressBlock}>
                <Text style={styles.addressLabel}>Pickup</Text>
                <Text style={styles.addressValue}>{order.delivery.pickup_address}</Text>
                <Text style={[styles.addressLabel, styles.addressLabelSpaced]}>Drop-off</Text>
                <Text style={styles.addressValue}>
                  {order.delivery.delivery_address || order.delivery_address || '—'}
                </Text>
                {order.delivery.estimated_delivery ? (
                  <>
                    <Text style={[styles.addressLabel, styles.addressLabelSpaced]}>Estimated</Text>
                    <Text style={styles.addressValue}>
                      {formatDate(order.delivery.estimated_delivery)}
                    </Text>
                  </>
                ) : null}
              </View>
            </Card>
          ) : null}

          <Card style={styles.card}>
            <View style={styles.itemsHeaderRow}>
              <Text style={styles.cardTitle}>Items</Text>
              <Text style={styles.itemsCount}>{itemCount} item{itemCount === 1 ? '' : 's'}</Text>
            </View>

            {items.length === 0 ? (
              <Text style={styles.noItems}>Item details are unavailable.</Text>
            ) : (
              items.map((item) => (
                <View key={String(item.id)} style={styles.itemRow}>
                  <View style={styles.itemThumbPlaceholder}>
                    <Text style={styles.itemThumbInitial}>
                      {getItemName(item).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {getItemName(item)}
                    </Text>
                    <Text style={styles.itemQty}>
                      {formatTZS(item.price)} × {item.quantity}
                    </Text>
                  </View>
                  <PriceTag price={item.total ?? item.price * item.quantity} size="sm" />
                </View>
              ))
            )}

            <View style={styles.totalsDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatTZS(computedSubtotal)}</Text>
            </View>
            {typeof order.delivery_fee === 'number' ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Delivery Fee</Text>
                <Text style={styles.totalValue}>{formatTZS(order.delivery_fee)}</Text>
              </View>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <PriceTag price={order.total} size="md" />
            </View>
          </Card>

          {order.business?.name || order.payment_method || order.delivery_address ? (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Other Information</Text>
              {order.business?.name ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Business</Text>
                  <Text style={styles.infoValue}>{order.business.name}</Text>
                </View>
              ) : null}
              {order.payment_method ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payment</Text>
                  <Text style={styles.infoValue}>
                    {order.payment_method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                </View>
              ) : null}
              {order.delivery_address ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={[styles.infoValue, styles.infoValueFlexible]}>
                    {order.delivery_address}
                  </Text>
                </View>
              ) : null}
            </Card>
          ) : null}
        </ScrollView>

        <ReceiptModal
          visible={receiptVisible}
          loading={receiptLoading}
          error={receiptError}
          receipt={receipt}
          onClose={() => setReceiptVisible(false)}
          onRetry={fetchReceipt}
        />
      </SafeAreaView>
    </View>
  );
}

function ReceiptModal({
  visible,
  loading,
  error,
  receipt,
  onClose,
  onRetry,
}: {
  visible: boolean;
  loading: boolean;
  error: string | null;
  receipt: ReceiptData | null;
  onClose: () => void;
  onRetry: () => void;
}) {
  const renderReceiptBody = () => {
    if (loading) {
      return <Text style={styles.receiptStatus}>Loading receipt…</Text>;
    }
    if (error) {
      return (
        <View style={styles.receiptErrorWrap}>
          <Text style={styles.receiptStatus}>{error}</Text>
          <Button title="Retry" variant="outline" size="sm" onPress={onRetry} />
        </View>
      );
    }
    if (!receipt) {
      return (
        <Text style={styles.receiptStatus}>Receipt details are unavailable.</Text>
      );
    }

    const business = receipt.business ?? {};
    const orderMeta = receipt.order ?? {};
    const items = receipt.items ?? [];

    const lines: string[] = [];
    if (orderMeta.transaction_code) lines.push(receiptLine('Transaction', orderMeta.transaction_code));
    if (orderMeta.date) lines.push(receiptLine('Date', orderMeta.date));
    if (orderMeta.payment_method) lines.push(receiptLine('Payment', orderMeta.payment_method));

    return (
      <View style={styles.receiptBody}>
        {business.name || business.code || business.phone ? (
          <View style={styles.receiptBusiness}>
            {business.name ? <Text style={styles.receiptBusinessName}>{business.name}</Text> : null}
            {business.code ? <Text style={styles.receiptBusinessCode}>{business.code}</Text> : null}
            {business.phone ? <Text style={styles.receiptMono}>{business.phone}</Text> : null}
          </View>
        ) : null}

        {lines.length > 0 ? (
          <View style={styles.receiptMetaBlock}>
            {lines.map((line) => (
              <Text key={line} style={styles.receiptMono}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.receiptDivider} />

        {items.length > 0 ? (
          <View style={styles.receiptItems}>
            {items.map((item, index) => (
              <View key={`${item.name}-${index}`} style={styles.receiptItemRow}>
                <View style={styles.receiptItemInfo}>
                  <Text style={styles.receiptMono} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.receiptItemQty}>
                    {receiptLine('Qty', item.quantity)}
                  </Text>
                </View>
                <Text style={styles.receiptMono}>{receiptLine('Price', item.price)}</Text>
                <Text style={styles.receiptMono}>{receiptLine('Total', item.total)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.receiptDivider} />

        <View style={styles.receiptTotals}>
          <Text style={styles.receiptMono}>{receiptLine('Subtotal', receipt.subtotal)}</Text>
          {receipt.discount && Number(receipt.discount) > 0 ? (
            <Text style={styles.receiptMono}>
              {receiptLine('Discount', `-${receipt.discount}`)}
            </Text>
          ) : null}
          <Text style={styles.receiptMono}>{receiptLine('Tax', receipt.tax)}</Text>
          <Text style={styles.receiptMono}>
            {receiptLine('TOTAL', receipt.total)}
          </Text>
          <Text style={styles.receiptMono}>{receiptLine('Paid', receipt.amount_paid)}</Text>
          <Text style={styles.receiptMono}>{receiptLine('Change', receipt.change)}</Text>
        </View>

        {receipt.footer ? (
          <View style={styles.receiptFooter}>
            <Text style={styles.receiptFooterText}>{receipt.footer}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.receiptBackdrop}>
        <TouchableOpacity style={styles.receiptBackdropTouch} activeOpacity={1} onPress={onClose} />
        <View style={styles.receiptCard}>
          <View style={styles.receiptCardHeader}>
            <Text style={styles.receiptCardTitle}>Receipt</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {receipt && !loading ? (
                <TouchableOpacity onPress={() => saveReceiptPdf(receipt as PdfReceipt).catch(() => Alert.alert('Error', 'Could not generate PDF.'))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="picture-as-pdf" size={22} color="#00D4AA" />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={22} color={COLORS.gray[400]} />
              </TouchableOpacity>
            </View>
          </View>
          {renderReceiptBody()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  summaryCard: {
    gap: SPACING.md,
  },
  summaryActions: {
    gap: SPACING.sm,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  orderNumber: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  orderDate: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  cancelledBanner: {
    backgroundColor: COLORS.red[100],
    borderRadius: 8,
    padding: SPACING.sm + 4,
  },
  cancelledText: {
    fontSize: FONTS.size.sm,
    color: COLORS.red[700],
    lineHeight: 20,
  },
  timeline: {},
  timelineStep: {
    flexDirection: 'row',
    minHeight: 52,
  },
  timelineTrackWrap: {
    width: 26,
    alignItems: 'center',
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotDone: {
    borderColor: COLORS.primaryDark,
    backgroundColor: COLORS.primaryLight,
  },
  timelineDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timelineCheck: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
    marginTop: -1,
  },
  timelineLine: {
    flex: 1,
    width: 2.5,
    minHeight: 28,
    backgroundColor: COLORS.gray[200],
    borderRadius: 2,
  },
  timelineLineDone: {
    backgroundColor: COLORS.primaryDark,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: SPACING.sm + 4,
    paddingTop: 1,
    paddingBottom: SPACING.sm + 4,
  },
  timelineLabel: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.gray[400],
  },
  timelineLabelDone: {
    color: COLORS.text,
  },
  timelineLabelActive: {
    color: COLORS.primaryDark,
    fontFamily: FONTS.bold,
  },
  timelineHint: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  card: {
    gap: SPACING.sm + 2,
  },
  cardTitle: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemsCount: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  noItems: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
  },
  itemThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemThumbInitial: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  itemQty: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  totalsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.gray[200],
    marginTop: SPACING.xs,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
  },
  totalLabel: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
  },
  totalValue: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  grandTotalLabel: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  deliveryBadge: {
    alignSelf: 'flex-start',
  },
  transporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  },
  transporterInfo: {
    flex: 1,
  },
  transporterName: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  transporterRole: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  transporterPhone: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.primaryDark,
  },
  addressBlock: {
    gap: 2,
  },
  addressLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.gray[400],
  },
  addressLabelSpaced: {
    marginTop: SPACING.sm,
  },
  addressValue: {
    fontSize: FONTS.size.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  infoLabel: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.textLight,
    minWidth: 72,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  infoValueFlexible: {
    textAlign: undefined,
    flex: 1,
    textAlignVertical: 'top',
  },
  receiptBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  receiptBackdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.lg,
  },
  receiptCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptCardTitle: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  receiptStatus: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  receiptErrorWrap: {
    gap: SPACING.sm,
    alignItems: 'center',
  },
  receiptBody: {
    gap: SPACING.xs,
  },
  receiptBusiness: {
    alignItems: 'center',
    gap: 2,
    marginBottom: SPACING.xs,
  },
  receiptBusinessName: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  receiptBusinessCode: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  receiptMetaBlock: {
    gap: 2,
  },
  receiptDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.gray[300],
    marginVertical: SPACING.xs,
  },
  receiptMono: {
    fontFamily: Platform.select({ android: 'monospace', default: 'Courier' }),
    fontSize: FONTS.size.sm,
    color: COLORS.text,
  },
  receiptItems: {
    gap: SPACING.xs + 2,
  },
  receiptItemRow: {
    gap: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[100],
    paddingBottom: SPACING.xs + 2,
  },
  receiptItemInfo: {
    gap: 1,
  },
  receiptItemQty: {
    fontSize: FONTS.size.sm,
  },
  receiptTotals: {
    gap: 2,
  },
  receiptFooter: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray[300],
    alignItems: 'center',
  },
  receiptFooterText: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
