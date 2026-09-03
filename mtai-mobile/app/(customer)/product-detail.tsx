import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../src/api/client';
import { Product } from '../../src/api/types';
import Avatar from '../../src/components/Avatar';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import Input from '../../src/components/Input';
import LoadingScreen from '../../src/components/LoadingScreen';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useCartStore } from '../../src/store/cartStore';

const PLACEHOLDER_COLORS = ['#0FAE8C', '#2F80ED', '#F2994A', '#EB5757', '#9B51E0', '#27AE60'];

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

interface Review {
  id: number;
  rating: number;
  comment?: string;
  created_at?: string;
  user?: { id: number; name: string };
}

function extractRating(value: unknown): string {
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function normalizeReview(raw: any): Review | null {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: Number(raw.id ?? 0),
    rating: Number(raw.rating ?? 0),
    comment: raw.comment ?? undefined,
    created_at: raw.created_at ?? undefined,
    user: raw.user
      ? { id: Number(raw.user?.id ?? 0), name: String(raw.user?.name ?? 'Customer') }
      : undefined,
  };
}

function formatReviewDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistRecordId, setWishlistRecordId] = useState<number | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

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
    if (!product?.id) return;
    let cancelled = false;
    api
      .get('/customer/wishlist')
      .then((res) => {
        const body = res.data as { data?: Array<{ id: number; product_id?: number; product?: { id: number } }> };
        const list = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
            ? body.data
            : [];
        const match = list.find(
          (item) => item.product_id === product.id || item.product?.id === product.id
        );
        if (!cancelled) {
          setIsWishlisted(Boolean(match));
          setWishlistRecordId(match?.id ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsWishlisted(false);
          setWishlistRecordId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  const fetchReviews = useCallback(async () => {
    if (!product?.id) return;
    try {
      const res = await api.get(`/products/${product.id}/reviews`);
      const body = res.data as {
        reviews?: { data?: Array<Record<string, any>> } | Array<Record<string, any>>;
        average_rating?: number;
        total_reviews?: number;
      } | null;
      const reviewsRaw: any = body?.reviews ?? [];
      const rawList: Array<Record<string, any>> = Array.isArray(reviewsRaw)
        ? reviewsRaw
        : Array.isArray(reviewsRaw?.data)
          ? reviewsRaw.data
          : [];
      setReviews(rawList.map((r) => normalizeReview(r)).filter(Boolean) as Review[]);
      setAverageRating(Number(body?.average_rating ?? 0));
      setTotalReviews(Number(body?.total_reviews ?? rawList.length));
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [product?.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = useCallback(async () => {
    if (!product?.id || reviewSubmitting) return;
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      await api.post(`/products/${product.id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim() ? reviewComment.trim() : undefined,
      });
      setReviewOpen(false);
      setReviewComment('');
      setReviewsLoading(true);
      await fetchReviews();
    } catch (err: any) {
      setReviewError(
        err?.response?.data?.message || err?.message || 'Could not submit your review.'
      );
    } finally {
      setReviewSubmitting(false);
    }
  }, [product?.id, reviewSubmitting, reviewRating, reviewComment, fetchReviews]);

  const handleToggleWishlist = useCallback(async () => {
    if (!product?.id || wishlistLoading) return;
    setWishlistLoading(true);
    const wasWishlisted = isWishlisted;
    const wasRecordId = wishlistRecordId;
    setIsWishlisted(!wasWishlisted);
    setWishlistRecordId(null);
    try {
      if (wasWishlisted && wasRecordId != null) {
        await api.delete(`/wishlist/${wasRecordId}`);
      } else {
        await api.post('/wishlist', { product_id: product.id });
      }
    } catch {
      setIsWishlisted(wasWishlisted);
      setWishlistRecordId(wasRecordId);
    } finally {
      setWishlistLoading(false);
    }
  }, [product?.id, isWishlisted, wishlistRecordId, wishlistLoading]);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 1600);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const stockQuantity = Number(product?.quantity ?? (product as any)?.stock_quantity ?? 0);
  const inStock = !Number.isNaN(stockQuantity) && stockQuantity > 0;

  const maxQuantity = Math.max(stockQuantity, 1);

  const decrement = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
  }, []);

  const increment = useCallback(() => {
    setQuantity((q) => Math.min(maxQuantity, q + 1));
  }, [maxQuantity]);

  const lineTotal = useMemo(
    () => (product ? productPrice(product) * quantity : 0),
    [product, quantity]
  );

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
          titleColor={COLORS.textLight}
          titleSize={FONTS.size.lg}
          onBack={() => router.back()}
          rightAction={
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleToggleWishlist}
                disabled={wishlistLoading}
                style={styles.cartButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons
                  name={isWishlisted ? 'favorite' : 'favorite-border'}
                  size={22}
                  color={isWishlisted ? COLORS.error : COLORS.primaryDark}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/cart')}
                style={styles.cartButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="shopping-bag" size={22} color={COLORS.primaryDark} />
                {cartCount > 0 ? (
                  <View style={styles.cartCount}>
                    <Text style={styles.cartCountText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          }
        />

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: SPACING.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroWrap}>
            <View style={[styles.heroImage, { backgroundColor: placeholderColor(product.id) }]}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.heroImageContent} resizeMode="cover" />
              ) : (
                <Text style={styles.heroInitial}>{product.name.charAt(0).toUpperCase()}</Text>
              )}
              <View style={styles.heroScrim} />
            </View>
            <View style={styles.heroTopRow}>
              {product.category?.name ? (
                <View style={styles.heroCategoryTag}>
                  <Text style={styles.heroCategoryText}>{product.category.name}</Text>
                </View>
              ) : null}
              <View
                style={[
                  styles.heroStockTag,
                  { backgroundColor: inStock ? COLORS.green[100] : COLORS.red[100] },
                ]}
              >
                <MaterialIcons
                  name={inStock ? 'check-circle' : 'error'}
                  size={14}
                  color={inStock ? COLORS.primaryDark : COLORS.red[700]}
                />
                <Text
                  style={[
                    styles.heroStockText,
                    { color: inStock ? COLORS.primaryDark : COLORS.red[700] },
                  ]}
                >
                  {inStock ? (stockQuantity <= 5 ? `Low stock · ${stockQuantity}` : 'In stock') : 'Out of stock'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.name}>{product.name}</Text>
            <View style={styles.businessLinkRow}>
              <MaterialIcons name="storefront" size={14} color={COLORS.gray[400]} />
              <Text style={styles.businessLinkText} numberOfLines={1}>
                {product.business?.name ?? 'M-TAI Store'}
              </Text>
            </View>
            <View style={styles.priceBox}>
              <PriceTag price={productPrice(product)} size="md" compareAt={product.compare_at_price ?? undefined} />
              {inStock && stockQuantity <= 5 ? (
                <Text style={styles.lowStockNote}>Only {stockQuantity} left in stock</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.trustStrip}>
            <TrustItem icon="verified" text="Authentic" />
            <TrustItem icon="local-shipping" text="Delivery" />
            <TrustItem icon="autorenew" text="Returns" />
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
                  <View style={styles.verifiedRow}>
                    <Text style={styles.businessName} numberOfLines={1}>
                      {product.business.name}
                    </Text>
                    <MaterialIcons name="verified" size={16} color="#1D9BF0" />
                  </View>
                  <Text style={styles.businessSubtitle}>Verified Business · M-TAI</Text>
                </View>
              </View>
            </Card>
          ) : null}

          <Card style={styles.reviewsCard}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.cardTitle}>Reviews</Text>
              {totalReviews > 0 ? (
                <View style={styles.ratingBadge}>
                  <MaterialIcons name="star" size={16} color="#FBBF24" />
                  <Text style={styles.ratingBadgeText}>{extractRating(averageRating)}</Text>
                  <Text style={styles.ratingBadgeCount}>({totalReviews})</Text>
                </View>
              ) : null}
            </View>

            {!reviewOpen ? (
              <Button
                title="Write a Review"
                variant="outline"
                size="sm"
                onPress={() => setReviewOpen(true)}
                style={styles.writeReviewButton}
              />
            ) : (
              <View style={styles.reviewForm}>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setReviewRating(star)}
                      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons
                        name={star <= reviewRating ? 'star' : 'star-border'}
                        size={30}
                        color={star <= reviewRating ? '#FBBF24' : COLORS.gray[300]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Input
                  label="Your review (optional)"
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder="Share your experience with this product…"
                  multiline
                />
                {reviewError ? <Text style={styles.reviewError}>{reviewError}</Text> : null}
                <View style={styles.reviewFormActions}>
                  <Button
                    title="Cancel"
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setReviewOpen(false);
                      setReviewError(null);
                    }}
                  />
                  <Button
                    title="Submit Review"
                    size="sm"
                    loading={reviewSubmitting}
                    onPress={handleSubmitReview}
                  />
                </View>
              </View>
            )}

            {reviewsLoading ? (
              <Text style={styles.reviewsEmpty}>Loading reviews…</Text>
            ) : reviews.length === 0 ? (
              <Text style={styles.reviewsEmpty}>
                No reviews yet. Be the first to review this product.
              </Text>
            ) : (
              reviews.map((review) => (
                <View key={String(review.id)} style={styles.reviewItem}>
                  <View style={styles.reviewTopRow}>
                    <View style={styles.reviewAuthorRow}>
                      <Avatar name={review.user?.name ?? 'Customer'} size={32} />
                      <View>
                        <Text style={styles.reviewAuthorName}>
                          {review.user?.name ?? 'Customer'}
                        </Text>
                        <Text style={styles.reviewDate}>
                          {formatReviewDate(review.created_at)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reviewStarsSmall}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <MaterialIcons
                          key={star}
                          name="star"
                          size={14}
                          color={star <= review.rating ? '#FBBF24' : COLORS.gray[200]}
                        />
                      ))}
                    </View>
                  </View>
                  {review.comment ? (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  ) : null}
                </View>
              ))
            )}
          </Card>
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

function productPrice(product: Product): number {
  const price = Number(product?.price ?? 0);
  if (price > 0) return price;
  const selling = Number((product as any)?.selling_price ?? 0);
  if (selling > 0) return selling;
  return Number((product as any)?.retail_price ?? 0);
}

function formatTZS(amount: number): string {
  const rounded = Math.round(amount);
  const withSeparators = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `TZS ${withSeparators}`;
}

function TrustItem({ icon, text }: { icon: keyof typeof MaterialIcons.glyphMap; text: string }) {
  return (
    <View style={styles.trustItem}>
      <View style={styles.trustIconWrap}>
        <MaterialIcons name={icon} size={16} color={COLORS.primaryDark} />
      </View>
      <Text style={styles.trustItemText}>{text}</Text>
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
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.teal[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cartCount: {
    position: 'absolute',
    top: 0,
    right: 0,
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
  scrollContent: {
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  heroWrap: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  heroImage: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageContent: {
    width: '100%',
    height: '100%',
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  heroInitial: {
    fontSize: 64,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  heroTopRow: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  heroCategoryTag: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  heroCategoryText: {
    color: COLORS.white,
    fontFamily: FONTS.semibold,
    fontSize: FONTS.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroStockTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  heroStockText: {
    fontFamily: FONTS.semibold,
    fontSize: FONTS.size.xs,
  },
  section: {
    paddingTop: SPACING.md,
    gap: SPACING.xs,
  },
  name: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    lineHeight: 24,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  businessLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  businessLinkText: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    fontFamily: FONTS.regular,
    flexShrink: 1,
  },
  lowStockNote: {
    fontSize: FONTS.size.sm,
    color: COLORS.warning,
    fontFamily: FONTS.semibold,
  },
  trustStrip: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    ...SHADOWS.sm,
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  trustIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.teal[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustItemText: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
    fontFamily: FONTS.medium,
  },
  descriptionCard: {
    marginTop: SPACING.md,
  },
  cardTitle: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  businessCard: {
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
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  businessName: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    flexShrink: 1,
  },
  businessSubtitle: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 2,
  },
  reviewsCard: {
    marginTop: SPACING.md,
    gap: SPACING.sm + 2,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  ratingBadgeText: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  ratingBadgeCount: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.gray[400],
  },
  writeReviewButton: {
    alignSelf: 'flex-start',
  },
  reviewForm: {
    gap: SPACING.sm,
  },
  starRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  reviewError: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.error,
  },
  reviewFormActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    justifyContent: 'flex-end',
  },
  reviewsEmpty: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
  },
  reviewItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray[200],
    paddingTop: SPACING.sm + 2,
    gap: SPACING.xs + 2,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  reviewAuthorName: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  reviewDate: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.regular,
    color: COLORS.gray[400],
    marginTop: 1,
  },
  reviewStarsSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  reviewComment: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    lineHeight: 20,
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
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  addButton: {
    flex: 1,
  },
});
