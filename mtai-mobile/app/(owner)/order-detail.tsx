import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../src/api/client';
import { Order } from '../../src/api/types';
import Avatar from '../../src/components/Avatar';
import Badge from '../../src/components/Badge';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, SPACING } from '../../src/constants/theme';
import { saveReceiptPdf, PdfReceipt } from '../../src/utils/pdf';

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
  subtotal?: number;
  tax?: number;
  tax_amount?: number;
  discount?: number;
  notes?: string;
  payment_method?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning,
  confirmed: COLORS.info,
  accepted: COLORS.info,
  processing: COLORS.info,
  preparing: COLORS.warning,
  shipped: COLORS.primaryDark,
  out_for_delivery: COLORS.primaryDark,
  delivered: COLORS.success,
  completed: COLORS.success,
  cancelled: COLORS.error,
  canceled: COLORS.error,
};

function getStatusMeta(status: string): { label: string; color: string } {
  const key = (status || '').toLowerCase();
  const color = STATUS_COLORS[key] ?? COLORS.gray[500];
  const label = key
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { label: label || 'Unknown', color };
}

function unwrap<T>(payload: unknown): T {
  const body = payload as Record<string, any> | null;
  if (body && typeof body === 'object' && !Array.isArray(body.data) && 'data' in body) {
    return body.data as T;
  }
  return payload as T;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getItemName(item: OrderItem): string {
  return item.product?.name || item.product_name || item.name || `Item #${item.product_id ?? item.id}`;
}

export default function OwnerOrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

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

  const statusMeta = useMemo(() => getStatusMeta(order?.status || ''), [order?.status]);
  const isPending = order?.status?.toLowerCase() === 'pending';
  const isProcessing = order?.status?.toLowerCase() === 'processing';
  const items = useMemo(() => order?.items ?? [], [order]);

  const computedSubtotal = useMemo(() => {
    if (typeof order?.subtotal === 'number') return order.subtotal;
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [order?.subtotal, items]);

  const taxAmount = order?.tax ?? order?.tax_amount ?? 0;

  const updateStatus = useCallback(
    async (newStatus: string) => {
      if (!order || updating) return;
      setUpdating(true);
      try {
        const res = await api.post(`/owner/orders/${order.id}/status`, { status: newStatus });
        const updated = unwrap<OrderDetail>(res.data);
        setOrder((prev) => (prev ? { ...prev, ...updated, status: updated.status ?? newStatus } : prev));
        Alert.alert('Status Updated', `Order #${order.order_number} is now ${newStatus}.`);
      } catch (err: any) {
        Alert.alert(
          'Update Failed',
          err?.response?.data?.message || err?.message || 'Could not update order status.'
        );
      } finally {
        setUpdating(false);
      }
    },
    [order, updating]
  );

  if (loading) return <LoadingScreen />;

  if (!order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Order Detail" onBack={() => router.back()} />
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

  const customerName = order.customer?.name ?? 'Walk-in Customer';

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header
          title="Order Detail"
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
              <Badge label={statusMeta.label} color={statusMeta.color} size="md" />
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Customer</Text>
            <View style={styles.customerRow}>
              <Avatar uri={order.customer?.avatar} name={customerName} size={44} />
              <View style={styles.customerInfo}>
                <Text style={styles.customerName} numberOfLines={1}>{customerName}</Text>
                {order.customer?.phone ? (
                  <Text style={styles.customerPhone}>{order.customer.phone}</Text>
                ) : null}
                {order.customer?.email ? (
                  <Text style={styles.customerEmail} numberOfLines={1}>{order.customer.email}</Text>
                ) : null}
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.itemsHeaderRow}>
              <Text style={styles.cardTitle}>Items</Text>
              <Text style={styles.itemsCount}>{items.length} {items.length === 1 ? 'item' : 'items'}</Text>
            </View>

            {items.map((item) => (
              <View key={String(item.id)} style={styles.itemRow}>
                <View style={styles.itemThumb}>
                  <Text style={styles.itemThumbText}>{getItemName(item).charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{getItemName(item)}</Text>
                  <Text style={styles.itemQty}>TZS {Math.round(item.price).toLocaleString('en-US')} x {item.quantity}</Text>
                </View>
                <Text style={styles.itemTotal}>
                  TZS {Math.round(item.total ?? item.price * item.quantity).toLocaleString('en-US')}
                </Text>
              </View>
            ))}

            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>TZS {Math.round(computedSubtotal).toLocaleString('en-US')}</Text>
            </View>
            {taxAmount > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax</Text>
                <Text style={styles.totalValue}>TZS {Math.round(taxAmount).toLocaleString('en-US')}</Text>
              </View>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <PriceTag price={order.total} size="md" />
            </View>
          </Card>

          {order.notes ? (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Notes</Text>
              <Text style={styles.notes}>{order.notes}</Text>
            </Card>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          {order ? (
            <Button
              title="Share Receipt PDF"
              size="lg"
              variant="outline"
              onPress={async () => {
                try {
                  const rcRes = await api.get(`/orders/${order.id}/receipt`);
                  const rcBody = rcRes.data as { receipt?: PdfReceipt } | null;
                  if (rcBody?.receipt) {
                    await saveReceiptPdf(rcBody.receipt);
                  } else {
                    Alert.alert('Receipt', 'Receipt data is unavailable for PDF generation.');
                  }
                } catch {
                  Alert.alert('Receipt', 'Could not generate the receipt PDF.');
                }
              }}
            />
          ) : null}
          {isPending ? (
            <Button
              title="Mark Processing"
              size="lg"
              onPress={() => updateStatus('processing')}
              loading={updating}
            />
          ) : null}
          {isPending || isProcessing ? (
            <Button
              title="Mark Completed"
              size="lg"
              variant={isPending ? 'secondary' : 'primary'}
              onPress={() => updateStatus('completed')}
              loading={updating}
              disabled={updating}
            />
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xxl * 3, gap: SPACING.md },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  summaryCard: { gap: SPACING.sm },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  orderNumber: { fontSize: FONTS.size.xl, fontFamily: FONTS.bold, color: COLORS.text },
  orderDate: { fontSize: FONTS.size.sm, color: COLORS.textLight, marginTop: 2 },
  card: { gap: SPACING.sm + 2 },
  cardTitle: { fontSize: FONTS.size.lg, fontFamily: FONTS.bold, color: COLORS.text },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + 2 },
  customerInfo: { flex: 1 },
  customerName: { fontSize: FONTS.size.md, fontFamily: FONTS.semibold, color: COLORS.text },
  customerPhone: { fontSize: FONTS.size.sm, color: COLORS.textLight, marginTop: 2 },
  customerEmail: { fontSize: FONTS.size.sm, color: COLORS.textLight },
  itemsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemsCount: { fontSize: FONTS.size.sm, color: COLORS.textLight },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + 2 },
  itemThumb: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.teal[50], justifyContent: 'center', alignItems: 'center',
  },
  itemThumbText: { fontSize: FONTS.size.md, fontFamily: FONTS.bold, color: COLORS.primaryDark },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: FONTS.size.md, fontFamily: FONTS.semibold, color: COLORS.text },
  itemQty: { fontSize: FONTS.size.sm, color: COLORS.textLight },
  itemTotal: { fontSize: FONTS.size.md, fontFamily: FONTS.semibold, color: COLORS.text },
  divider: {
    height: StyleSheet.hairlineWidth, backgroundColor: COLORS.gray[200], marginTop: SPACING.xs,
  },
  totalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: SPACING.xs,
  },
  totalLabel: { fontSize: FONTS.size.md, color: COLORS.textLight },
  totalValue: { fontSize: FONTS.size.md, fontFamily: FONTS.semibold, color: COLORS.text },
  grandTotalLabel: { fontSize: FONTS.size.md, fontFamily: FONTS.bold, color: COLORS.text },
  notes: { fontSize: FONTS.size.md, color: COLORS.textLight, lineHeight: 22 },
  footer: {
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, paddingTop: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.gray[200],
    gap: SPACING.sm,
  },
});
