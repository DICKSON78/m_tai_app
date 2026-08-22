import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import Avatar from '../../src/components/Avatar';
import { useAuthStore } from '../../src/store/authStore';
import usePushNotifications from '../../src/hooks/usePushNotifications';
import { COLORS, SPACING, FONTS, RADIUS } from '../../src/constants/theme';
import { User } from '../../src/api/types';

const ROLE_LABELS: Record<User['role'], string> = {
  customer: 'Customer',
  transporter: 'Transporter',
  employee: 'Employee',
  business_owner: 'Business Owner',
  admin: 'Administrator',
};

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [loggingOut, setLoggingOut] = useState(false);
  const [enablingNotifications, setEnablingNotifications] = useState(false);
  const { pushToken, requestPermission } = usePushNotifications();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: performLogout },
    ]);
  };

  const performLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleEnableNotifications = async () => {
    setEnablingNotifications(true);
    try {
      const token = await requestPermission();
      if (!token) {
        Alert.alert('Notifications', 'Push notifications are not available on this device.');
      }
    } catch {
      Alert.alert('Error', 'Failed to enable push notifications. Please try again.');
    } finally {
      setEnablingNotifications(false);
    }
  };

  const infoRows: { label: string; value: string }[] = [
    { label: 'Full Name', value: user?.name || '—' },
    { label: 'Email', value: user?.email || '—' },
    ...(user?.phone ? [{ label: 'Phone', value: user.phone }] : []),
    { label: 'Role', value: user ? ROLE_LABELS[user.role] ?? user.role : '—' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar name={user?.name || '?'} uri={user?.avatar} size={80} />
          <Text style={styles.name}>{user?.name || 'Guest'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {user ? ROLE_LABELS[user.role] ?? user.role : '—'}
            </Text>
          </View>
        </View>

        {/* Account details */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          {infoRows.map((row) => (
            <View key={row.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </Card>

        {/* Notifications */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Push Notifications</Text>
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
          </View>
          {!pushToken && (
            <Button
              title="Enable Notifications"
              variant="secondary"
              onPress={handleEnableNotifications}
              loading={enablingNotifications}
              size="sm"
              style={styles.notificationButton}
            />
          )}
        </Card>

        {/* Actions */}
        <Button
          title="Log Out"
          variant="danger"
          onPress={handleLogout}
          loading={loggingOut}
          size="lg"
          style={styles.logoutButton}
        />

        <Text style={styles.version}>M-TAI v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  header: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg + SPACING.md,
    borderBottomLeftRadius: RADIUS.xl + 8,
    borderBottomRightRadius: RADIUS.xl + 8,
  },
  name: {
    fontSize: FONTS.size.xxl - 4,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: SPACING.md,
  },
  roleBadge: {
    marginTop: SPACING.sm + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  roleBadgeText: {
    fontSize: FONTS.size.sm,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  sectionCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.size.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  infoLabel: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
  },
  infoValue: {
    flexShrink: 1,
    marginLeft: SPACING.md,
    fontSize: FONTS.size.md,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  statusBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  },
  statusEnabled: {
    backgroundColor: COLORS.green[100],
  },
  statusDisabled: {
    backgroundColor: COLORS.gray[100],
  },
  statusText: {
    fontSize: FONTS.size.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusTextEnabled: {
    color: COLORS.green[700],
  },
  statusTextDisabled: {
    color: COLORS.gray[500],
  },
  notificationButton: {
    marginTop: SPACING.md,
    alignSelf: 'flex-start',
  },
  logoutButton: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  version: {
    textAlign: 'center',
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: SPACING.lg,
  },
});
