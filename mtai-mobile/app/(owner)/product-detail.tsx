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
import Badge from '../../src/components/Badge';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, RADIUS, SPACING } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';

interface OwnerProduct {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  wholesale_price?: number;
  stock_quantity: number;
  quantity: number;
  low_stock_threshold: number;
  category?: { id: number; name: string };
  is_active: boolean;
  location?: string;
}

function unwrap<T>(payload: unknown): T {
  const body = payload as Record<string, any> | null;
  if (body && typeof body === 'object' && !Array.isArray(body.data) && 'data' in body) {
    return body.data as T;
  }
  return payload as T;
}

function extractId(body: any): string | null {
  if (!body || typeof body !== 'object') return null;
  const data = body.data && typeof body.data === 'object' ? body.data : body;
  const id = data.id ?? data.business_id;
  return id != null ? String(id) : null;
}

interface StockStatus {
  label: string;
  bg: string;
  text: string;
}

function getStockStatus(quantity: number, threshold: number): StockStatus {
  if (quantity <= 0) return { label: 'Out of Stock', bg: COLORS.red[100], text: COLORS.red[700] };
  if (quantity <= threshold) return { label: 'Low Stock', bg: '#FEF3C7', text: '#B45309' };
  return { label: 'In Stock', bg: COLORS.green[100], text: COLORS.green[700] };
}

export default function OwnerProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  const user = useAuthStore((state) => state.user);
  const userBusinessId = user?.current_business_id;

  const [product, setProduct] = useState<OwnerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setError('Product not found.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let bizId = businessId || (userBusinessId ? String(userBusinessId) : null);
      if (!bizId) {
        const profileRes = await api.get('/business/profile');
        bizId = extractId(profileRes.data);
      }
      if (!bizId) {
        throw new Error('Could not determine business ID.');
      }
      setBusinessId(bizId);

      const res = await api.get(`/owner/businesses/${bizId}/products/${productId}`);
      setProduct(unwrap<OwnerProduct>(res.data));
    } catch (err: any) {
      setError(
        err?.response?.status === 404
          ? 'This product could not be found.'
          : err?.response?.data?.message || err?.message || 'Failed to load product.'
      );
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId, businessId, userBusinessId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const stockStatus = useMemo(() => {
    if (!product) return null;
    return getStockStatus(product.quantity, product.low_stock_threshold);
  }, [product]);

  if (loading) return <LoadingScreen />;

  if (!product) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Product Detail" onBack={() => router.back()} />
        <EmptyState
          title="Could not load product"
          subtitle={error ?? 'Please try again.'}
          actionTitle="Retry"
          onAction={fetchProduct}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header
          title="Product Detail"
          onBack={() => router.back()}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Card style={styles.mainCard}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{product.name}</Text>
              {stockStatus ? (
                <Badge label={stockStatus.label} color={stockStatus.bg} textColor={stockStatus.text} size="sm" />
              ) : null}
            </View>

            {product.category ? (
              <Badge label={product.category.name} color={COLORS.primaryLight} textColor={COLORS.primaryDark} size="sm" style={styles.selfStart} />
            ) : null}

            {product.sku ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>SKU</Text>
                <Text style={styles.infoValue}>{product.sku}</Text>
              </View>
            ) : null}

            {product.barcode ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Barcode</Text>
                <Text style={styles.infoValue}>{product.barcode}</Text>
              </View>
            ) : null}

            {product.location ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{product.location}</Text>
              </View>
            ) : null}

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Active</Text>
              <Text style={styles.infoValue}>{product.is_active ? 'Yes' : 'No'}</Text>
            </View>
          </Card>

          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Pricing & Stock</Text>
            <View style={styles.stockBar}>
              <View style={[styles.stockFill, { width: `${Math.min((product.quantity / Math.max(product.quantity + 10, 1)) * 100, 100)}%`, backgroundColor: stockStatus?.bg }]} />
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Selling Price</Text>
              <PriceTag price={product.price} size="md" />
            </View>
            {typeof product.cost_price === 'number' ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Buying Price</Text>
                <PriceTag price={product.cost_price} size="md" />
              </View>
            ) : null}
            {typeof product.wholesale_price === 'number' ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Wholesale Price</Text>
                <PriceTag price={product.wholesale_price} size="md" />
              </View>
            ) : null}
            {typeof product.compare_at_price === 'number' && product.compare_at_price > 0 ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Compare At</Text>
                <PriceTag price={product.compare_at_price} size="md" />
              </View>
            ) : null}
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Quantity</Text>
              <Text style={[styles.infoValue, { fontWeight: '800', fontSize: FONTS.size.lg }]}>
                {product.quantity}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Low Stock Threshold</Text>
              <Text style={styles.infoValue}>{product.low_stock_threshold}</Text>
            </View>
          </Card>

          {product.description ? (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </Card>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  safe: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl, gap: SPACING.md },
  mainCard: { gap: SPACING.sm + 2 },
  nameRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: SPACING.sm,
  },
  name: { flex: 1, fontSize: FONTS.size.xl, fontWeight: '700', color: COLORS.text },
  selfStart: { alignSelf: 'flex-start' },
  card: { gap: SPACING.sm + 2 },
  cardTitle: { fontSize: FONTS.size.lg, fontWeight: '700', color: COLORS.text },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  infoLabel: { fontSize: FONTS.size.md, color: COLORS.textLight },
  infoValue: { fontSize: FONTS.size.md, fontWeight: '600', color: COLORS.text },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.gray[200], marginVertical: SPACING.xs },
  stockBar: {
    height: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.gray[100], overflow: 'hidden',
  },
  stockFill: { height: '100%', borderRadius: RADIUS.full },
  description: { fontSize: FONTS.size.md, color: COLORS.textLight, lineHeight: 22 },
});
