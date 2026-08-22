import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Product } from '../../src/api/types';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useCartStore } from '../../src/store/cartStore';

function formatTZS(amount: number): string {
  const rounded = Math.round(amount);
  const withSeparators = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `TZS ${withSeparators}`;
}

export default function CartScreen() {
  const router = useRouter();

  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotal = useCartStore((s) => s.getTotal);

  const total = useMemo(() => getTotal(), [getTotal, items]);
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const handleQuantityChange = (product: Product, nextQuantity: number) => {
    if (nextQuantity > product.stock_quantity) return;
    updateQuantity(product.id, nextQuantity);
  };

  const renderCartItem = ({ item }: { item: { product: Product; quantity: number } }) => {
    const { product, quantity } = item;
    const outOfStock = product.stock_quantity <= 0;
    const lineTotal = product.price * quantity;

    return (
      <Card style={styles.itemCard}>
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbInitial}>{product.name.charAt(0).toUpperCase()}</Text>
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
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <PriceTag price={product.price} size="sm" />

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
                disabled={outOfStock || quantity >= product.stock_quantity}
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
          icon={<Text style={styles.emptyIcon}>🛒</Text>}
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
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{formatTZS(total)}</Text>
          </View>
          <Button
            title="Checkout"
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
    fontWeight: '600',
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
  },
  thumbPlaceholder: {
    backgroundColor: COLORS.primaryLight,
  },
  thumbInitial: {
    fontSize: FONTS.size.xxl,
    fontWeight: '800',
    color: COLORS.primaryDark,
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
    fontWeight: '600',
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
  removeText: {
    fontSize: FONTS.size.lg,
    color: COLORS.gray[400],
    fontWeight: '600',
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
    fontWeight: '700',
    color: COLORS.text,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
    padding: 4,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  qtyButtonDisabled: {
    opacity: 0.5,
  },
  qtyMinus: {
    width: 12,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: COLORS.text,
  },
  qtyPlusVertical: {
    position: 'absolute',
    width: 2.5,
    height: 12,
    borderRadius: 2,
    backgroundColor: COLORS.text,
  },
  qtyPlusHorizontal: {
    position: 'absolute',
    width: 12,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: COLORS.text,
  },
  qtyValue: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: FONTS.size.md,
    fontWeight: '700',
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
  summaryLabel: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
  },
  summaryValue: {
    fontSize: FONTS.size.xl,
    fontWeight: '800',
    color: COLORS.text,
  },
  checkoutButton: {
    marginTop: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 32,
  },
});
