import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import type { TransporterMapHandle, TransporterMapProps, Region } from './TransporterMap';

export { TransporterMapHandle, Region } from './TransporterMap';
export type { TransporterMapProps } from './TransporterMap';

interface DeliveryItem {
  id: number;
  latitude: number;
  longitude: number;
  status: string;
  order?: { total?: number; order_number?: string } | undefined;
  delivery_address?: string;
}

function statusMeta(status: string) {
  const colors: Record<string, string> = {
    assigned: COLORS.info,
    picked_up: COLORS.primaryDark,
    in_transit: COLORS.warning,
  };
  return {
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
    color: colors[status] ?? COLORS.gray[400],
  };
}

function orderLabel(delivery: DeliveryItem): string {
  const number = delivery.order?.order_number;
  if (number) return number.startsWith('#') ? number : `#${number}`;
  return `#${delivery.id}`;
}

export default function TransporterMap(props: TransporterMapProps) {
  const { userCoords, deliveries, selectedId, onSelectId, loading, onNavigate } = props;

  const selected =
    deliveries.find((d) => d.id === selectedId) ?? deliveries[0] ?? null;

  return (
    <View style={styles.container}>
      {selected ? (
        <View style={styles.selectedCard}>
          <Text style={styles.orderLabel}>{orderLabel(selected)}</Text>
          <Text style={styles.status}>{statusMeta(selected.status).label}</Text>
          <Text style={styles.address} numberOfLines={2}>
            {selected.delivery_address}
          </Text>
          {userCoords && selected.latitude != null && selected.longitude != null ? (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => onNavigate(selected.latitude, selected.longitude)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="directions" size={20} color={COLORS.white} />
              <Text style={styles.navButtonText}>Navigate</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : loading ? (
        <Text style={styles.empty}>Loading deliveries…</Text>
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={(d) => String(d.id)}
          ListEmptyComponent={
            <Text style={styles.empty}>No active deliveries.</Text>
          }
          renderItem={({ item }) => {
            const active = item.id === selectedId;
            return (
              <TouchableOpacity
                style={[styles.row, active && styles.rowActive]}
                onPress={() => onSelectId(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.dot, { backgroundColor: statusMeta(item.status).color }]} />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowLabel}>{orderLabel(item)}</Text>
                  <Text style={styles.rowAddress} numberOfLines={1}>
                    {item.delivery_address}
                  </Text>
                </View>
                <Text style={styles.rowStatus}>{statusMeta(item.status).label}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  selectedCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.md,
    gap: SPACING.xs,
  },
  orderLabel: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  status: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  address: {
    fontSize: FONTS.size.md,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
  },
  navButtonText: {
    color: COLORS.white,
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  rowActive: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  rowAddress: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
  },
  rowStatus: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    fontFamily: FONTS.semibold,
  },
  empty: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});