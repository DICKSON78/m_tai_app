import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../src/api/client';
import AlertModal from '../../src/components/AlertModal';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import Input from '../../src/components/Input';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useCartStore } from '../../src/store/cartStore';
import { useAuthStore } from '../../src/store/authStore';

interface CouponResult {
  discount?: number;
  message?: string;
}

type PaymentMethod = 'cash' | 'mobile_money';

interface PlacedOrder {
  id?: number;
  order_number?: string;
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; description: string }[] = [
  {
    value: 'cash',
    label: 'Cash on Delivery',
    description: 'Pay the courier when your order arrives.',
  },
  {
    value: 'mobile_money',
    label: 'Mobile Money',
    description: 'Pay with M-Pesa, Tigo Pesa or Airtel Money.',
  },
];

function formatTZS(amount: number): string {
  const rounded = Math.round(amount);
  const withSeparators = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `TZS ${withSeparators}`;
}

function priceOf(product: { price?: number; [key: string]: any }): number {
  const price = Number(product?.price ?? 0);
  if (price > 0) return price;
  const selling = Number(product?.selling_price ?? 0);
  if (selling > 0) return selling;
  return Number(product?.retail_price ?? 0);
}

export default function CheckoutScreen() {
  const router = useRouter();

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotal = useCartStore((s) => s.getTotal);
  const user = useAuthStore((s) => s.user);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const businessId = useCartStore((s) => s.businessId);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponAppliedCode, setCouponAppliedCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponApplying, setCouponApplying] = useState(false);

  const total = useMemo(() => getTotal(), [getTotal, items]);
  const discountedTotal = useMemo(() => Math.max(0, total - couponDiscount), [total, couponDiscount]);
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    setCouponError(null);
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    if (businessId == null) {
      setCouponError('Unable to determine the store for this cart.');
      return;
    }
    setCouponApplying(true);
    try {
      const res = await api.post('/coupons/validate', {
        code,
        business_id: businessId,
        order_amount: total,
      });
      const body = res.data as CouponResult;
      setCouponDiscount(Number(body?.discount ?? 0));
      setCouponAppliedCode(code);
      setCouponCode('');
    } catch (err: any) {
      setCouponDiscount(0);
      setCouponAppliedCode(null);
      setCouponError(
        err?.response?.data?.message || 'That coupon could not be applied.'
      );
    } finally {
      setCouponApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponDiscount(0);
    setCouponAppliedCode(null);
    setCouponError(null);
  };

  const placeOrder = async () => {
    let hasError = false;
    if (!fullName.trim()) {
      setAddressError('Please enter your full name.');
      hasError = true;
    }
    if (!deliveryAddress.trim()) {
      setAddressError('Please enter your delivery address.');
      hasError = true;
    } else {
      setAddressError(null);
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone || trimmedPhone.length < 10) {
      setPhoneError('Please enter a valid phone number (at least 10 digits).');
      hasError = true;
    } else {
      setPhoneError(null);
    }

    if (hasError) return;

    setPlacingOrder(true);
    try {
      const res = await api.post('/orders/checkout', {
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        customer_name: fullName.trim(),
        customer_phone: trimmedPhone,
        delivery_address: deliveryAddress.trim(),
        payment_method: paymentMethod,
        coupon_code: couponAppliedCode ?? undefined,
      });

      const body = res.data as Record<string, any> | null;
      const order: PlacedOrder =
        body && typeof body === 'object' && body.data && typeof body.data === 'object'
          ? { id: body.data?.id, order_number: body.data?.order_number }
          : { id: body?.id, order_number: body?.order_number };

      setPlacedOrder(order ?? {});
      clearCart();
    } catch (err: any) {
      setOrderError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'We could not place your order. Please try again.'
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (placedOrder) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Order Confirmed" onBack={() => router.replace('/orders')} />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <View style={styles.checkMark} />
            <View style={[styles.checkMark, styles.checkMarkShort]} />
          </View>
          <Text style={styles.successTitle}>Thank you for your order!</Text>
          {placedOrder.order_number ? (
            <Text style={styles.successOrderNumber}>
              Order #{placedOrder.order_number}
            </Text>
          ) : null}
          <Text style={styles.successSubtitle}>
            We have received your order and it is now being processed. You can track its
            progress from your orders.
          </Text>

          <Card style={styles.successActions}>
            <Button
              title="View My Orders"
              onPress={() => router.replace('/orders')}
              size="lg"
            />
            <Button
              title="Back to Home"
              variant="outline"
              onPress={() => router.dismissTo('/')}
              size="lg"
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Checkout" onBack={() => router.back()} />
        <EmptyState
          icon={<MaterialIcons name="receipt-long" size={32} color={COLORS.gray[400]} />}
          title="Nothing to check out"
          subtitle="Your cart is empty. Add some products first."
          actionTitle="Browse Products"
          onAction={() => router.push('/')}
          style={styles.emptyContainer}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header
          title="Checkout"
          subtitle={`${itemCount} item${itemCount === 1 ? '' : 's'} · ${formatTZS(discountedTotal)}`}
          onBack={() => router.back()}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            autoCapitalize="words"
          />

          <Input
            label="Delivery Address"
            value={deliveryAddress}
            onChangeText={(text) => {
              setDeliveryAddress(text);
              if (addressError && text.trim()) setAddressError(null);
            }}
            placeholder="Street, house number, area, landmark…"
            multiline
            error={addressError ?? undefined}
          />

          <Input
            label="Phone Number"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (phoneError && text.trim().length >= 10) setPhoneError(null);
            }}
            placeholder="+255 7XX XXX XXX"
            keyboardType="phone-pad"
            error={phoneError ?? undefined}
          />

          <Text style={styles.sectionTitle}>Payment Method</Text>
          {PAYMENT_OPTIONS.map((option) => {
            const selected = paymentMethod === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.8}
                onPress={() => setPaymentMethod(option.value)}
                style={[styles.paymentOption, selected && styles.paymentOptionSelected]}
              >
                <View
                  style={[
                    styles.radioOuter,
                    selected && { borderColor: COLORS.primary },
                  ]}
                >
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentLabel}>{option.label}</Text>
                  <Text style={styles.paymentDescription}>{option.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <Text style={styles.sectionTitle}>Coupon</Text>
          {couponAppliedCode ? (
            <Card style={styles.couponCard}>
              <View style={styles.couponAppliedRow}>
                <View style={styles.couponAppliedInfo}>
                  <MaterialIcons name="local-offer" size={18} color={COLORS.primaryDark} />
                  <View>
                    <Text style={styles.couponAppliedCode}>{couponAppliedCode}</Text>
                    <Text style={styles.couponAppliedDesc}>
                      {couponDiscount > 0
                        ? `You save ${formatTZS(couponDiscount)}`
                        : 'Coupon applied'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleRemoveCoupon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.couponRemove}>Remove</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            <Card style={styles.couponCard}>
              <View style={styles.couponRow}>
                <Input
                  value={couponCode}
                  onChangeText={(text) => {
                    setCouponCode(text);
                    if (couponError) setCouponError(null);
                  }}
                  placeholder="Enter coupon code"
                  autoCapitalize="characters"
                  error={couponError ?? undefined}
                  icon={<MaterialIcons name="confirmation-number" size={20} color={COLORS.gray[400]} />}
                  style={styles.couponInput}
                />
                <Button
                  title="Apply"
                  size="md"
                  variant="outline"
                  loading={couponApplying}
                  onPress={handleApplyCoupon}
                />
              </View>
            </Card>
          )}

          <Text style={styles.sectionTitle}>Order Summary</Text>
          <Card style={styles.summaryCard}>
            {items.map(({ product, quantity }) => (
              <View key={String(product.id)} style={styles.summaryLine}>
                <Text style={styles.summaryItemName} numberOfLines={1}>
                  {product.name}
                  <Text style={styles.summaryItemQty}> × {quantity}</Text>
                </Text>
                <Text style={styles.summaryLineTotal}>
                  {formatTZS(priceOf(product) * quantity)}
                </Text>
              </View>
            ))}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Subtotal</Text>
              <Text style={styles.summaryLineTotal}>{formatTZS(total)}</Text>
            </View>
            {couponDiscount > 0 ? (
              <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Discount</Text>
                <Text style={[styles.summaryLineTotal, styles.discountValue]}>
                  −{formatTZS(couponDiscount)}
                </Text>
              </View>
            ) : null}
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>{formatTZS(discountedTotal)}</Text>
            </View>
          </Card>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Button
            title={`Place Order · ${formatTZS(discountedTotal)}`}
            size="lg"
            loading={placingOrder}
            onPress={placeOrder}
          />
        </View>

        <AlertModal
          visible={orderError !== null}
          type="error"
          title="Order Failed"
          message={orderError ?? ''}
          confirmText="Try Again"
          onConfirm={() => setOrderError(null)}
        />
      </SafeAreaView>
    </View>
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
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  paymentDescription: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 2,
  },
  couponCard: {
    gap: SPACING.sm,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  couponInput: {
    flex: 1,
  },
  couponAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  couponAppliedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexShrink: 1,
  },
  couponAppliedCode: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  couponAppliedDesc: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 1,
  },
  couponRemove: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.error,
  },
  discountValue: {
    color: COLORS.primaryDark,
    fontFamily: FONTS.semibold,
  },
  summaryCard: {
    gap: SPACING.sm + 2,
  },
  summaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  summaryItemName: {
    flex: 1,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  summaryItemQty: {
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  summaryLineTotal: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.gray[200],
    marginVertical: SPACING.xs,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTotalLabel: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.textLight,
  },
  summaryTotalValue: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  bottomBar: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray[200],
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  successIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  checkMark: {
    position: 'absolute',
    width: 34,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryDark,
    transform: [{ rotate: '45deg' }],
    left: 18,
    top: 44,
  },
  checkMarkShort: {
    width: 20,
    transform: [{ rotate: '-45deg' }],
    left: 30,
    top: 36,
  },
  successTitle: {
    fontSize: FONTS.size.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  successOrderNumber: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
    marginTop: SPACING.xs,
  },
  successSubtitle: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: SPACING.sm,
  },
  successActions: {
    alignSelf: 'stretch',
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
