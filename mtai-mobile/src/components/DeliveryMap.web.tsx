import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';

export interface DeliveryMapProps {
  coordinate: { latitude: number; longitude: number };
  address: string;
  onNavigate: () => void;
}

export default function DeliveryMap({ coordinate, address, onNavigate }: DeliveryMapProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.placeholder}>
        <View style={styles.pin}>
          <View style={styles.pinInner} />
        </View>
        <Text style={styles.address} numberOfLines={2}>
          {address}
        </Text>
        <Text style={styles.coords}>
          {coordinate.latitude.toFixed(5)}, {coordinate.longitude.toFixed(5)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.directionsBadge}
        onPress={onNavigate}
        activeOpacity={0.85}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <MaterialIcons name="directions" size={16} color={COLORS.white} />
        <Text style={styles.directionsText}>Directions</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.gray[300],
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  pinInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.white,
  },
  address: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    textAlign: 'center',
  },
  coords: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    fontVariant: ['tabular-nums'],
  },
  directionsBadge: {
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
  },
  directionsText: {
    color: COLORS.white,
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
  },
});