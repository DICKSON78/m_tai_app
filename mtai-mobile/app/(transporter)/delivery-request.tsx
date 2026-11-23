import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import api from '../../src/api/client';
import { Delivery } from '../../src/api/types';
import Badge from '../../src/components/Badge';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import DeliveryMap from '../../src/components/DeliveryMap';
import Header from '../../src/components/Header';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const data = (error as { response?: { data?: unknown } }).response?.data;
    if (typeof data === 'string' && data.length > 0) return data;
    const message = (data as { message?: string } | undefined)?.message;
    if (message) return message;
  }
  return fallback;
}

function formatMoney(value?: number | string | null): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return 'TZS 0';
  return `TZS ${amount.toLocaleString('en-TZ')}`;
}

function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export default function DeliveryRequestScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const deliveryId = Number(Array.isArray(params.id) ? params.id[0] : params.id);
  const insets = useSafeAreaInsets();

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const respondedRef = useRef(false);

  const fetchOffer = useCallback(async () => {
    if (!Number.isFinite(deliveryId)) {
      setLoadError('Invalid delivery request.');
      setLoading(false);
      return;
    }
    try {
      const response = await api.get(`/transporter/deliveries/${deliveryId}`);
      const next = (response.data?.data ?? response.data) as Delivery;
      setDelivery(next);
      setLoadError(null);

      if (next.offer_expires_at) {
        const remaining = Math.ceil(
          (new Date(next.offer_expires_at).getTime() - Date.now()) / 1000
        );
        setSecondsLeft(Math.max(0, remaining));
        setExpired(remaining <= 0);
      }

      if (next.status !== 'pending') {
        setExpired(true);
      }
    } catch (error) {
      setLoadError(extractErrorMessage(error, 'This request is no longer available.'));
      setExpired(true);
    } finally {
      setLoading(false);
    }
  }, [deliveryId]);

  useEffect(() => {
    void fetchOffer();
  }, [fetchOffer]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted || cancelled) return;
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setMyLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      } catch {
        // Location is optional; distance simply won't be shown.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous === null) return null;
        if (previous <= 1) {
          clearInterval(timer);
          setExpired(true);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft === null]); // eslint-disable-line react-hooks/exhaustive-deps

  const countdownLabel = useMemo(() => {
    if (secondsLeft === null) return 'Respond now';
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')} left to respond`;
  }, [secondsLeft]);

  const pickupAddress = delivery?.pickup_location ?? delivery?.pickup_address ?? 'Pickup point';
  const dropoffAddress = delivery?.destination ?? delivery?.delivery_address ?? 'Destination';
  const pickupCoords =
    delivery?.pickup_latitude != null && delivery?.pickup_longitude != null
      ? { latitude: delivery.pickup_latitude, longitude: delivery.pickup_longitude }
      : null;
  const distanceLabel =
    pickupCoords && myLocation
      ? `${haversineKm(myLocation, pickupCoords).toFixed(1)} km from you`
      : 'Nearby';

  const handleAccept = useCallback(async () => {
    if (!delivery || accepting || respondedRef.current || expired) return;
    respondedRef.current = true;
    setAccepting(true);
    try {
      await api.post(`/transporter/deliveries/${delivery.id}/accept`);
      Alert.alert('Delivery accepted', 'Head to the pickup point. You can now track the load.', [
        {
          text: 'Track Load',
          onPress: () =>
            router.replace({
              pathname: '/(transporter)/delivery-detail',
              params: { id: String(delivery.id) },
            }),
        },
      ]);
    } catch (error) {
      respondedRef.current = false;
      Alert.alert('Could not accept', extractErrorMessage(error, 'Please try again.'));
    } finally {
      setAccepting(false);
    }
  }, [delivery, accepting, expired]);

  const handleReject = useCallback(async () => {
    if (!delivery || rejecting || respondedRef.current || expired) return;
    respondedRef.current = true;
    setRejecting(true);
    try {
      await api.post(`/transporter/deliveries/${delivery.id}/reject`, {
        reason: 'Nimkata ofa hii',
      });
      router.replace('/(transporter)');
    } catch (error) {
      respondedRef.current = false;
      Alert.alert('Could not reject', extractErrorMessage(error, 'Please try again.'));
    } finally {
      setRejecting(false);
    }
  }, [delivery, rejecting, expired]);

  if (loading && !delivery) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="New Delivery Request" subtitle="Load available near you" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 200 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.alertBanner}>
          <View style={styles.alertIcon}>
            <MaterialIcons name="local-shipping" size={22} color={COLORS.white} />
          </View>
          <View style={styles.alertText}>
            <Text style={styles.alertTitle}>{expired ? 'Request expired' : 'New load request'}</Text>
            <Text style={styles.alertSubtitle}>
              {expired ? 'This offer is no longer active.' : countdownLabel}
            </Text>
          </View>
          {!expired ? <View style={styles.pulseDot} /> : null}
        </View>

        {loadError ? (
          <Card style={styles.section}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Button title="Refresh" variant="outline" size="sm" onPress={() => void fetchOffer()} />
          </Card>
        ) : null}

        {delivery ? (
          <>
            <Card style={styles.section}>
              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.sectionLabel}>Offered fare</Text>
                  <Text style={styles.price}>{formatMoney(delivery.offered_price)}</Text>
                </View>
                <Badge label={distanceLabel} color={COLORS.primaryDark} size="sm" />
              </View>
              {delivery.item_description ? (
                <Text style={styles.itemDescription}>{delivery.item_description}</Text>
              ) : null}
            </Card>

            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Route</Text>
              <View style={styles.routeRow}>
                <View style={styles.routeDots}>
                  <View style={[styles.routeDot, { backgroundColor: COLORS.green[500] }]} />
                  <View style={styles.routeLine} />
                  <View style={[styles.routeDot, { backgroundColor: COLORS.red[500] }]} />
                </View>
                <View style={styles.routeAddresses}>
                  <View style={styles.routeAddressBlock}>
                    <Text style={styles.routeLabel}>PICKUP</Text>
                    <Text style={styles.routeValue}>{pickupAddress}</Text>
                  </View>
                  <View style={styles.routeAddressBlock}>
                    <Text style={styles.routeLabel}>DROP-OFF</Text>
                    <Text style={styles.routeValue}>{dropoffAddress}</Text>
                  </View>
                </View>
              </View>
              {pickupCoords ? (
                <View style={styles.mapWrap}>
                  <DeliveryMap
                    coordinate={pickupCoords}
                    address={pickupAddress}
                    onNavigate={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${pickupCoords.latitude},${pickupCoords.longitude}`;
                      Linking.openURL(url).catch(() => undefined);
                    }}
                  />
                </View>
              ) : null}
            </Card>

            {delivery.business ? (
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Customer</Text>
                <Text style={styles.customerName}>
                  {delivery.business.business_name ?? delivery.business.name ?? 'M-TAI Customer'}
                </Text>
                {delivery.customer?.phone ? (
                  <Text style={styles.customerPhone}>{delivery.customer.phone}</Text>
                ) : null}
              </Card>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <Button
          title="Reject"
          variant="outline"
          size="lg"
          onPress={handleReject}
          loading={rejecting}
          disabled={expired || accepting}
          style={styles.footerHalf}
        />
        <Button
          title={expired ? 'Request Closed' : 'Accept Load'}
          size="lg"
          onPress={handleAccept}
          loading={accepting}
          disabled={expired || rejecting}
          style={styles.footerHalf}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    color: COLORS.white,
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
  },
  alertSubtitle: {
    color: COLORS.gray[300],
    fontSize: FONTS.size.sm,
    marginTop: 2,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  section: {
    marginTop: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: COLORS.textLight,
    fontSize: FONTS.size.sm,
    marginBottom: SPACING.xs,
  },
  price: {
    color: COLORS.primaryDark,
    fontSize: FONTS.size.xxxl,
    fontFamily: FONTS.bold,
  },
  itemDescription: {
    marginTop: SPACING.md,
    color: COLORS.gray[700],
    fontSize: FONTS.size.md,
    lineHeight: 21,
  },
  sectionTitle: {
    color: COLORS.textLight,
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  routeRow: {
    flexDirection: 'row',
  },
  routeDots: {
    alignItems: 'center',
    paddingTop: 5,
    marginRight: SPACING.md,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeLine: {
    width: 2,
    flex: 1,
    minHeight: 30,
    backgroundColor: COLORS.gray[300],
    marginVertical: 4,
  },
  routeAddresses: {
    flex: 1,
    gap: SPACING.lg,
  },
  routeAddressBlock: {},
  routeLabel: {
    color: COLORS.textLight,
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  routeValue: {
    color: COLORS.text,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    marginTop: 2,
  },
  mapWrap: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  customerName: {
    color: COLORS.text,
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
  },
  customerPhone: {
    color: COLORS.textLight,
    fontSize: FONTS.size.md,
    marginTop: 2,
  },
  errorText: {
    color: COLORS.red[700],
    fontSize: FONTS.size.md,
    marginBottom: SPACING.md,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray[200],
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    ...SHADOWS.md,
  },
  footerHalf: {
    flex: 1,
  },
});
