import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../src/api/client';
import { Product } from '../../src/api/types';
import Avatar from '../../src/components/Avatar';
import Badge from '../../src/components/Badge';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useCartStore } from '../../src/store/cartStore';

const PLACEHOLDER_COLORS = ['#00D4AA', '#5B8DEF', '#F59E0B', '#EF476F', '#8B5CF6', '#10B981'];

function placeholderColor(seed: number): string {
  return PLACEHOLDER_COLORS[Math.abs(seed) % PLACEHOLDER_COLORS.length];
}

function unwrap<T>(payload: unknown): T {
  const body = payload as Record<string, any> | null;
  if (body && typeof body === 'object' && !Array.isArray(body.data) && 'data' in body) {
    return body.data as T;
  }
  return payload as T;
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setError('Product not found.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/shop/products/${productId}`);
      setProduct(unwrap<Product>(res.data));
      setQuantity(1);
    } catch (err: any) {
      setError(
        err?.response?.status === 404
          ? 'This product is no longer available.'
          : err?.response?.data?.message || err?.message || 'Failed to load product.'
      );
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 1600);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const stockQuantity = product?.stock_quantity ?? 0;
  const inStock = stockQuantity > 0;

  const maxQuantity = Math.max(stockQuantity, 1);

  const decrement = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
  }, []);

  const increment = useCallback(() => {
    setQuantity((q) => Math.min(maxQuantity, q + 1));
  }, [maxQuantity]);

  const lineTotal = useMemo(() => (product ? product.price * quantity : 0), [product, quantity]);

  const handleAddToCart = useCallback(() => {
    if (!product || !inStock) return;
    for (let i = 0; i < quantity; i++) {
      addItem(product, product.business?.id ?? 0);
    }
    setJustAdded(true);
  }, [product, inStock, quantity, addItem]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Product" onBack={() => router.back()} />
        <EmptyState
          title="Could not load product"
          subtitle={error ?? 'Please try again.'}
          actionTitle="Retry"
          onAction={fetchProduct}
        />
      </SafeAreaView>
    );
  }

  const imageUri = product.images?.[0]?.url;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header
          title="Product Details"
          onBack={() => router.back()}
          rightAction={
            <TouchableOpacity
              onPress={() => router.push('/cart')}
              style={styles.cartLink}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.cartLinkText}>Cart</Text>
            </TouchableOpacity>
          }
        />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: SPACING.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroImage, { backgroundColor: placeholderColor(product.id) }]}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.heroImageContent} resizeMode="cover" />
            ) : (
              <Text style={styles.heroInitial}>{product.name.charAt(0).toUpperCase()}</Text>
            )}
          </View>

          <View style={styles.section}>
            {product.category?.name ? (
              <Badge label={product.category.name} color={COLORS.primaryLight} textColor={COLORS.primaryDark} size="sm" />
            ) : null}
            <Text style={styles.name}>{product.name}</Text>
            <PriceTag price={product.price} size="lg" compareAt={product.compare_at_price} />
            {product.sku ? (
              <Text style={styles.sku}>SKU: {product.sku}</Text>
            ) : null}
            <Badge
              label={inStock ? `${stockQuantity} in stock` : 'Out of Stock'}
              color={inStock ? COLORS.green[100] : COLORS.red[100]}
              textColor={inStock ? COLORS.primaryDark : COLORS.red[700]}
              size="sm"
              style={styles.stockBadge}
            />
          </View>

          {product.description ? (
            <Card style={styles.descriptionCard}>
              <Text style={styles.cardTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </Card>
          ) : null}

          {product.business ? (
            <Card style={styles.businessCard}>
              <View style={styles.businessRow}>
                <Avatar name={product.business.name} size={44} />
                <View style={styles.businessInfo}>
                  <Text style={styles.businessName} numberOfLines={1}>
                    {product.business.name}
                  </Text>
                  <Text style={styles.businessSubtitle}>Verified seller</Text>
                </View>
                <Badge label="Business" color={COLORS.gray[100]} textColor={COLORS.gray[700]} size="sm" />
              </View>
            </Card>
          ) : null}
        </ScrollView>

        <View style={styles.bottomBar}>
          <View style={styles.quantitySelector}>
            <TouchableOpacity
              style={[styles.qtyButton, quantity <= 1 && styles.qtyButtonDisabled]}
              onPress={decrement}
              disabled={quantity <= 1}
              activeOpacity={0.7}
            >
              <View style={[styles.qtyMinus, quantity <= 1 && { backgroundColor: COLORS.gray[300] }]} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyButton, !inStock && styles.qtyButtonDisabled]}
              onPress={increment}
              disabled={!inStock}
              activeOpacity={0.7}
            >
              <View style={styles.qtyPlusVertical} />
              <View style={styles.qtyPlusHorizontal} />
            </TouchableOpacity>
          </View>

          <Button
            title={justAdded ? 'Added to Cart ✓' : `Add to Cart · ${formatTZS(lineTotal)}`}
            onPress={handleAddToCart}
            size="lg"
            loading={false}
            disabled={!inStock || justAdded}
            variant={justAdded ? 'secondary' : 'primary'}
            style={styles.addButton}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function formatTZS(amount: number): string {
  const rounded = Math.round(amount);
  const withSeparators = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `TZS ${withSeparators}`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safe: {
    flex: 1,
  },
  cartLink: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  cartLinkText: {
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  heroImage: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageContent: {
    width: '100%',
    height: '100%',
  },
  heroInitial: {
    fontSize: 64,
    fontWeight: '800',
    color: COLORS.white,
  },
  section: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  name: {
    fontSize: FONTS.size.xl,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 28,
  },
  sku: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  stockBadge: {
    alignSelf: 'flex-start',
  },
  descriptionCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  cardTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  businessCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 4,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: FONTS.size.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  businessSubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray[200],
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
    padding: SPACING.xs + 2,
  },
  qtyButton: {
    width: 36,
    height: 36,
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
    width: 14,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: COLORS.text,
  },
  qtyPlusVertical: {
    position: 'absolute',
    width: 2.5,
    height: 14,
    borderRadius: 2,
    backgroundColor: COLORS.text,
  },
  qtyPlusHorizontal: {
    position: 'absolute',
    width: 14,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: COLORS.text,
  },
  qtyValue: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  addButton: {
    flex: 1,
  },
});
