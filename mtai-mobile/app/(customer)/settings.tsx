import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AlertModal from '../../src/components/AlertModal';
import Header from '../../src/components/Header';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import usePushNotifications from '../../src/hooks/usePushNotifications';
import type { User } from '../../src/api/types';

const ROLE_LABELS: Record<User['role'], string> = {
  customer: 'Customer',
  transporter: 'Transporter',
  employee: 'Employee',
  business_owner: 'Business Owner',
  admin: 'Administrator',
};

type MenuRow = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  value?: string;
};

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { pushToken, requestPermission } = usePushNotifications();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [alert, setAlert] = useState<{ type: 'info' | 'error'; message: string } | null>(null);

  const isNotificationsOn = notificationsEnabled ?? pushToken !== undefined;

  const handleToggleNotifications = async () => {
    const next = !isNotificationsOn;
    setNotificationsEnabled(next);
    if (next) {
      try {
        await requestPermission();
      } catch {
        setAlert({ type: 'error', message: 'Failed to enable push notifications.' });
        setNotificationsEnabled(false);
      }
    }
  };

  const performLogout = async () => {
    setConfirmLogout(false);
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch {
      setAlert({ type: 'error', message: 'Failed to log out. Please try again.' });
    } finally {
      setLoggingOut(false);
    }
  };

  const accountRows: MenuRow[] = [
    {
      icon: 'person-outline',
      label: 'Edit Profile',
      onPress: () => router.push('/edit-profile'),
      value: user?.name ?? 'Guest',
    },
    {
      icon: 'shield',
      label: 'Change Password',
      onPress: () => router.push('/change-password'),
    },
    {
      icon: 'notifications-none',
      label: 'Push Notifications',
      onPress: handleToggleNotifications,
      value: isNotificationsOn ? 'Enabled' : 'Disabled',
    },
  ];

  const supportRows: MenuRow[] = [
    {
      icon: 'support-agent',
      label: 'Help Center',
      onPress: () => router.push('/help-center'),
    },
    {
      icon: 'headset-mic',
      label: 'Contact Support',
      onPress: () => router.push('/contact-support'),
      value: 'support@m-tai.app',
    },
    {
      icon: 'help-outline',
      label: 'FAQ',
      onPress: () => router.push('/faq'),
    },
  ];

  const privacyRows: MenuRow[] = [
    {
      icon: 'privacy-tip',
      label: 'Privacy Policy',
      onPress: () => router.push('/privacy-policy'),
    },
    {
      icon: 'description',
      label: 'Terms & Conditions',
      onPress: () => router.push('/terms'),
    },
    {
      icon: 'delete-outline',
      label: 'Delete Account',
      onPress: () => router.push('/delete-account'),
    },
  ];

  const aboutRows: MenuRow[] = [
    { icon: 'info-outline', label: 'About M-TAI', value: 'v1.0.0', onPress: () => router.push('/about') },
  ];

  const renderSection = (title: string, rows: MenuRow[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.group}>
        {rows.map((row, i) => {
          const last = i === rows.length - 1;
          return (
            <TouchableOpacity
              key={row.label}
              activeOpacity={0.7}
              onPress={row.onPress}
              style={[styles.row, !last && styles.rowBorder]}
            >
              <View style={styles.rowIcon}>
                <MaterialIcons name={row.icon} size={20} color={COLORS.primaryDark} />
              </View>
              <Text style={styles.rowLabel}>{row.label}</Text>
              {row.value ? (
                <Text style={styles.rowValue} numberOfLines={1}>
                  {row.value}
                </Text>
              ) : null}
              {row.label === 'Push Notifications' ? (
                <Switch
                  value={isNotificationsOn}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              ) : (
                <MaterialIcons name="chevron-right" size={22} color={COLORS.gray[400]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Header title="Settings" onBack={() => router.replace('/profile')} />

      <ScrollView contentContainerStyle={styles.scroll} bounces={false} showsVerticalScrollIndicator={false}>
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {(user?.name?.trim()?.charAt(0) || 'S').toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
            <Text style={styles.userRole}>
              {user ? ROLE_LABELS[user.role] ?? user.role : '—'} · {user?.email ?? ''}
            </Text>
          </View>
          <MaterialIcons name="verified" size={18} color="#1D9BF0" />
        </View>

        {renderSection('Account', accountRows)}
        {renderSection('Support', supportRows)}
        {renderSection('Privacy & Security', privacyRows)}
        {renderSection('About', aboutRows)}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setConfirmLogout(true)}
          style={styles.logoutButton}
        >
          <MaterialIcons name="logout" size={20} color={COLORS.red[700]} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>M-TAI v1.0.0</Text>
      </ScrollView>

      <AlertModal
        visible={confirmLogout}
        type="warning"
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        cancelText="Cancel"
        onConfirm={performLogout}
        onCancel={() => setConfirmLogout(false)}
      />
      <AlertModal
        visible={alert !== null}
        type={alert?.type === 'error' ? 'error' : 'info'}
        title={alert?.type === 'error' ? 'Error' : 'M-TAI'}
        message={alert?.message ?? ''}
        confirmText="OK"
        onConfirm={() => setAlert(null)}
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
    gap: SPACING.sm + 2,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: FONTS.size.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primaryDark,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  userRole: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 2,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.bold,
    color: COLORS.textLight,
    marginHorizontal: SPACING.lg,
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
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  rowValue: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    maxWidth: 140,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    backgroundColor: COLORS.red[50] ?? '#FFF5F5',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  logoutText: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.red[700],
  },
  version: {
    textAlign: 'center',
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: SPACING.lg,
  },
});