import { Delivery } from '../../src/api/types';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface TransporterMapHandle {
  animateToRegion: (region: Region, duration?: number) => void;
}

interface DeliveryItem {
  id: number;
  latitude: number;
  longitude: number;
  status: string;
  order?: { total?: number; order_number?: string } | undefined;
  delivery_address?: string;
}

export interface TransporterMapProps {
  initialRegion: Region;
  userCoords: { latitude: number; longitude: number } | null;
  deliveries: DeliveryItem[];
  selectedId: number | null;
  onSelectId: (id: number) => void;
  loading: boolean;
  statusColor: (status: string) => string;
  onNavigate: (latitude: number, longitude: number) => void;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  assigned: { label: 'Assigned', color: COLORS.info },
  picked_up: { label: 'Picked Up', color: COLORS.primaryDark },
  in_transit: { label: 'In Transit', color: COLORS.warning },
};

export function statusMeta(status: string): { label: string; color: string } {
  return (
    STATUS_META[status] ?? {
      label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
      color: COLORS.gray[400],
    }
  );
}

function orderLabel(delivery: { order?: { order_number?: string }; id: number }): string {
  const number = delivery.order?.order_number;
  if (number) return number.startsWith('#') ? number : `#${number}`;
  return `#${delivery.id}`;
}

export default forwardRef<TransporterMapHandle, TransporterMapProps>(function TransporterMap(
  props,
  ref
) {
  const { initialRegion, userCoords, deliveries, selectedId, onSelectId, loading, statusColor, onNavigate } =
    props;
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region: Region, duration?: number) => {
      mapRef.current?.animateToRegion(region, duration);
    },
  }), []);

  const selected =
    deliveries.find((d) => d.id === selectedId) ?? deliveries[0] ?? null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
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
              coordinate={{ latitude: delivery.latitude, longitude: delivery.longitude }}
              pinColor={isSelected ? COLORS.primary : statusColor(delivery.status)}
              onPress={() => onSelectId(delivery.id)}
              description={`${orderLabel(delivery)} · ${delivery.delivery_address}`}
            />
          );
        })}
      </MapView>

      {selected && (
        <View style={styles.infoBadge}>
          <Text style={styles.infoLabel}>{orderLabel(selected)}</Text>
          <Text style={styles.infoAddress} numberOfLines={1}>
            {selected.delivery_address}
          </Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => onNavigate(selected.latitude, selected.longitude)}
            activeOpacity={0.8}
          >
            <Text style={styles.navButtonText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: COLORS.info,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  infoBadge: {
    position: 'absolute',
    bottom: 60,
    left: 12,
    right: 12,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    ...SHADOWS.md,
  },
  infoLabel: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  infoAddress: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  navButton: {
    marginTop: SPACING.xs,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  navButtonText: {
    color: COLORS.white,
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
  },
});