import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AlertModal from '../../src/components/AlertModal';
import Header from '../../src/components/Header';
import { useAuthStore } from '../../src/store/authStore';
import usePushNotifications from '../../src/hooks/usePushNotifications';
import { COLORS, SPACING, FONTS, RADIUS, SHADOWS } from '../../src/constants/theme';
import { User } from '../../src/api/types';

const ROLE_LABELS: Record<User['role'], string> = {
  customer: 'Customer',
  transporter: 'Transporter',
  employee: 'Employee',
  business_owner: 'Business Owner',
  admin: 'Administrator',
};

type MenuItem = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
};

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [enablingNotifications, setEnablingNotifications] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [infoAlert, setInfoAlert] = useState<string | null>(null);
  const { pushToken, requestPermission } = usePushNotifications();

  const handleEnableNotifications = async () => {
    setEnablingNotifications(true);
    try {
      const token = await requestPermission();
      if (!token) {
        setInfoAlert('Push notifications are not available on this device.');
      }
    } catch {
      setErrorAlert('Failed to enable push notifications. Please try again.');
    } finally {
      setEnablingNotifications(false);
    }
  };

  const handleContactSupport = () => {
    router.push('/contact-support');
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'receipt-long',
      label: 'My Orders',
      subtitle: 'Track all your purchases',
      onPress: () => router.push('/orders'),
    },
    {
      icon: 'favorite-border',
      label: 'Wishlist',
      subtitle: 'Products you saved for later',
      onPress: () => router.push('/wishlist'),
    },
    {
      icon: 'local-shipping',
      label: 'Deliveries',
      subtitle: 'Lives orders in transit',
      onPress: () => router.push('/deliveries'),
    },
    {
      icon: 'settings',
      label: 'Settings',
      subtitle: 'Notifications, support, privacy & more',
      onPress: () => router.push('/settings'),
    },
  ];

  const renderMenuRow = (item: MenuItem, last: boolean) => (
    <TouchableOpacity
      key={item.label}
      activeOpacity={0.7}
      onPress={item.onPress}
      style={[styles.row, !last && styles.rowBorder]}
    >
      <View style={styles.rowIcon}>
        <MaterialIcons name={item.icon} size={20} color={COLORS.primaryDark} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        {item.subtitle ? <Text style={styles.rowSubtitle}>{item.subtitle}</Text> : null}
      </View>
      <MaterialIcons name="chevron-right" size={22} color={COLORS.gray[400]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header title="Profile" />

      <ScrollView contentContainerStyle={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {(user?.name?.trim()?.charAt(0) || '?').toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || 'Guest'}
              </Text>
              <MaterialIcons name="verified" size={16} color="#1D9BF0" />
            </View>
            <Text style={styles.userRole}>
              {user ? ROLE_LABELS[user.role] ?? user.role : '—'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email || ''}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Menu</Text>
        <View style={styles.group}>
          {menuItems.map((item, i) => renderMenuRow(item, i === menuItems.length - 1))}
        </View>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.group}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleEnableNotifications}
            style={styles.row}
          >
            <View style={styles.rowIcon}>
              <MaterialIcons name="notifications-active" size={20} color={COLORS.primaryDark} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Push Notifications</Text>
              <Text style={styles.rowSubtitle}>Get instant order & delivery updates</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                pushToken ? styles.statusEnabled : styles.statusDisabled,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  pushToken ? styles.statusTextEnabled : styles.statusTextDisabled,
                ]}
              >
                {pushToken ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.group}>
          <TouchableOpacity activeOpacity={0.7} onPress={handleContactSupport} style={styles.row}>
            <View style={styles.rowIcon}>
              <MaterialIcons name="headset-mic" size={20} color={COLORS.primaryDark} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Contact Support</Text>
              <Text style={styles.rowSubtitle}>We usually reply within 24 hours</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.gray[400]} />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>M-TAI v1.0.0</Text>
      </ScrollView>

      <AlertModal
        visible={errorAlert !== null}
        type="error"
        title="Error"
        message={errorAlert ?? ''}
        confirmText="OK"
        onConfirm={() => setErrorAlert(null)}
      />
      <AlertModal
        visible={infoAlert !== null}
        type="info"
        title="M-TAI"
        message={infoAlert ?? ''}
        confirmText="OK"
        onConfirm={() => setInfoAlert(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingBottom: SPACING.xl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: FONTS.size.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  userName: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    flexShrink: 1,
  },
  userRole: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.semibold,
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  userEmail: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.bold,
    color: COLORS.textLight,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  group: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
  },
  rowLabel: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  rowSubtitle: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  },
  statusEnabled: {
    backgroundColor: COLORS.green[50],
  },
  statusDisabled: {
    backgroundColor: COLORS.gray[100],
  },
  statusText: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
  },
  statusTextEnabled: {
    color: COLORS.green[700],
  },
  statusTextDisabled: {
    color: COLORS.gray[500],
  },
  version: {
    textAlign: 'center',
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: SPACING.lg,
  },
});