import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../src/api/client';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, RADIUS, SPACING } from '../../src/constants/theme';

interface WishlistItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    stock_quantity: number;
    images?: { id: number; url: string }[];
    business?: { id: number; name: string };
  };
  created_at: string;
}

const PLACEHOLDER_COLORS = ['#00D4AA', '#5B8DEF', '#F59E0B', '#EF476F', '#8B5CF6', '#10B981'];

function placeholderColor(seed: number): string {
  return PLACEHOLDER_COLORS[Math.abs(seed) % PLACEHOLDER_COLORS.length];
}

function extractArray(body: any): any[] {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.data?.data)) return body.data.data;
  return [];
}

export default function CustomerWishlistScreen() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSeqRef = useRef(0);

  const fetchWishlist = useCallback(async () => {
    requestSeqRef.current += 1;
    const requestId = requestSeqRef.current;
    try {
      const res = await api.get('/customer/wishlist');
      if (requestId !== requestSeqRef.current) return;
      setItems(extractArray(res.data));
      setError(null);
    } catch (err: any) {
      if (requestId !== requestSeqRef.current) return;
      setItems([]);
      setError(err?.response?.data?.message || err?.message || 'Could not load wishlist.');
    } finally {
      if (requestId === requestSeqRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWishlist();
  }, [fetchWishlist]);

  const renderItem = useCallback(
    ({ item }: { item: WishlistItem }) => {
      const product = item.product;
      const imageUri = product.images?.[0]?.url;
      return (
        <View style={styles.card}>
          <View style={[styles.thumb, { backgroundColor: placeholderColor(product.id) }]}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.thumbImage} resizeMode="cover" />
            ) : (
              <Text style={styles.thumbInitial}>{product.name.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            {product.business ? (
              <Text style={styles.businessName} numberOfLines={1}>{product.business.name}</Text>
            ) : null}
            <PriceTag price={product.price} size="md" />
          </View>
        </View>
      );
    },
    []
  );

  const listEmpty = useMemo(() => {
    if (initialLoading || refreshing) return null;
    if (error) {
      return (
        <EmptyState
          title="Failed to load wishlist"
          subtitle={error}
          actionTitle="Try Again"
          onAction={fetchWishlist}
          style={styles.empty}
        />
      );
    }
    return (
      <EmptyState
        icon={<Text style={styles.emptyIcon}>❤️</Text>}
        title="Your wishlist is empty"
        subtitle="Products you save will appear here."
        actionTitle="Start Shopping"
        onAction={() => router.push('/')}
        style={styles.empty}
      />
    );
  }, [initialLoading, refreshing, error, fetchWishlist, router]);

  if (initialLoading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="My Wishlist" />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: SPACING.md, paddingBottom: SPACING.xl, flexGrow: 1 },
  row: { gap: SPACING.md },
  card: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    overflow: 'hidden', marginBottom: SPACING.md,
  },
  thumb: { height: 140, justifyContent: 'center', alignItems: 'center' },
  thumbImage: { width: '100%', height: '100%' },
  thumbInitial: { fontSize: 40, fontWeight: '800', color: COLORS.white },
  cardInfo: { padding: SPACING.sm + 2, gap: 4 },
  productName: { fontSize: FONTS.size.md, fontWeight: '600', color: COLORS.text },
  businessName: { fontSize: FONTS.size.xs, color: COLORS.textLight },
  empty: { flex: 1, justifyContent: 'center' },
  emptyIcon: { fontSize: 32 },
});
