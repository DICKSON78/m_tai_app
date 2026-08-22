import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import api from '../../src/api/client';
import { Delivery } from '../../src/api/types';
import Badge from '../../src/components/Badge';
import Button from '../../src/components/Button';
import EmptyState from '../../src/components/EmptyState';
import Header from '../../src/components/Header';
import PriceTag from '../../src/components/PriceTag';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';

interface Coordinates {
  latitude: number;
  longitude: number;
}

const DEFAULT_REGION: Region = {
  latitude: -6.7924,
  longitude: 39.2083,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const ACTIVE_STATUSES = new Set(['assigned', 'picked_up', 'in_transit']);

const STATUS_META: Record<string, { label: string; color: string }> = {
  assigned: { label: 'Assigned', color: '#5B8DEF' },
  picked_up: { label: 'Picked Up', color: '#8B5CF6' },
  in_transit: { label: 'In Transit', color: COLORS.warning },
};

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

function orderLabel(delivery: Delivery): string {
  const number = delivery.order?.order_number;
  if (number) return number.startsWith('#') ? number : `#${number}`;
  return `#${delivery.id}`;
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

function statusMeta(status: string): { label: string; color: string } {
  return (
    STATUS_META[status] ?? {
      label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
      color: COLORS.gray[400],
    }
  );
}

type DeliverableWithCoords = Delivery & Required<Pick<Delivery, 'latitude' | 'longitude'>>;

function hasCoordinates(delivery: Delivery): delivery is DeliverableWithCoords {
  return delivery.latitude != null && delivery.longitude != null;
}

export default function ActiveMapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [deliveries, setDeliveries] = useState<DeliverableWithCoords[]>([]);
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadDeliveries = useCallback(async () => {
    try {
      const response = await api.get('/deliveries/my');
      const withCoords = normalizeList(response.data)
        .filter((d) => ACTIVE_STATUSES.has(d.status))
        .filter(hasCoordinates)
        .sort((a, b) => b.id - a.id);
      setDeliveries(withCoords);
      setNotice(null);
    } catch (error) {
      setNotice(extractErrorMessage(error, 'Could not load your active deliveries.'));
    }
  }, []);

  const locateUser = useCallback(async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setNotice('Location permission denied — showing the default area instead.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      mapRef.current?.animateToRegion(
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        600
      );
    } catch {
      setNotice('Could not determine your current location.');
    }
  }, []);

  useEffect(() => {
    Promise.all([locateUser(), loadDeliveries()]).finally(() => setLoading(false));
  }, [locateUser, loadDeliveries]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDeliveries();
    setRefreshing(false);
  }, [loadDeliveries]);

  const selected =
    deliveries.find((d) => d.id === selectedId) ?? deliveries[0] ?? null;

  const openNavigation = useCallback((latitude: number, longitude: number) => {
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    const appUrl = Platform.select({
      ios: `maps:?daddr=${latitude},${longitude}&dirflg=d`,
      android: `google.navigation:q=${latitude},${longitude}&mode=d`,
    });
    Linking.openURL(appUrl ?? fallbackUrl).catch(() => Linking.openURL(fallbackUrl));
  }, []);

  const recenter = useCallback(() => {
    if (!userCoords) {
      Alert.alert('Location unavailable', 'We could not find your current position.');
      return;
    }
    mapRef.current?.animateToRegion(
      {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500
    );
  }, [userCoords]);

  const distanceLabel = useMemo(() => {
    if (!selected || !userCoords) return null;
    return `${haversineKm(userCoords, {
      latitude: selected.latitude,
      longitude: selected.longitude,
    }).toFixed(1)} km away`;
  }, [selected, userCoords]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        loadingEnabled={loading}
        toolbarEnabled={false}
      >
        {userCoords ? (
          <Marker coordinate={userCoords} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.userMarker}>
              <View style={styles.userMarkerCore} />
            </View>
          </Marker>
        ) : null}
        {deliveries.map((delivery) => {
          const isSelected = selected?.id === delivery.id;
          return (
            <Marker
              key={delivery.id}
              coordinate={{
                latitude: delivery.latitude,
                longitude: delivery.longitude,
              }}
              pinColor={isSelected ? COLORS.primary : statusMeta(delivery.status).color}
              onPress={() => setSelectedId(delivery.id)}
              description={`${orderLabel(delivery)} · ${delivery.delivery_address}`}
            />
          );
        })}
      </MapView>

      <View style={[styles.headerOverlay, { paddingTop: insets.top }]}>
        <Header title="Active Map" onBack={() => router.back()} />
        {notice ? (
          <View style={styles.noticeBanner}>
            <Text style={styles.noticeText} numberOfLines={2}>
              {notice}
            </Text>
            <TouchableOpacity onPress={handleRefresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.noticeRetry}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.recenterButton} onPress={recenter} activeOpacity={0.7}>
        <View style={styles.recenterRing}>
          <View style={styles.recenterDot} />
        </View>
      </TouchableOpacity>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.md }]}>
        <View style={styles.sheetHandle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {selected ? (
            <>
              <View style={styles.sheetTopRow}>
                <Badge
                  label={statusMeta(selected.status).label}
                  color={statusMeta(selected.status).color}
                  size="sm"
                />
                {selected.order ? <PriceTag price={selected.order.total} size="sm" /> : null}
              </View>
              <Text style={styles.sheetOrderNumber}>{orderLabel(selected)}</Text>
              {distanceLabel ? <Text style={styles.sheetDistance}>{distanceLabel}</Text> : null}
              <View style={styles.sheetAddressBlock}>
                <View style={styles.sheetAddressRow}>
                  <View style={[styles.addressDot, { backgroundColor: COLORS.green[500] }]} />
                  <Text style={styles.sheetAddressText} numberOfLines={1}>
                    {selected.pickup_address}
                  </Text>
                </View>
                <View style={styles.sheetAddressRow}>
                  <View style={[styles.addressDot, { backgroundColor: COLORS.red[500] }]} />
                  <Text style={styles.sheetAddressText} numberOfLines={1}>
                    {selected.delivery_address}
                  </Text>
                </View>
              </View>
              <View style={styles.sheetActions}>
                <Button
                  title="Navigate"
                  size="md"
                  style={styles.sheetActionButton}
                  onPress={() =>
                    openNavigation(
                      selected.latitude,
                      selected.longitude
                    )
                  }
                />
                <Button
                  title="Details"
                  variant="secondary"
                  size="md"
                  style={styles.sheetActionButton}
                  onPress={() =>
                    router.push({
                      pathname: '/delivery-detail',
                      params: { id: String(selected.id) },
                    })
                  }
                />
              </View>
            </>
          ) : (
            <EmptyState
              title="No active deliveries"
              subtitle="Accepted deliveries with a location will appear on this map."
              actionTitle={refreshing ? 'Refreshing…' : 'Refresh'}
              onAction={handleRefresh}
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.overlay,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  noticeText: {
    flex: 1,
    color: COLORS.white,
    fontSize: FONTS.size.sm,
    marginRight: SPACING.sm,
  },
  noticeRetry: {
    color: COLORS.primary,
    fontSize: FONTS.size.sm,
    fontWeight: '700',
  },
  userMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(91, 141, 239, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#5B8DEF',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  recenterButton: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 320,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  recenterRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.gray[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  recenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gray[700],
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: 300,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    ...SHADOWS.lg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[200],
    marginBottom: SPACING.md,
  },
  sheetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetOrderNumber: {
    fontSize: FONTS.size.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  sheetDistance: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  sheetAddressBlock: {
    marginTop: SPACING.md,
    gap: SPACING.xs + 2,
  },
  sheetAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  addressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sheetAddressText: {
    flex: 1,
    fontSize: FONTS.size.md,
    color: COLORS.gray[700],
  },
  sheetActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  sheetActionButton: {
    flex: 1,
  },
});
