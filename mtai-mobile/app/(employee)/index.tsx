import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../src/api/client';
import { Product } from '../../src/api/types';
import Button from '../../src/components/Button';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import PriceTag from '../../src/components/PriceTag';
import SearchBar from '../../src/components/SearchBar';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useCartStore } from '../../src/store/cartStore';
import { saveReceiptPdf, PdfReceipt } from '../../src/utils/pdf';

const SEARCH_DEBOUNCE_MS = 350;

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'mobile_money', label: 'Mobile Money' },
] as const;

type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

interface PageResult<T> {
  items: T[];
}

function normalizePaginated<T>(payload: unknown): PageResult<T> {
  const body = payload as Record<string, any> | null;
  const paginated =
    body && typeof body === 'object' && Array.isArray(body.data?.data) ? body.data : body;
  const items: T[] = Array.isArray(paginated?.data) ? paginated.data : [];
  return { items };
}

export default function PosScreen() {
  const user = useAuthStore((state) => state.user);
  const businessId = user?.current_business_id ?? null;

  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [scanVisible, setScanVisible] = useState(false);
  const [scanValue, setScanValue] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [completing, setCompleting] = useState(false);

  const requestSeqRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchText.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchProducts = useCallback(async (query: string): Promise<Product[]> => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;
    setSearching(true);
    try {
      const res = await api.get('/shop/products', {
        params: { search: query || undefined, per_page: 20 },
      });
      if (requestId !== requestSeqRef.current) return [];
      return normalizePaginated<Product>(res.data).items;
    } catch {
      if (requestId !== requestSeqRef.current) return [];
      return [];
    } finally {
      if (requestId === requestSeqRef.current) {
        setSearching(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      requestSeqRef.current += 1;
      setResults([]);
      setSearching(false);
      return;
    }
    fetchProducts(searchQuery).then(setResults);
  }, [searchQuery, fetchProducts]);

  const total = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [cartItems]
  );
  const itemCount = useMemo(() => cartItems.reduce((sum, i) => sum + i.quantity, 0), [cartItems]);

  const addProductToCart = useCallback(
    (product: Product) => {
      if (product.quantity <= 0) {
        Alert.alert('Out of Stock', `“${product.name}” has no stock available.`);
        return false;
      }
      addItem(product, businessId ?? 0);
      return true;
    },
    [addItem, businessId]
  );

  const lookupCode = useCallback(
    async (rawCode: string): Promise<boolean> => {
      const code = rawCode.trim();
      if (!code) return false;

      setLookupLoading(true);
      try {
        const products = await fetchProducts(code);
        const needle = code.toLowerCase();
        const exact =
          products.find(
            (p) =>
              p.barcode?.toLowerCase() === needle ||
              p.sku?.toLowerCase() === needle ||
              p.name.toLowerCase() === needle
          ) ?? (products.length === 1 ? products[0] : null);

        if (!exact) {
          Alert.alert('Not Found', `No product matches “${code}”.`);
          return false;
        }
        return addProductToCart(exact);
      } catch {
        Alert.alert('Error', 'Could not look up that code. Please try again.');
        return false;
      } finally {
        setLookupLoading(false);
      }
    },
    [fetchProducts, addProductToCart]
  );

  const submitScan = useCallback(async () => {
    const ok = await lookupCode(scanValue);
    if (ok) {
      setScanValue('');
      setScanVisible(false);
    }
  }, [lookupCode, scanValue]);

  const completeSale = useCallback(async () => {
    if (cartItems.length === 0 || completing) return;

    setCompleting(true);
    try {
      const res = await api.post('/orders/checkout', {
        items: cartItems.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        payment_method: paymentMethod,
        channel: 'pos',
        ...(businessId ? { business_id: businessId } : {}),
      });

      const body = res.data as Record<string, any> | null;
      const order =
        body && typeof body === 'object' && body.data && typeof body.data === 'object'
          ? body.data
          : body;

      clearCart();
      setSearchText('');

      const orderId = order?.id;
      const orderLabel = order?.order_number ? `Order #${order.order_number}` : 'The sale';

      Alert.alert(
        'Sale Complete',
        `${orderLabel} was recorded successfully.`,
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Share Receipt PDF',
            onPress: async () => {
              try {
                const rcRes = await api.get(`/orders/${orderId}/receipt`);
                const rcBody = rcRes.data as { receipt?: PdfReceipt } | null;
                if (rcBody?.receipt) {
                  await saveReceiptPdf(rcBody.receipt);
                } else {
                  Alert.alert('Receipt', 'Receipt data is unavailable for PDF generation.');
                }
              } catch {
                Alert.alert('Receipt', 'Could not generate the receipt PDF.');
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Sale Failed',
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
        'We could not record this sale. Please try again.'
      );
    } finally {
      setCompleting(false);
    }
  }, [cartItems, completing, paymentMethod, businessId, clearCart]);

  const renderProductResult = useCallback(
    ({ item }: { item: Product }) => (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.resultCard}
        onPress={() => addProductToCart(item)}
        disabled={item.quantity <= 0}
      >
        <Text style={styles.resultName} numberOfLines={2}>
          {item.name}
        </Text>
        <PriceTag price={item.price} size="sm" />
        <Text
          style={[
            styles.resultStock,
            { color: item.quantity > 0 ? COLORS.textLight : COLORS.error },
          ]}
        >
          {item.quantity > 0 ? `${item.quantity} in stock` : 'Out of stock'}
        </Text>
        <View style={[styles.resultAdd, item.quantity <= 0 && { opacity: 0.4 }]}>
          <Text style={styles.resultAddText}>+ Add</Text>
        </View>
      </TouchableOpacity>
    ),
    [addProductToCart]
  );

  const renderCartItem = useCallback(
    ({ item }: { item: (typeof cartItems)[number] }) => {
      const atStockLimit =
        item.product.quantity > 0 && item.quantity >= item.product.quantity;
      return (
        <View style={styles.cartRow}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartName} numberOfLines={1}>
              {item.product.name}
            </Text>
            <PriceTag price={item.product.price} size="sm" />
          </View>

          <View style={styles.stepper}>
            <TouchableOpacity
              onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
              activeOpacity={0.7}
              style={styles.stepButton}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.stepText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepQty}>{item.quantity}</Text>
            <TouchableOpacity
              onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
              activeOpacity={0.7}
              style={[styles.stepButton, styles.stepPlus, atStockLimit && styles.stepDisabled]}
              disabled={atStockLimit}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={[styles.stepText, styles.stepPlusText]}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cartRight}>
            <PriceTag price={item.product.price * item.quantity} size="md" />
            <TouchableOpacity
              onPress={() => removeItem(item.product.id)}
              activeOpacity={0.7}
              style={styles.removeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={12} color={COLORS.red[700]} />
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [updateQuantity, removeItem]
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.headerSection}>
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search products by name…"
        />

        <View style={styles.scanRow}>
          <TouchableOpacity
            style={styles.scanButton}
            activeOpacity={0.8}
            onPress={() => {
              setScanValue('');
              setScanVisible(true);
            }}
          >
            <MaterialIcons name="center-focus-strong" size={20} color={COLORS.white} />
            <Text style={styles.scanButtonText}>Scan</Text>
          </TouchableOpacity>
          <Text style={styles.scanHint}>Scan or type a barcode / SKU to add it instantly.</Text>
        </View>

        {searchQuery ? (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeaderRow}>
              <Text style={styles.resultsTitle}>Results</Text>
              {searching ? <ActivityIndicator size="small" color={COLORS.primary} /> : null}
            </View>
            {results.length > 0 ? (
              <FlatList
                data={results.slice(0, 10)}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderProductResult}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.resultsList}
                keyboardShouldPersistTaps="handled"
              />
            ) : !searching ? (
              <Text style={styles.noResults}>No products found for “{searchQuery}”.</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.cartHeaderRow}>
          <Text style={styles.sectionTitle}>Cart</Text>
          {cartItems.length > 0 ? (
            <TouchableOpacity onPress={clearCart} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8 }}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    ),
    [
      searchText,
      searchQuery,
      searching,
      results,
      cartItems.length,
      renderProductResult,
      clearCart,
    ]
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Header title="Point of Sale" subtitle={user?.name ? `Cashier · ${user.name}` : undefined} />

          <FlatList
            data={cartItems}
            keyExtractor={(item) => String(item.product.id)}
            renderItem={renderCartItem}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              <EmptyState
                icon={<MaterialIcons name="shopping-cart" size={32} color={COLORS.gray[400]} />}
                title="Cart is empty"
                subtitle="Search for a product or scan a barcode to start a sale."
                style={styles.emptyState}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />

          <View style={styles.bottomBar}>
            <View style={styles.paymentRow}>
              {PAYMENT_METHODS.map((option) => {
                const selected = paymentMethod === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.8}
                    onPress={() => setPaymentMethod(option.value)}
                    style={[styles.paymentChip, selected && styles.paymentChipSelected]}
                  >
                    <Text
                      style={[
                        styles.paymentChipText,
                        selected && styles.paymentChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>{itemCount} item{itemCount === 1 ? '' : 's'}</Text>
                <PriceTag price={total} size="lg" />
              </View>
              <Button
                title={`Complete Sale${total > 0 ? ` · TZS ${Math.round(total).toLocaleString('en-US')}` : ''}`}
                size="lg"
                loading={completing}
                disabled={cartItems.length === 0}
                onPress={completeSale}
                style={styles.completeButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={scanVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setScanVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setScanVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Scan Barcode</Text>
            <Text style={styles.modalSubtitle}>
              Point your hardware scanner or type the barcode / SKU below.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={scanValue}
              onChangeText={setScanValue}
              placeholder="Barcode or SKU"
              placeholderTextColor={COLORS.gray[400]}
              autoFocus
              autoCapitalize="characters"
              autoCorrect={false}
              onSubmitEditing={submitScan}
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setScanVisible(false)}
                disabled={lookupLoading}
                style={styles.modalButton}
              />
              <Button
                title="Add Item"
                onPress={submitScan}
                loading={lookupLoading}
                disabled={!scanValue.trim()}
                style={styles.modalButton}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  flex: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: SPACING.md,
  },
  headerSection: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs + 2,
    ...SHADOWS.sm,
  },
  scanButtonText: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  scanHint: {
    flex: 1,
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    lineHeight: 15,
  },
  resultsSection: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm + 2,
  },
  resultsTitle: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  resultsList: {
    gap: SPACING.sm + 4,
  },
  resultCard: {
    width: 140,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 4,
    gap: SPACING.xs,
  },
  resultName: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    minHeight: 30,
  },
  resultStock: {
    fontSize: FONTS.size.xs,
  },
  resultAdd: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm + 2,
    marginTop: 2,
  },
  resultAddText: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  noResults: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  clearText: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.error,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm + 2,
    ...SHADOWS.sm,
    gap: SPACING.sm + 2,
  },
  cartInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cartName: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.full,
    padding: 3,
    gap: 2,
  },
  stepButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  stepPlus: {
    backgroundColor: COLORS.primary,
  },
  stepDisabled: {
    opacity: 0.4,
  },
  stepText: {
    fontSize: FONTS.size.lg,
    lineHeight: FONTS.size.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  stepPlusText: {
    color: COLORS.white,
  },
  stepQty: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  cartRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  removeButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.red[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomBar: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm + 4,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray[200],
    gap: SPACING.sm + 4,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  paymentChip: {
    flex: 1,
    paddingVertical: SPACING.sm - 2,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    alignItems: 'center',
  },
  paymentChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  paymentChipText: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.textLight,
  },
  paymentChipTextSelected: {
    color: COLORS.primaryDark,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  totalLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.gray[400],
    marginBottom: 2,
  },
  completeButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  modalTitle: {
    fontSize: FONTS.size.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs + 2,
    lineHeight: 19,
  },
  modalInput: {
    marginTop: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm + 2,
    marginTop: SPACING.lg,
  },
  modalButton: {
    flex: 1,
  },
});
