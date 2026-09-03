import React, { useEffect, useMemo } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Product } from '../../src/api/types';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useCartStore } from '../../src/store/cartStore';

const PLACEHOLDER_COLORS = ['#0FAE8C', '#2F80ED', '#F2994A', '#EB5757', '#9B51E0', '#27AE60'];

function placeholderColor(seed: number): string {
  return PLACEHOLDER_COLORS[Math.abs(seed) % PLACEHOLDER_COLORS.length];
}

function formatTZS(amount: number): string {
  const rounded = Math.round(amount);
  const withSeparators = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `TZS ${withSeparators}`;
}

function stockOf(product: Product): number {
  const value = Number(product.quantity ?? (product as any)?.stock_quantity ?? 0);
  return Number.isNaN(value) ? 0 : value;
}

function priceOf(product: Product): number {
  const price = Number(product.price ?? 0);
  if (price > 0) return price;
  const selling = Number((product as any)?.selling_price ?? 0);
  if (selling > 0) return selling;
  return Number((product as any)?.retail_price ?? 0);
}

export default function CartScreen() {
  const router = useRouter();

  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const loadServerCart = useCartStore((s) => s.loadServerCart);
  const getTotal = useCartStore((s) => s.getTotal);

  useEffect(() => {
    void loadServerCart();
  }, [loadServerCart]);

  const total = useMemo(() => getTotal(), [getTotal, items]);
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const handleQuantityChange = (product: Product, nextQuantity: number) => {
    if (nextQuantity > stockOf(product)) return;
    updateQuantity(product.id, nextQuantity);
  };

  const renderCartItem = ({ item }: { item: { product: Product; quantity: number } }) => {
    const { product, quantity } = item;
    const outOfStock = stockOf(product) <= 0;
    const lineTotal = priceOf(product) * quantity;
    const imageUri = product.images?.[0]?.url;

    return (
      <Card style={styles.itemCard}>
        <View style={[styles.thumb, { backgroundColor: placeholderColor(product.id) }]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.thumbImage} resizeMode="cover" />
          ) : (
            <Text style={styles.thumbInitial}>{product.name.charAt(0).toUpperCase()}</Text>
          )}
        </View>

        <View style={styles.itemInfo}>
          <View style={styles.itemTopRow}>
            <Text style={styles.itemName} numberOfLines={2}>
              {product.name}
            </Text>
            <TouchableOpacity
              onPress={() => removeItem(product.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.6}
              style={styles.removeButton}
            >
              <MaterialIcons name="close" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          </View>

          <PriceTag price={priceOf(product)} size="sm" />

          <View style={styles.itemBottomRow}>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => handleQuantityChange(product, quantity - 1)}
                activeOpacity={0.7}
              >
                <View style={styles.qtyMinus} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity
                style={[styles.qtyButton, outOfStock && styles.qtyButtonDisabled]}
                onPress={() => handleQuantityChange(product, quantity + 1)}
                disabled={outOfStock || quantity >= stockOf(product)}
                activeOpacity={0.7}
              >
                <View style={styles.qtyPlusVertical} />
                <View style={styles.qtyPlusHorizontal} />
              </TouchableOpacity>
            </View>
            <Text style={styles.lineTotal}>{formatTZS(lineTotal)}</Text>
          </View>

          {outOfStock ? (
            <Text style={styles.stockWarning}>This item is currently unavailable.</Text>
          ) : null}
        </View>
      </Card>
    );
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="My Cart" onBack={() => router.back()} />
        <EmptyState
          icon={<MaterialIcons name="shopping-cart" size={32} color={COLORS.gray[400]} />}
          title="Your cart is empty"
          subtitle="Browse featured products and add items to get started."
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
          title="My Cart"
          subtitle={`${itemCount} item${itemCount === 1 ? '' : 's'}`}
          onBack={() => router.back()}
          rightAction={
            <TouchableOpacity onPress={clearCart} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          }
        />

        <FlatList
          data={items}
          keyExtractor={(item) => String(item.product.id)}
          renderItem={renderCartItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.summaryBar}>
          <View style={styles.summaryMeta}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({itemCount} item{itemCount === 1 ? '' : 's'})</Text>
              <Text style={styles.summaryValue}>{formatTZS(total)}</Text>
            </View>
            <View style={styles.deliveryHint}>
              <MaterialIcons name="local-shipping" size={14} color={COLORS.primaryDark} />
              <Text style={styles.deliveryHintText}>Delivery calculated at checkout</Text>
            </View>
          </View>
          <Button
            title={`Checkout · ${formatTZS(total)}`}
            size="lg"
            onPress={() => router.push('/checkout')}
            disabled={itemCount === 0}
            style={styles.checkoutButton}
          />
        </View>
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
  clearText: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.error,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  itemCard: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbInitial: {
    fontSize: FONTS.size.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  itemInfo: {
    flex: 1,
    gap: SPACING.xs + 2,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemName: {
    flex: 1,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    lineHeight: 20,
  },
  removeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  stockWarning: {
    fontSize: FONTS.size.sm,
    color: COLORS.error,
  },
  lineTotal: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    padding: SPACING.xs,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.teal[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  qtyMinus: {
    width: 12,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: COLORS.primaryDark,
  },
  qtyPlusVertical: {
    position: 'absolute',
    width: 2.5,
    height: 12,
    borderRadius: 2,
    backgroundColor: COLORS.primaryDark,
  },
  qtyPlusHorizontal: {
    position: 'absolute',
    width: 12,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: COLORS.primaryDark,
  },
  qtyValue: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  summaryBar: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray[200],
    gap: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryMeta: {
    gap: SPACING.xs,
  },
  deliveryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  deliveryHintText: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    fontFamily: FONTS.regular,
  },
  summaryLabel: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
  },
  summaryValue: {
    fontSize: FONTS.size.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  checkoutButton: {
    marginTop: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
