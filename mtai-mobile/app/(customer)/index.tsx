import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../src/api/client';
import { Product } from '../../src/api/types';
import AlertModal from '../../src/components/AlertModal';
import Avatar from '../../src/components/Avatar';
import Badge from '../../src/components/Badge';
import Button from '../../src/components/Button';
import EmptyState from '../../src/components/EmptyState';
import PriceTag from '../../src/components/PriceTag';
import SearchBar from '../../src/components/SearchBar';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useCartStore } from '../../src/store/cartStore';

const PLACEHOLDER_COLORS = ['#0FAE8C', '#2F80ED', '#F2994A', '#EB5757', '#9B51E0', '#27AE60'];
const SEARCH_DEBOUNCE_MS = 400;

const TRUST_ITEMS = [
  { icon: 'local-shipping' as const, label: 'Fast Delivery' },
  { icon: 'verified-user' as const, label: 'Secure Payment' },
  { icon: 'support-agent' as const, label: '24/7 Support' },
  { icon: 'autorenew' as const, label: 'Easy Returns' },
];

const BANNER_FALLBACKS = [
  {
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
    title: 'Fresh produce\ndelivered daily',
    subtitle: 'Farm-fresh fruits & veggies at your door.',
  },
  {
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
    title: 'Groceries\nyou can trust',
    subtitle: 'Quality pantry staples for the whole family.',
  },
  {
    url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80',
    title: 'Everyday\nkitchen essentials',
    subtitle: 'Everything for your home, delivered fast.',
  },
  {
    url: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=900&q=80',
    title: 'Shop fresh\nthis week',
    subtitle: 'New arrivals & unbeatable deals inside.',
  },
  {
    url: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=900&q=80',
    title: 'Hot deals\njust for you',
    subtitle: 'Save big on your favorite products today.',
  },
];

const CATEGORY_ACCENTS = ['#0FAE8C', '#2F80ED', '#F2994A', '#EB5757', '#9B51E0', '#27AE60'];

type StockStatus = {
  label: string;
  color: string;
  textColor?: string;
};

function getStockStatus(quantity: number): StockStatus {
  if (quantity <= 0) return { label: 'Out of stock', color: COLORS.red[500] };
  if (quantity <= 5) return { label: `Low stock · ${quantity}`, color: COLORS.warning };
  return { label: 'In stock', color: COLORS.green[100], textColor: COLORS.primaryDark };
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

function placeholderColor(seed: number): string {
  return PLACEHOLDER_COLORS[Math.abs(seed) % PLACEHOLDER_COLORS.length];
}

function categoryAccent(seed: number): string {
  return CATEGORY_ACCENTS[Math.abs(seed) % CATEGORY_ACCENTS.length];
}

function categoryIcon(name: string): keyof typeof MaterialIcons.glyphMap {
  const n = (name || '').toLowerCase();
  if (n.includes('groc') || n.includes('food') || n.includes('produc')) return 'storefront';
  if (n.includes('fruit') || n.includes('veget') || n.includes('fresh')) return 'eco';
  if (n.includes('drink') || n.includes('bever')) return 'local-drink';
  if (n.includes('baker') || n.includes('bread')) return 'bakery-dining';
  if (n.includes('dairy') || n.includes('milk')) return 'local-cafe';
  if (n.includes('cloth') || n.includes('fashion') || n.includes('apparel')) return 'checkroom';
  if (n.includes('elect') || n.includes('gadget')) return 'devices';
  if (n.includes('home') || n.includes('house')) return 'home';
  if (n.includes('beaut') || n.includes('cosmetic')) return 'spa';
  if (n.includes('health') || n.includes('pharm')) return 'medical-services';
  if (n.includes('station') || n.includes('office')) return 'inventory-2';
  if (n.includes('all')) return 'apps';
  return 'category';
}

function formatPrice(amount: number): string {
  const withSeparators = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `TZS ${withSeparators}`;
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
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const requestSeqRef = useRef(0);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = useMemo(() => {
    const name = user?.name?.trim() ?? '';
    if (name) return name;
    return 'Shopper';
  }, [user]);

  const avatarInitial = useMemo(() => {
    const first = (user?.name?.trim() ?? '').split(/\s+/)[0] || '';
    return (first.charAt(0) || 'S').toUpperCase();
  }, [user]);

  const filterCount = (selectedCategoryId !== null ? 1 : 0);

  const displayProducts = useMemo(() => {
    if (!filteredProducts) return products;
    return filteredProducts;
  }, [filteredProducts, products]);

  const applyPriceFilter = useCallback(() => {
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    const filtered = products.filter((p) => {
      if (min !== null && priceOf(p) < min) return false;
      if (max !== null && priceOf(p) > max) return false;
      return true;
    });
    setFilteredProducts(filtered);
    setFilterOpen(false);
  }, [products, priceMin, priceMax]);

  const clearPriceFilter = useCallback(() => {
    setPriceMin('');
    setPriceMax('');
    setFilteredProducts(null);
    setFilterOpen(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchText.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const mergeCategories = useCallback((list: Product[]) => {
    setCategories((prev) => {
      const map = new Map<number, string>();
      prev.forEach((c) => map.set(c.id, c.name));
      list.forEach((p) => {
        if (p.category?.name && p.category.id && !map.has(p.category.id)) {
          map.set(p.category.id, p.category.name);
        }
      });
      return Array.from(map.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    });
  }, []);

  const fetchProducts = useCallback(
    async (targetPage: number, mode: 'replace' | 'append') => {
      requestSeqRef.current += 1;
      const requestId = requestSeqRef.current;
      if (mode === 'replace') setError(null);
      try {
        const res = await api.get('/shop/products', {
          params: {
            search: searchQuery || undefined,
            category_id: selectedCategoryId ?? undefined,
            page: targetPage,
          },
        });
        if (requestId !== requestSeqRef.current) return;
        const result = normalizePaginated<Product>(res.data);
        setPage(result.currentPage);
        setLastPage(result.lastPage);
        mergeCategories(result.items);
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
    [searchQuery, selectedCategoryId, mergeCategories]
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

  const handleSelectCategory = useCallback((id: number | null) => {
    setSelectedCategoryId(id);
  }, []);

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

  const isOnSale = (p: Product) => (p.compare_at_price ?? 0) > priceOf(p);

  const handleShare = useCallback(async (item: Product) => {
    const shopName = item.business?.name || 'M-TAI seller';
    const message = `${item.name}\n${await formatPrice(priceOf(item))} from ${shopName} on M-TAI.`;
    try {
      await Share.share({ message, title: item.name });
    } catch {
      // silently ignore share dismissal/cancel
    }
  }, []);

  const renderProductCard = useCallback(
    ({ item }: { item: Product }) => {
      const stock = getStockStatus(stockOf(item));
      const imageUri = item.images?.[0]?.url;
      const sale = isOnSale(item);
      const shopName = item.business?.name || 'M-TAI Seller';
      return (
        <View style={styles.card}>
          <View style={styles.postHeader}>
            <View style={styles.shopAvatar}>
              <Text style={styles.shopAvatarText}>{shopName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.shopInfo}>
              <View style={styles.shopNameRow}>
                <Text style={styles.shopName} numberOfLines={1}>{shopName}</Text>
                <MaterialIcons name="verified" size={16} color="#1D9BF0" />
              </View>
              {item.category?.name ? (
                <Text style={styles.shopCategory} numberOfLines={1}>{item.category.name}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => handleShare(item)}
              style={styles.shareBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="share" size={22} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => openProduct(item)}
          >
            <View style={[styles.imageBox, { backgroundColor: placeholderColor(item.id) }]}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
              ) : (
                <Text style={styles.imageInitial}>{item.name.charAt(0).toUpperCase()}</Text>
              )}
              {sale ? (
                <View style={styles.saleTag}>
                  <Text style={styles.saleTagText}>SALE</Text>
                </View>
              ) : null}
              {stockOf(item) <= 0 ? (
                <View style={styles.soldOverlay}>
                  <Text style={styles.soldText}>Sold Out</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.priceRow}>
                <PriceTag price={priceOf(item)} size="md" compareAt={item.compare_at_price} />
                <Badge
                  label={stock.label}
                  color={stock.color}
                  textColor={stock.textColor}
                  size="sm"
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [openProduct, handleShare]
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <View style={styles.trustRow}>
          {TRUST_ITEMS.map((item) => (
            <View key={item.label} style={styles.trustItem}>
              <View style={styles.trustIconWrap}>
                <MaterialIcons name={item.icon} size={16} color={COLORS.primaryDark} />
              </View>
              <Text style={styles.trustLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? 'Search Results' : productGridLabel(products.length)}
          </Text>
          {!initialLoading && !error ? (
            <Text style={styles.sectionCount}>
              {products.length} item{products.length === 1 ? '' : 's'}
            </Text>
          ) : null}
        </View>
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
        title={searchQuery || selectedCategoryId !== null ? 'No products found' : 'No products yet'}
        subtitle={
          searchQuery || selectedCategoryId !== null
            ? 'Try a different search or category.'
            : 'Check back soon — new products are on the way.'
        }
        actionTitle={searchQuery || selectedCategoryId !== null ? 'Clear Filters' : undefined}
        onAction={
          searchQuery || selectedCategoryId !== null
            ? () => {
                setSearchText('');
                setSelectedCategoryId(null);
              }
            : undefined
        }
        style={styles.empty}
      />
    );
  }, [initialLoading, loadingMore, error, searchQuery, selectedCategoryId, handleRetry]);

  const categoryChips = useMemo(() => {
    const list = [{ name: 'All', id: null as number | null }, ...categories];
    return list.map((c) => {
      const active = selectedCategoryId === c.id;
      const icon = c.id !== null ? categoryIcon(c.name) : 'apps';
      return (
        <TouchableOpacity
          key={c.name || 'all'}
          activeOpacity={0.8}
          style={[styles.trustItem, styles.catTouchable]}
          onPress={() => handleSelectCategory(c.id)}
        >
          <View
            style={[
              styles.trustIconWrap,
              active && styles.catIconWrapActive,
            ]}
          >
            <MaterialIcons
              name={icon}
              size={16}
              color={active ? '#FFFFFF' : COLORS.primaryDark}
            />
          </View>
          <Text
            style={[styles.trustLabel, active && styles.catTileTextActive]}
            numberOfLines={1}
          >
            {c.name}
          </Text>
        </TouchableOpacity>
      );
    });
  }, [categories, selectedCategoryId, handleSelectCategory]);

  const bannerSlides = useMemo(() => {
    const withImages: { url: string | null; title: string; subtitle: string }[] = [];
    for (const p of products) {
      const url = p.images?.[0]?.url;
      if (url) {
        withImages.push({
          url,
          title: p.name.length > 26 ? p.name.slice(0, 26) + '…' : p.name,
          subtitle: p.business?.name ?? 'Fresh goods, delivered fast',
        });
      }
      if (withImages.length >= 5) break;
    }
    if (withImages.length >= 3) return withImages;
    return BANNER_FALLBACKS.map((b) => ({ ...b }));
  }, [products]);

  const performLogout = async () => {
    setConfirmLogout(false);
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch {
      setMenuError('Failed to log out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.homeHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{avatarInitial}</Text>
        </View>
        <View style={styles.homeHeaderText}>
          <Text style={styles.greeting} numberOfLines={1}>{greeting}</Text>
          <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
          <Text style={styles.tagline}>Fresh goods, delivered fast</Text>
        </View>
        <View style={styles.homeHeaderActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.dotsButton}
            onPress={() => setConfirmLogout(true)}
            hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
          >
            <MaterialIcons name="more-horiz" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.cartButton}
            onPress={() => router.push('/cart')}
            hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
          >
            <MaterialIcons name="shopping-bag" size={22} color={COLORS.primaryDark} />
            {cartCount > 0 ? (
              <View style={styles.cartCount}>
                <Text style={styles.cartCountText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search products…"
            style={styles.searchBarInner}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.searchFilterIcon}
            onPress={() => setFilterOpen(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="tune" size={20} color={COLORS.primaryDark} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.staticCategories}>
        <ScrollCategories chips={categoryChips} />
      </View>

      <FilterSheetModal
        visible={filterOpen}
        priceMin={priceMin}
        priceMax={priceMax}
        onChangeMin={setPriceMin}
        onChangeMax={setPriceMax}
        onApply={applyPriceFilter}
        onClear={clearPriceFilter}
        onClose={() => setFilterOpen(false)}
      />

      <FlatList
        data={displayProducts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderProductCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <BannerCarousel slides={bannerSlides} />
            {listHeader}
          </View>
        }
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

      <AlertModal
        visible={confirmLogout}
        type="warning"
        title="Do you want to exit?"
        message="You will be logged out of your account."
        confirmText="Yes"
        cancelText="No"
        onConfirm={performLogout}
        onCancel={() => setConfirmLogout(false)}
      />
      <AlertModal
        visible={menuError !== null}
        type="error"
        title="Error"
        message={menuError ?? ''}
        confirmText="OK"
        onConfirm={() => setMenuError(null)}
      />
    </SafeAreaView>
  );
}

function BannerCarousel({ slides }: { slides: { url: string | null; title: string; subtitle: string }[] }) {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const width = Dimensions.get('window').width;

  const goTo = useCallback((i: number) => {
    const target = ((i % slides.length) + slides.length) % slides.length;
    scrollRef.current?.scrollTo({ x: target * width, animated: true });
    setIndex(target);
  }, [slides.length, width]);

  useEffect(() => {
    if (slides.length < 2) return;
    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % slides.length;
        scrollRef.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, width]);

  useEffect(() => {
    setIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [slides]);

  if (!slides || slides.length === 0) return null;

  return (
    <View style={styles.bannerWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i !== index) setIndex(i);
        }}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          if (timerRef.current) clearInterval(timerRef.current);
        }}
        onScrollEndDrag={() => {
          if (slides.length > 1 && timerRef.current === null) {
            timerRef.current = setInterval(() => {
              setIndex((prev) => {
                const next = (prev + 1) % slides.length;
                scrollRef.current?.scrollTo({ x: next * width, animated: true });
                return next;
              });
            }, 4000);
          }
        }}
      >
        {slides.map((slide, i) => (
          <View key={i} style={[styles.bannerSlide, { width }]}>
            {slide.url ? (
              <Image source={{ uri: slide.url }} style={styles.bannerImage} resizeMode="cover" />
            ) : (
              <View style={[styles.bannerImage, styles.bannerImageFallback]} />
            )}
            <View style={styles.bannerOverlay} />
            <Text style={styles.bannerEyebrow}>M-TAI • FEATURED</Text>
            <Text style={styles.bannerTitle}>{slide.title}</Text>
            <Text style={styles.bannerSubtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>
      {slides.length > 1 && (
        <View style={styles.bannerDots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.bannerDot, i === index && styles.bannerDotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

function FilterSheetModal({
  visible,
  priceMin,
  priceMax,
  onChangeMin,
  onChangeMax,
  onApply,
  onClear,
  onClose,
}: {
  visible: boolean;
  priceMin: string;
  priceMax: string;
  onChangeMin: (v: string) => void;
  onChangeMax: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.sheetBackdrop}>
        <TouchableOpacity
          style={styles.sheetBackdropTouch}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheetCard}>
          <View style={styles.sheetHandle} />
          <View style={styles.filterSheetHeader}>
            <Text style={styles.filterSheetTitle}>Filter Products</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={22} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Price Range (TZS)</Text>
          <View style={styles.priceRowInputs}>
            <View style={styles.priceInputWrap}>
              <Text style={styles.priceInputPrefix}>Min</Text>
              <TextInput
                style={styles.priceInput}
                value={priceMin}
                onChangeText={onChangeMin}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={COLORS.gray[400]}
              />
            </View>
            <View style={styles.priceInputWrap}>
              <Text style={styles.priceInputPrefix}>Max</Text>
              <TextInput
                style={styles.priceInput}
                value={priceMax}
                onChangeText={onChangeMax}
                placeholder="Any"
                keyboardType="numeric"
                placeholderTextColor={COLORS.gray[400]}
              />
            </View>
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearButton} onPress={onClear} activeOpacity={0.8}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <Button title="Apply" onPress={onApply} size="md" style={styles.applyButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ScrollCategories({ chips }: { chips: React.ReactNode[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
      style={styles.chipWrap}
    >
      {chips}
    </ScrollView>
  );
}

function productGridLabel(count: number): string {
  if (count === 0) return 'Explore';
  return 'For You';
}

const CARD_GAP = SPACING.md;
const LIST_PADDING = SPACING.md;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LIST_PADDING,
    paddingTop: SPACING.sm + 4,
    paddingBottom: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  homeHeaderText: {
    flex: 1,
    marginLeft: SPACING.sm,
    marginRight: SPACING.sm,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  userName: {
    fontSize: FONTS.size.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: 2,
    flexShrink: 1,
  },
  tagline: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 2,
  },
  homeHeaderActions: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  dotsButton: {
    width: 26,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: FONTS.size.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    overflow: 'hidden',
    height: 46,
  },
  searchBarInner: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  searchFilterIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.gray[200],
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdropTouch: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  sheetCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray[300],
    marginBottom: SPACING.md,
  },
  filterSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  filterSheetTitle: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  filterLabel: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  priceRowInputs: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  priceInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm + 2,
    backgroundColor: COLORS.gray[50],
  },
  priceInputPrefix: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.gray[500],
    marginRight: SPACING.xs,
  },
  priceInput: {
    flex: 1,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONTS.size.md,
    color: COLORS.text,
    fontFamily: FONTS.medium,
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  clearButton: {
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
  },
  clearButtonText: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.primaryDark,
  },
  applyButton: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  bannerWrap: {
    height: 190,
    marginHorizontal: LIST_PADDING,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  bannerSlide: {
    height: 190,
    justifyContent: 'flex-end',
    padding: SPACING.lg,
    backgroundColor: COLORS.primaryDark,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.primaryDark,
  },
  bannerImageFallback: {
    backgroundColor: COLORS.primary,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  bannerEyebrow: {
    color: COLORS.white,
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  bannerTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontFamily: FONTS.bold,
    lineHeight: 29,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    marginTop: SPACING.xs,
    maxWidth: 280,
  },
  bannerDots: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.sm,
    flexDirection: 'row',
    gap: 5,
  },
  bannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  bannerDotActive: {
    backgroundColor: COLORS.white,
    width: 18,
  },
  searchWrap: {
    paddingHorizontal: LIST_PADDING,
    paddingVertical: SPACING.md,
  },
  staticCategories: {
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  chipWrap: {
    paddingBottom: SPACING.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: LIST_PADDING,
  },
  catIconWrapActive: {
    backgroundColor: COLORS.primaryDark,
  },
  catTouchable: {
    flex: undefined,
    width: 64,
  },
  catTileTextActive: {
    color: COLORS.primaryDark,
    fontFamily: FONTS.semibold,
  },
  trustRow: {
    flexDirection: 'row',
    marginHorizontal: LIST_PADDING,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  trustIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.teal[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  listHeader: {
    paddingBottom: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: LIST_PADDING,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md - CARD_GAP / 2,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    fontFamily: FONTS.regular,
  },
  column: {
    gap: CARD_GAP,
    paddingHorizontal: LIST_PADDING,
    marginBottom: CARD_GAP,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginHorizontal: LIST_PADDING,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm + 2,
  },
  shopAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.teal[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 2,
  },
  shopAvatarText: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  shopInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  shopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopName: {
    flexShrink: 1,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  shopCategory: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    marginTop: 1,
  },
  shareBtn: {
    padding: 6,
  },
  imageBox: {
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageInitial: {
    fontSize: FONTS.size.xxxl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  saleTag: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  saleTagText: {
    color: COLORS.white,
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: FONTS.size.md,
  },
  cardBody: {
    padding: SPACING.sm + 4,
    gap: SPACING.xs,
  },
  category: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: COLORS.primaryDark,
  },
  name: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    lineHeight: 22,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.teal[50],
  },
  cartCount: {
    position: 'absolute',
    top: 2,
    right: 2,
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
    fontFamily: FONTS.bold,
  },
  listContent: {
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  footer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: LIST_PADDING,
  },
});
