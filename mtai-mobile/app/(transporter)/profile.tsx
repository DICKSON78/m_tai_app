import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import api from '../../src/api/client';
import { useAuthStore } from '../../src/store/authStore';
import Avatar from '../../src/components/Avatar';
import Badge from '../../src/components/Badge';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Header from '../../src/components/Header';
import Input from '../../src/components/Input';
import LoadingScreen from '../../src/components/LoadingScreen';
import { COLORS, FONTS, RADIUS, SPACING } from '../../src/constants/theme';

interface TransporterProfileResponse {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  vehicle_type?: string | null;
  vehicle_plate?: string | null;
  is_available?: boolean;
}

interface TransporterStatsResponse {
  total_deliveries?: number;
  active_deliveries?: number;
  completion_rate?: number;
}

function normalizeObject<T extends object>(payload: unknown): T {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const data = (payload as { data?: unknown }).data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as T;
    }
    return payload as T;
  }
  return {} as T;
}

export default function TransporterProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [profile, setProfile] = useState<TransporterProfileResponse>({});
  const [stats, setStats] = useState<TransporterStatsResponse>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editVehicleType, setEditVehicleType] = useState('');
  const [editVehiclePlate, setEditVehiclePlate] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const loadData = useCallback(async () => {
    setLoadError(null);
    const [profileRes, statsRes] = await Promise.allSettled([
      api.get('/transporter/profile'),
      api.get('/transporter/stats'),
    ]);
    if (profileRes.status === 'fulfilled') {
      const nextProfile = normalizeObject<TransporterProfileResponse>(profileRes.value.data);
      setProfile(nextProfile);
      setIsAvailable(Boolean(nextProfile.is_available));
    }
    if (statsRes.status === 'fulfilled') {
      setStats(normalizeObject<TransporterStatsResponse>(statsRes.value.data));
    }
    if (profileRes.status === 'rejected' && statsRes.status === 'rejected') {
      setLoadError('Could not load your profile. Pull down to retry.');
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setInitialLoading(false));
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), useAuthStore.getState().refreshUser()]);
    setRefreshing(false);
  }, [loadData]);

  const toggleAvailability = useCallback(
    (value: boolean) => {
      const previous = isAvailable;
      setIsAvailable(value);
      setSavingAvailability(true);
      api
        .put('/transporter/availability', { is_available: value })
        .catch(() => {
          setIsAvailable(previous);
          Alert.alert(
            'Could not update availability',
            'Your online status was not saved. Please try again.'
          );
        })
        .finally(() => setSavingAvailability(false));
    },
    [isAvailable]
  );

  const handleLogout = useCallback(() => {
    Alert.alert('Log out', 'Are you sure you want to log out of M-TAI?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          try {
            router.replace('/(auth)/login');
          } catch {
            router.replace('/');
          }
        },
      },
    ]);
  }, [logout]);

  const openEditModal = useCallback(() => {
    setEditName(profile.name ?? user?.name ?? '');
    setEditPhone(profile.phone ?? user?.phone ?? '');
    setEditVehicleType(profile.vehicle_type ?? '');
    setEditVehiclePlate(profile.vehicle_plate ?? '');
    setEditErrors({});
    setEditVisible(true);
  }, [profile, user]);

  const handleSaveProfile = useCallback(async () => {
    const nextErrors: Record<string, string> = {};
    if (!editName.trim()) nextErrors.name = 'Name is required';
    if (!editPhone.trim()) nextErrors.phone = 'Phone is required';
    if (Object.keys(nextErrors).length > 0) {
      setEditErrors(nextErrors);
      return;
    }
    setEditErrors({});
    setSavingProfile(true);
    try {
      await api.put('/transporter/profile', {
        name: editName.trim(),
        phone: editPhone.trim(),
        vehicle_type: editVehicleType.trim() || null,
        vehicle_plate: editVehiclePlate.trim() || null,
      });
      setEditVisible(false);
      Alert.alert('Profile updated', 'Your profile has been saved successfully.');
      loadData();
    } catch (err: any) {
      Alert.alert(
        'Update failed',
        err?.response?.data?.message || err?.message || 'Could not update profile. Please try again.'
      );
    } finally {
      setSavingProfile(false);
    }
  }, [editName, editPhone, editVehicleType, editVehiclePlate, loadData]);

  if (initialLoading) {
    return <LoadingScreen />;
  }

  const name = profile.name ?? user?.name ?? 'Transporter';
  const email = profile.email ?? user?.email ?? '';
  const phone = profile.phone ?? user?.phone ?? '';
  const avatarUri = profile.avatar ?? user?.avatar;

  const totalDeliveries = stats.total_deliveries ?? 0;
  const activeDeliveries = stats.active_deliveries ?? 0;
  const rawRate = stats.completion_rate ?? 0;
  const completionRate = Math.max(0, Math.min(100, rawRate <= 1 ? rawRate * 100 : rawRate));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header title="Profile" subtitle="Transporter" />
      {loadError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <Card style={styles.section}>
          <View style={styles.identityRow}>
            <Avatar uri={avatarUri} name={name} size={64} />
            <View style={styles.identityInfo}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              {email ? (
                <Text style={styles.contactLine} numberOfLines={1}>
                  {email}
                </Text>
              ) : null}
              {phone ? (
                <Text style={styles.contactLine} numberOfLines={1}>
                  {phone}
                </Text>
              ) : null}
            </View>
            <Badge label="Transporter" color={COLORS.primaryDark} size="sm" />
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.availabilityRow}>
            <View style={styles.availabilityInfo}>
              <Text style={styles.availabilityTitle}>Available for deliveries</Text>
              <Text style={styles.availabilitySubtitle}>
                {isAvailable
                  ? 'You are online and receiving new delivery offers.'
                  : 'Go online to start receiving delivery offers.'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={toggleAvailability}
              disabled={savingAvailability}
              trackColor={{ false: COLORS.gray[300], true: COLORS.primary }}
              thumbColor={COLORS.white}
              ios_backgroundColor={COLORS.gray[300]}
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.primaryDark }]}>
                {totalDeliveries}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.info }]}>{activeDeliveries}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>
                {completionRate.toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
          </View>
        </Card>

        {profile.vehicle_type || profile.vehicle_plate ? (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle</Text>
            {profile.vehicle_type ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type</Text>
                <Text style={styles.detailValue}>{profile.vehicle_type}</Text>
              </View>
            ) : null}
            {profile.vehicle_plate ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plate</Text>
                <Text style={styles.detailValue}>{profile.vehicle_plate}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        <Button
          title="Edit Profile"
          variant="outline"
          size="md"
          onPress={openEditModal}
          style={styles.editButton}
        />

        <Card style={[styles.section, styles.linksCard]}>
          <TouchableOpacity
            style={styles.linkRow}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/map' })}
          >
            <Text style={styles.linkText}>Active Deliveries Map</Text>
            <Text style={styles.linkChevron}>{'>'}</Text>
          </TouchableOpacity>
          <View style={styles.linkDivider} />
          <TouchableOpacity
            style={styles.linkRow}
            activeOpacity={0.7}
            onPress={() => router.replace({ pathname: '/' })}
          >
            <Text style={styles.linkText}>My Deliveries</Text>
            <Text style={styles.linkChevron}>{'>'}</Text>
          </TouchableOpacity>
        </Card>

        <Button
          title="Log Out"
          variant="danger"
          size="lg"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </ScrollView>

      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.modalSubtitle}>Update your personal and vehicle information.</Text>

            <Input
              label="Name"
              value={editName}
              onChangeText={(t) => { setEditName(t); if (editErrors.name) setEditErrors((p) => ({ ...p, name: '' })); }}
              placeholder="Your full name"
              error={editErrors.name}
              style={styles.fieldSpacing}
            />
            <Input
              label="Phone"
              value={editPhone}
              onChangeText={(t) => { setEditPhone(t); if (editErrors.phone) setEditErrors((p) => ({ ...p, phone: '' })); }}
              placeholder="+255 7XX XXX XXX"
              keyboardType="phone-pad"
              error={editErrors.phone}
              style={styles.fieldSpacing}
            />
            <Input
              label="Vehicle Type"
              value={editVehicleType}
              onChangeText={setEditVehicleType}
              placeholder="e.g. Motorcycle, Van"
              style={styles.fieldSpacing}
            />
            <Input
              label="Vehicle Plate"
              value={editVehiclePlate}
              onChangeText={setEditVehiclePlate}
              placeholder="e.g. T123ABC"
              autoCapitalize="characters"
              style={styles.fieldSpacing}
            />

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="secondary" onPress={() => setEditVisible(false)} style={styles.modalActionBtn} />
              <Button title="Save" onPress={handleSaveProfile} loading={savingProfile} style={styles.modalActionBtn} />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorBanner: {
    backgroundColor: COLORS.red[100],
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  errorText: {
    color: COLORS.red[700],
    fontSize: FONTS.size.sm,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl + SPACING.lg,
  },
  section: {
    marginBottom: SPACING.md,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  identityInfo: {
    flex: 1,
  },
  name: {
    fontSize: FONTS.size.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  contactLine: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityTitle: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  availabilitySubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: 4,
    lineHeight: 19,
  },
  sectionTitle: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONTS.size.xxl,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.xs,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 40,
    backgroundColor: COLORS.gray[200],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  detailLabel: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
  },
  detailValue: {
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  linksCard: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  linkText: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.semibold,
    color: COLORS.text,
  },
  linkChevron: {
    fontSize: FONTS.size.xl,
    color: COLORS.gray[400],
  },
  linkDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.gray[200],
  },
  logoutButton: {
    marginTop: SPACING.sm,
  },
  editButton: {
    marginBottom: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONTS.size.xl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: FONTS.size.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs + 2,
    marginBottom: SPACING.md,
    lineHeight: 19,
  },
  fieldSpacing: {
    marginBottom: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm + 2,
    marginTop: SPACING.sm,
  },
  modalActionBtn: {
    flex: 1,
  },
});
