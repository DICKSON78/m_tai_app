import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Card from '../../../../src/components/Card';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../../../src/constants/theme';

interface ManageItem {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  subtitle: string;
  route: string;
}

const MANAGE_ITEMS: ManageItem[] = [
  { icon: 'people', label: 'CRM', subtitle: 'Leads & deals', route: '/manage/crm' },
  { icon: 'account-balance', label: 'Finance', subtitle: 'Accounts & journal', route: '/manage/finance' },
  { icon: 'warehouse', label: 'Warehouse', subtitle: 'Stores & transfers', route: '/manage/warehouse' },
  { icon: 'factory', label: 'Manufacturing', subtitle: 'BOMs & work orders', route: '/manage/manufacturing' },
  { icon: 'badge', label: 'HR', subtitle: 'Employees & attendance', route: '/manage/hr' },
  { icon: 'inventory', label: 'Inventory', subtitle: 'Stock & products', route: '/manage/inventory' },
  { icon: 'shopping-cart', label: 'Purchases', subtitle: 'Suppliers & orders', route: '/manage/purchases' },
];

export default function ManageHubScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Manage</Text>
          <Text style={styles.subtitle}>Everything for your business</Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.gridCard}>
          <View style={styles.grid}>
            {MANAGE_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.route}
                activeOpacity={0.8}
                style={styles.tile}
                onPress={() => router.push(item.route)}
              >
                <View style={styles.iconWrap}>
                  <MaterialIcons name={item.icon} size={24} color={COLORS.primaryDark} />
                </View>
                <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
                <Text style={styles.subtitleText} numberOfLines={1}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm + 4,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONTS.size.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 2,
  },
  content: {
    padding: SPACING.md,
  },
  gridCard: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  tile: {
    width: '28%',
    flexGrow: 1,
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.teal[50],
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  label: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
