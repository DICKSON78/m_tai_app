import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../src/api/client';
import AlertModal from '../../src/components/AlertModal';
import Button from '../../src/components/Button';
import Input from '../../src/components/Input';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, FONTS, RADIUS, SPACING } from '../../src/constants/theme';

const VEHICLE_OPTIONS = [
  { value: 'motorcycle', label: 'Boda / Motorcycle', icon: 'two-wheeler' as const },
  { value: 'car', label: 'Gari / Car', icon: 'directions-car' as const },
  { value: 'bicycle', label: 'Bicycle', icon: 'directions-bike' as const },
];

interface RegionOption {
  id: number;
  name: string;
}

export default function RegisterTransporterScreen() {
  const router = useRouter();
  const registerTransporter = useAuthStore((state) => state.registerTransporter);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+255');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [plateNumber, setPlateNumber] = useState('');
  const [region, setRegion] = useState<string | null>(null);
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [regionPickerVisible, setRegionPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    api
      .get('/locations/regions')
      .then((response) => {
        if (!cancelled) {
          const data = response.data?.data ?? response.data;
          if (Array.isArray(data)) setRegions(data as RegionOption[]);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleRegister = useCallback(async () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Full name is required';
    if (!email.trim()) nextErrors.email = 'Email is required';
    if (!phone.trim() || phone.trim() === '+255') nextErrors.phone = 'Phone number is required';
    if (!password) nextErrors.password = 'Password is required';
    else if (password.length < 6) nextErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword) nextErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';
    if (!vehicleType) nextErrors.vehicle_type = 'Choose your vehicle';
    if (!region) nextErrors.region = 'Choose your region';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await registerTransporter({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        password_confirmation: confirmPassword,
        vehicle_type: vehicleType,
        plate_number: plateNumber.trim() || undefined,
        region: region ?? undefined,
      });
      router.replace('/(transporter)');
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (err?.response?.status === 422
          ? 'Validation failed. Please check your input.'
          : 'Unable to connect. Please check your connection and try again.');
      setAlertError(message);
    } finally {
      setSubmitting(false);
    }
  }, [
    name,
    email,
    phone,
    password,
    confirmPassword,
    vehicleType,
    plateNumber,
    region,
    registerTransporter,
    router,
  ]);

  const iconColor = COLORS.gray[400];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandSection}>
            <View style={styles.logoBadge}>
              <MaterialIcons name="local-shipping" size={30} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Jiunge kama Dereva</Text>
            <Text style={styles.subtitle}>
              Jisajili, washiriki kwenye ramani, na upokee ofa za mzigo karibu nawe.
            </Text>
          </View>

          <Input
            label="Full Name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              clearError('name');
            }}
            placeholder="Jina lako kamili"
            error={errors.name}
            icon={<MaterialIcons name="person-outline" size={20} color={iconColor} />}
            style={styles.fieldSpacing}
          />

          <Input
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearError('email');
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            error={errors.email}
            icon={<MaterialIcons name="alternate-email" size={20} color={iconColor} />}
            style={styles.fieldSpacing}
          />

          <Input
            label="Phone"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              clearError('phone');
            }}
            placeholder="+255 7XX XXX XXX"
            keyboardType="phone-pad"
            error={errors.phone}
            icon={<MaterialIcons name="phone" size={20} color={iconColor} />}
            style={styles.fieldSpacing}
          />

          <Text style={styles.sectionTitle}>Vehicle</Text>
          <View style={styles.vehicleRow}>
            {VEHICLE_OPTIONS.map((option) => {
              const selected = vehicleType === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.vehicleOption, selected && styles.vehicleOptionSelected]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setVehicleType(option.value);
                    clearError('vehicle_type');
                  }}
                >
                  <MaterialIcons
                    name={option.icon}
                    size={22}
                    color={selected ? COLORS.white : COLORS.gray[500]}
                  />
                  <Text
                    style={[styles.vehicleLabel, selected && styles.vehicleLabelSelected]}
                    numberOfLines={2}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.vehicle_type ? <Text style={styles.errorText}>{errors.vehicle_type}</Text> : null}

          <Input
            label="Plate Number (optional)"
            value={plateNumber}
            onChangeText={setPlateNumber}
            placeholder="T123ABC"
            icon={<MaterialIcons name="confirmation-number" size={20} color={iconColor} />}
            style={styles.fieldSpacing}
          />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setRegionPickerVisible(true)}
            style={styles.fieldSpacing}
          >
            <Input
              label="Region"
              value={region ?? ''}
              onChangeText={() => undefined}
              placeholder="Chagua mkoa wako"
              editable={false}
              error={errors.region}
              icon={<MaterialIcons name="place" size={20} color={iconColor} />}
            />
          </TouchableOpacity>

          <Input
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError('password');
            }}
            placeholder="Minimum 6 characters"
            secureTextEntry
            error={errors.password}
            icon={<MaterialIcons name="lock" size={20} color={iconColor} />}
            style={styles.fieldSpacing}
          />

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              clearError('confirmPassword');
            }}
            placeholder="Re-enter your password"
            secureTextEntry
            error={errors.confirmPassword}
            icon={<MaterialIcons name="verified-user" size={20} color={iconColor} />}
            style={styles.fieldSpacing}
          />

          <Button
            title="Create Driver Account"
            onPress={handleRegister}
            loading={submitting}
            size="lg"
            style={styles.submitButton}
          />

          <TouchableOpacity
            style={styles.backRow}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>Back to sign in</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={regionPickerVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRegionPickerVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chagua Mkoa</Text>
            <FlatList
              data={regions}
              keyExtractor={(item) => String(item.id)}
              style={styles.regionList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.regionRow}
                  activeOpacity={0.8}
                  onPress={() => {
                    setRegion(item.name);
                    clearError('region');
                    setRegionPickerVisible(false);
                  }}
                >
                  <Text style={styles.regionName}>{item.name}</Text>
                  {region === item.name ? (
                    <MaterialIcons name="check" size={20} color={COLORS.primaryDark} />
                  ) : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.modalHint}>Mikoa haipatikani kwa sasa.</Text>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <AlertModal
        visible={alertError !== null}
        type="error"
        title="Registration Failed"
        message={alertError ?? ''}
        confirmText="Try Again"
        onConfirm={() => setAlertError(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxl },
  brandSection: { alignItems: 'center', paddingTop: SPACING.xl, paddingBottom: SPACING.lg },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.teal[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.size.xxl,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.size.md,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs + 2,
  },
  sectionTitle: {
    fontSize: FONTS.size.sm,
    fontFamily: FONTS.bold,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  vehicleRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  vehicleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  vehicleOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  vehicleLabel: {
    fontSize: FONTS.size.xs,
    fontFamily: FONTS.semibold,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  vehicleLabelSelected: { color: COLORS.white },
  fieldSpacing: { marginBottom: SPACING.md },
  submitButton: { marginTop: SPACING.lg },
  errorText: { color: COLORS.red[700], fontSize: FONTS.size.sm, marginBottom: SPACING.sm },
  backRow: { alignItems: 'center', marginTop: SPACING.lg },
  backText: {
    color: COLORS.primaryDark,
    fontSize: FONTS.size.md,
    fontFamily: FONTS.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONTS.size.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  modalHint: { color: COLORS.textLight, fontSize: FONTS.size.md, paddingVertical: SPACING.md },
  regionList: { flexGrow: 0 },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  regionName: { color: COLORS.text, fontSize: FONTS.size.md },
});
