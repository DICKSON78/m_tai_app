import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

export interface DeliveryMapProps {
  coordinate: { latitude: number; longitude: number };
  address: string;
  onNavigate: () => void;
}

export default function DeliveryMap({ coordinate, address, onNavigate }: DeliveryMapProps) {
  return (
    <View style={styles.mapWrapper}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        pointerEvents="none"
        loadingEnabled
        loadingBackgroundColor={COLORS.gray[50]}
        toolbarEnabled={false}
      >
        <Marker
          coordinate={coordinate}
          title="Drop-off"
          description={address}
          tracksViewChanges={false}
        >
          <View style={styles.dropMarker}>
            <View style={styles.dropMarkerCore} />
          </View>
        </Marker>
      </MapView>
      <TouchableOpacity
        style={styles.mapDirectionsBadge}
        onPress={onNavigate}
        activeOpacity={0.85}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <MaterialIcons name="directions" size={16} color={COLORS.white} />
        <Text style={styles.mapDirectionsText}>Directions</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  map: {
    width: '100%',
    height: 190,
  },
  dropMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.red[500],
    borderWidth: 3,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  dropMarkerCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.white,
  },
  mapDirectionsBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    ...SHADOWS.md,
  },
  mapDirectionsText: {
    color: COLORS.white,
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
  },
});