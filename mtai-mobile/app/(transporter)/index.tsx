import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import api from '../../src/api/client';
import { Delivery } from '../../src/api/types';
import Badge from '../../src/components/Badge';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';

type TabKey = 'available' | 'mine';

interface Coordinates {
  latitude: number;
  longitude: number;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'available', label: 'Available' },
  { key: 'mine', label: 'My Deliveries' },
];

const ACTIVE_STATUSES = new Set(['accepted', 'in_transit']);

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'Offer Pending', color: COLORS.warning },
  accepted: { label: 'Accepted', color: COLORS.info },
  in_transit: { label: 'In Transit', color: COLORS.warning },
  delivered: { label: 'Delivered', color: COLORS.success },
  cancelled: { label: 'Cancelled', color: COLORS.red[500] },
};

const OFFER_POLL_MS = 5000;
const LOCATION_REPORT_MS = 15000;

function normalizeList(payload: unknown): Delivery[] {
  if (Array.isArray(payload)) return payload as Delivery[];
  const data = (payload as { data?: unknown })?.data;
  if (Array.isArray(data)) return data as Delivery[];
  const nested = (data as { data?: unknown })?.data;
  if (Array.isArray(nested)) return nested as Delivery[];
  return [];
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data;
    if (typeof data === 'string' && data.length > 0) return data;
    const message = (data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  return fallback;
}

function humanizeStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

function statusMeta(status: string): { label: string; color: string } {
  return STATUS_META[status] ?? { label: humanizeStatus(status), color: COLORS.gray[400] };
}

function orderLabel(delivery: Delivery): string {
  const number = delivery.order?.order_number;
  if (number) return number.startsWith('#') ? number : `#${number}`;
  return `#${delivery.id}`;
}

function formatDateTime(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

function haversineKm(a: Coordinates, b: Coordinates): number {
  const earthRadius = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function getDistanceLabel(delivery: Delivery, userLocation: Coordinates | null): string {
  if (
    userLocation &&
    delivery.pickup_latitude != null &&
    delivery.pickup_longitude != null
  ) {
    const km = haversineKm(userLocation, {
      latitude: delivery.pickup_latitude,
      longitude: delivery.pickup_longitude,
    });
    return `${km.toFixed(1)} km away`;
  }
  return 'Pickup nearby';
}

function pickupAddress(delivery: Delivery): string {
  return delivery.pickup_location ?? delivery.pickup_address ?? 'Pickup point';
}

function dropoffAddress(delivery: Delivery): string {
  return delivery.destination ?? delivery.delivery_address ?? 'Destination';
}

function fare(delivery: Delivery): number {
  return Number(delivery.offered_price ?? 0);
}

function formatMoney(value: number): string {
  return `TZS ${value.toLocaleString('en-TZ')}`;
}

function sortNewestFirst(list: Delivery[]): Delivery[] {
  return [...list].sort((a, b) => b.id - a.id);
}

function sortActiveFirst(list: Delivery[]): Delivery[] {
  return [...list].sort((a, b) => {
    const aActive = ACTIVE_STATUSES.has(a.status) ? 0 : 1;
    const bActive = ACTIVE_STATUSES.has(b.status) ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    return b.id - a.id;
  });
}

function AddressRow({ dotColor, address }: { dotColor: string; address: string }) {
  return (
    <View style={styles.addressRow}>
      <View style={[styles.addressDot, { backgroundColor: dotColor }]} />
      <Text style={styles.addressText} numberOfLines={2}>
        {address}
      </Text>
    </View>
  );
}

export default function DeliveriesScreen() {
  const [tab, setTab] = useState<TabKey>('available');
  const [available, setAvailable] = useState<Delivery[]>([]);
  const [mine, setMine] = useState<Delivery[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [offers, setOffers] = useState<Delivery[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenOffersRef = useRef<Set<number>>(new Set());
  const offersInitializedRef = useRef(false);

  // Share live location so dispatch can pick the driver closest to a new load.
  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const report = async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        const granted = permission.granted || (await Location.requestForegroundPermissionsAsync()).granted;
        if (!granted || cancelled) return;
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        if (cancelled) return;
        setUserLocation(coords);
        await api.post('/transporter/location', coords);
      } catch {
        // Location reporting is best effort; dispatch will use the last known point.
      }
    };

    void report();
    interval = setInterval(() => void report(), LOCATION_REPORT_MS);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, []);

  const loadDeliveries = useCallback(async () => {
    setLoadError(null);
    const [availableRes, mineRes, offersRes, unreadRes] = await Promise.allSettled([
      api.get('/transporter/deliveries/available'),
      api.get('/transporter/deliveries'),
      api.get('/transporter/deliveries/offers'),
      api.get('/notifications/unread-count'),
    ]);
    if (availableRes.status === 'fulfilled') {
      setAvailable(sortNewestFirst(normalizeList(availableRes.value.data)));
    } else {
      setAvailable([]);
    }
    if (mineRes.status === 'fulfilled') {
      setMine(sortActiveFirst(normalizeList(mineRes.value.data)));
    } else {
      setMine([]);
    }
    if (offersRes.status === 'fulfilled') {
      const incoming = normalizeList(offersRes.value.data);
      setOffers(incoming);
      const unseen = incoming.filter((offer) => !seenOffersRef.current.has(offer.id));
      incoming.forEach((offer) => seenOffersRef.current.add(offer.id));
      if (unseen.length > 0 && offersInitializedRef.current) {
        const offer = unseen[0];
        Alert.alert(
          'New delivery request',
          `${pickupAddress(offer)} → ${dropoffAddress(offer)}\nFare ${formatMoney(fare(offer))}`,
          [
            {
              text: 'View Request',
              onPress: () =>
                router.push({
                  pathname: '/delivery-request',
                  params: { id: String(offer.id) },
                }),
            },
            { text: 'Later', style: 'cancel' },
          ]
        );
      }
      offersInitializedRef.current = true;
    } else {
      setOffers([]);
    }
    if (unreadRes.status === 'fulfilled') {
      const body = unreadRes.value.data as { unread_count?: number; count?: number } | number;
      const count =
        typeof body === 'number'
          ? body
          : (body?.unread_count ?? body?.count ?? 0);
      setUnreadCount(count);
    }
    if (availableRes.status === 'rejected' && mineRes.status === 'rejected') {
      setLoadError(extractErrorMessage(availableRes.reason, 'Could not load deliveries.'));
    }
  }, []);

  useEffect(() => {
    loadDeliveries().finally(() => setInitialLoading(false));
  }, [loadDeliveries]);

  // Poll for new Uber/Bolt style load requests while the app is open.
  useEffect(() => {
    const interval = setInterval(() => void loadDeliveries(), OFFER_POLL_MS);
    return () => clearInterval(interval);
  }, [loadDeliveries]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDeliveries();
    setRefreshing(false);
  }, [loadDeliveries]);

  const openDetail = useCallback((delivery: Delivery) => {
    router.push({ pathname: '/delivery-detail', params: { id: String(delivery.id) } });
  }, []);

  const handleAccept = useCallback(
    async (delivery: Delivery) => {
      if (acceptingId != null) return;
      setAcceptingId(delivery.id);
      try {
        await api.post(`/transporter/deliveries/${delivery.id}/accept`);
        Alert.alert(
          'Delivery accepted',
          `Order ${orderLabel(delivery)} is now yours. Head to the pickup point to begin.`,
          [
            {
              text: 'View Details',
              onPress: () => openDetail(delivery),
            },
            { text: 'Later', style: 'cancel' },
          ]
        );
        await loadDeliveries();
      } catch (error) {
        Alert.alert('Could not accept', extractErrorMessage(error, 'Please try again.'));
      } finally {
        setAcceptingId(null);
      }
    },
    [acceptingId, loadDeliveries, openDetail]
  );

  const renderCard = ({ item }: { item: Delivery }) => {
    const meta = statusMeta(item.status);
    const posted = formatDateTime(item.created_at ?? item.offered_at);
    return (
      <Card style={styles.card}>
        <TouchableOpacity activeOpacity={0.85} onPress={() => openDetail(item)}>
          <View style={styles.cardTopRow}>
            <Badge label={meta.label} color={meta.color} size="sm" />
            <PriceTag price={fare(item)} size="sm" />
          </View>
          <Text style={styles.orderNumber}>{orderLabel(item)}</Text>
          {item.order?.business?.name ? (
            <Text style={styles.businessName}>{item.order.business.name}</Text>
          ) : null}
          <View style={styles.addressBlock}>
            <AddressRow dotColor={COLORS.green[500]} address={pickupAddress(item)} />
            <AddressRow dotColor={COLORS.red[500]} address={dropoffAddress(item)} />
          </View>
          <View style={styles.metaRow}>
            <View style={styles.distanceChip}>
              <Text style={styles.distanceText}>{getDistanceLabel(item, userLocation)}</Text>
            </View>
            {posted ? <Text style={styles.metaText}>Posted {posted}</Text> : null}
          </View>
        </TouchableOpacity>
        {tab === 'available' ? (
          <Button
            title="Accept Delivery"
            onPress={() => handleAccept(item)}
            loading={acceptingId === item.id}
            disabled={acceptingId != null && acceptingId !== item.id}
            style={styles.acceptButton}
          />
        ) : null}
      </Card>
    );
  };

  const renderSegmentedControl = () => (
    <View style={styles.segmentWrap}>
      <View style={styles.segment}>
        {TABS.map(({ key, label }) => {
          const isActive = tab === key;
          const count = key === 'available' ? available.length : mine.length;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setTab(key)}
              activeOpacity={0.8}
              style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
            >
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {label}
                {count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const listData = tab === 'available' ? available : mine;

  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header
        title="Deliveries"
        subtitle={`${mine.filter((d) => ACTIVE_STATUSES.has(d.status)).length} active · ${available.length} available`}
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/notifications' })}
              activeOpacity={0.7}
              style={styles.notificationLink}
            >
              <Text style={styles.mapLinkText}>Alerts</Text>
              {unreadCount > 0 ? (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/map' })}
              activeOpacity={0.7}
              style={styles.mapLink}
            >
              <Text style={styles.mapLinkText}>Map</Text>
            </TouchableOpacity>
          </View>
        }
      />
      {loadError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity onPress={handleRefresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {offers.length > 0 ? (
        <TouchableOpacity
          style={styles.offerBanner}
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: '/delivery-request',
              params: { id: String(offers[0].id) },
            })
          }
        >
          <View style={styles.offerIconRing}>
            <Text style={styles.offerIcon}>!</Text>
          </View>
          <View style={styles.offerText}>
            <Text style={styles.offerTitle}>
              {offers.length === 1 ? 'New load request' : `${offers.length} load requests`}
            </Text>
            <Text style={styles.offerSubtitle} numberOfLines={1}>
              {pickupAddress(offers[0])} → {dropoffAddress(offers[0])}
            </Text>
            <Text style={styles.offerFare}>{formatMoney(fare(offers[0]))}</Text>
          </View>
          <Text style={styles.offerChevron}>{'>'}</Text>
        </TouchableOpacity>
      ) : null}
      <FlatList
        data={listData}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderCard}
        ListHeaderComponent={renderSegmentedControl}
        ListEmptyComponent={
          tab === 'available' ? (
            <EmptyState
              title="No available deliveries"
              subtitle="New orders will appear here. Pull down to refresh."
            />
          ) : (
            <EmptyState
              title="No deliveries yet"
              subtitle="Accept an available delivery to get started."
              actionTitle="Browse Available"
              onAction={() => setTab('available')}
            />
          )
        }
        contentContainerStyle={
          listData.length === 0 ? styles.listContentEmpty : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  mapLink: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
  },
  notificationLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: COLORS.white,
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.bold,
  },
  mapLinkText: {
    color: COLORS.primaryDark,
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.red[100],
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  errorText: {
    flex: 1,
    color: COLORS.red[700],
    fontSize: FONTS.size.sm,
    marginRight: SPACING.sm,
  },
  retryText: {
    color: COLORS.red[700],
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
  },
  segmentWrap: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.full,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  segmentText: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.textLight,
  },
  segmentTextActive: {
    color: COLORS.primaryDark,
  },
  listContent: {
    paddingBottom: SPACING.xxl + SPACING.lg,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  card: {
    marginTop: SPACING.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  orderNumber: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  businessName: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  addressBlock: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  addressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  addressText: {
    flex: 1,
    fontSize: FONTS.size.md,
    color: COLORS.gray[700],
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  distanceChip: {
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm + 4,
  },
  distanceText: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    color: COLORS.gray[600],
  },
  metaText: {
    fontSize: FONTS.size.xs,
    color: COLORS.textLight,
  },
  acceptButton: {
    marginTop: SPACING.md,
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.secondary,
    ...SHADOWS.md,
  },
  offerIconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerIcon: {
    color: COLORS.white,
    fontSize: FONTS.size.xl,
    fontFamily: FONTS.bold,
  },
  offerText: {
    flex: 1,
  },
  offerTitle: {
    color: COLORS.white,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.bold,
  },
  offerSubtitle: {
    color: COLORS.gray[300],
    fontSize: FONTS.size.sm,
    marginTop: 2,
  },
  offerFare: {
    color: COLORS.primary,
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    marginTop: 4,
  },
  offerChevron: {
    color: COLORS.white,
    fontSize: FONTS.size.xl,
  },
});
