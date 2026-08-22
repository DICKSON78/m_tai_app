import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../src/api/client';
import { Product } from '../../src/api/types';
import Badge from '../../src/components/Badge';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import PriceTag from '../../src/components/PriceTag';
import SearchBar from '../../src/components/SearchBar';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useCartStore } from '../../src/store/cartStore';

const PLACEHOLDER_COLORS = ['#00D4AA', '#5B8DEF', '#F59E0B', '#EF476F', '#8B5CF6', '#10B981'];
const SEARCH_DEBOUNCE_MS = 400;

type StockStatus = {
  label: string;
  color: string;
  textColor?: string;
};

function getStockStatus(quantity: number): StockStatus {
  if (quantity <= 0) {
    return { label: 'Out of Stock', color: COLORS.red[500] };
  }
  if (quantity <= 5) {
    return { label: `Low Stock · ${quantity}`, color: COLORS.warning };
  }
  return { label: 'In Stock', color: COLORS.green[100], textColor: COLORS.primaryDark };
}

function placeholderColor(seed: number): string {
  return PLACEHOLDER_COLORS[Math.abs(seed) % PLACEHOLDER_COLORS.length];
}

interface PageResult<T> {
  items: T[];
  currentPage: number;
  lastPage: number;
}

function normalizePaginated<T>(payload: unknown): PageResult<T> {
  const body = payload as Record<string, any> | null;
  const paginated =
    body && typeof body === 'object' && Array.isArray(body.data?.data) ? body.data : body;
  const items: T[] = Array.isArray(paginated?.data) ? paginated.data : [];
  return {
    items,
    currentPage: typeof paginated?.current_page === 'number' ? paginated.current_page : 1,
    lastPage: typeof paginated?.last_page === 'number' ? paginated.last_page : 1,
  };
}

export default function CustomerHomeScreen() {
  const router = useRouter();
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchText.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchProducts = useCallback(
    async (targetPage: number, mode: 'replace' | 'append') => {
      requestSeqRef.current += 1;
      const requestId = requestSeqRef.current;

      if (mode === 'replace') {
        setError(null);
      }

      try {
        const res = await api.get('/shop/products', {
          params: { search: searchQuery || undefined, page: targetPage },
        });
        if (requestId !== requestSeqRef.current) return;

        const result = normalizePaginated<Product>(res.data);
        setPage(result.currentPage);
        setLastPage(result.lastPage);
        setProducts((prev) =>
          mode === 'append' && result.currentPage > 1
            ? [...prev, ...result.items]
            : result.items
        );
        setError(null);
      } catch (err: any) {
        if (requestId !== requestSeqRef.current) return;
        if (mode === 'replace') {
          setProducts([]);
          setError(
            err?.response?.data?.message ||
              err?.message ||
              'Something went wrong while loading products.'
          );
        }
      } finally {
        if (requestId === requestSeqRef.current) {
          setInitialLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [searchQuery]
  );

  useEffect(() => {
    setInitialLoading(true);
    fetchProducts(1, 'replace');
  }, [fetchProducts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(1, 'replace');
  }, [fetchProducts]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || refreshing || initialLoading || page >= lastPage || error) return;
    setLoadingMore(true);
    fetchProducts(page + 1, 'append');
  }, [loadingMore, refreshing, initialLoading, page, lastPage, error, fetchProducts]);

  const handleRetry = useCallback(() => {
    setInitialLoading(true);
    fetchProducts(1, 'replace');
  }, [fetchProducts]);

  const openProduct = useCallback(
    (product: Product) => {
      router.push({ pathname: '/product-detail', params: { id: String(product.id) } });
    },
    [router]
  );

  const renderProductCard = useCallback(
    ({ item }: { item: Product }) => {
      const stock = getStockStatus(item.stock_quantity);
      const imageUri = item.images?.[0]?.url;

      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => openProduct(item)}
        >
          <View style={[styles.imageBox, { backgroundColor: placeholderColor(item.id) }]}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            ) : (
              <Text style={styles.imageInitial}>{item.name.charAt(0).toUpperCase()}</Text>
            )}
            <View style={styles.stockBadge}>
              <Badge
                label={stock.label}
                color={stock.color}
                textColor={stock.textColor ?? COLORS.white}
                size="sm"
              />
            </View>
          </View>
          <View style={styles.cardBody}>
            {item.category?.name ? (
              <Text style={styles.category} numberOfLines={1}>
                {item.category.name}
              </Text>
            ) : null}
            <Text style={styles.name} numberOfLines={2}>
              {item.name}
            </Text>
            <PriceTag price={item.price} size="sm" compareAt={item.compare_at_price} />
          </View>
        </TouchableOpacity>
      );
    },
    [openProduct]
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {searchQuery ? 'Search Results' : 'Featured Products'}
        </Text>
        {!initialLoading && !error ? (
          <Text style={styles.sectionCount}>{products.length} item{products.length === 1 ? '' : 's'}</Text>
        ) : null}
      </View>
    ),
    [searchQuery, products.length, initialLoading, error]
  );

  const listFooter = useMemo(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [loadingMore]);

  const listEmpty = useMemo(() => {
    if (initialLoading || loadingMore) return null;
    if (error) {
      return (
        <EmptyState
          title="Failed to load products"
          subtitle={error}
          actionTitle="Try Again"
          onAction={handleRetry}
          style={styles.empty}
        />
      );
    }
    return (
      <EmptyState
        title={searchQuery ? 'No products found' : 'No products yet'}
        subtitle={
          searchQuery
            ? `We couldn't find anything for "${searchQuery}". Try a different search.`
            : 'Check back soon — new products are on the way.'
        }
        actionTitle={searchQuery ? 'Clear Search' : undefined}
        onAction={searchQuery ? () => setSearchText('') : undefined}
        style={styles.empty}
      />
    );
  }, [initialLoading, loadingMore, error, searchQuery, handleRetry]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        title="M-TAI Shop"
        subtitle="Fresh goods, delivered fast"
        rightAction={
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.cartButton}
            onPress={() => router.push('/cart')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <CartIcon count={cartCount} />
          </TouchableOpacity>
        }
      />

      <View style={styles.searchWrap}>
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search products…"
        />
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProductCard}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
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

function CartIcon({ count }: { count: number }) {
  return (
    <View>
      <View style={[styles.cartIconBox, { backgroundColor: COLORS.gray[100] }]}>
        <View style={styles.basketBody} />
        <View style={[styles.basketHandle, styles.basketHandleLeft]} />
        <View style={[styles.basketHandle, styles.basketHandleRight]} />
      </View>
      {count > 0 ? (
        <View style={styles.cartCount}>
          <Text style={styles.cartCountText}>{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </View>
  );
}

const CARD_GAP = SPACING.md;
const LIST_PADDING = SPACING.md;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchWrap: {
    paddingHorizontal: LIST_PADDING,
    paddingVertical: SPACING.sm + 4,
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIconBox: {
    width: 22,
    height: 18,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  basketBody: {
    width: 10,
    height: 8,
    borderRadius: 2,
    backgroundColor: COLORS.text,
  },
  basketHandle: {
    position: 'absolute',
    top: -2,
    width: 9,
    height: 9,
    borderWidth: 2,
    borderColor: COLORS.text,
    borderRadius: 5,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  basketHandleLeft: {
    left: 1,
    transform: [{ rotate: '-35deg' }],
  },
  basketHandleRight: {
    right: 1,
    transform: [{ rotate: '35deg' }],
  },
  cartCount: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartCountText: {
    color: COLORS.white,
    fontSize: FONTS.size.xs,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: LIST_PADDING,
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md - CARD_GAP / 2,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  column: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  imageBox: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageInitial: {
    fontSize: FONTS.size.xxl,
    fontWeight: '800',
    color: COLORS.white,
  },
  stockBadge: {
    position: 'absolute',
    left: SPACING.sm,
    bottom: SPACING.sm,
  },
  cardBody: {
    padding: SPACING.sm + 4,
    gap: SPACING.xs,
  },
  category: {
    fontSize: FONTS.size.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.primaryDark,
  },
  name: {
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.text,
    minHeight: 36,
  },
  footer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
  },
});
