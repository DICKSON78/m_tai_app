import { useEffect } from 'react';
import { Text, TextInput, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../src/store/authStore';
import LoadingScreen from '../src/components/LoadingScreen';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { FONT } from '../src/constants/theme';
import {
  configureNotificationHandler,
  handleNotificationResponse,
} from '../src/utils/notifications';
import usePushNotifications from '../src/hooks/usePushNotifications';

// Global default font so all Text renders in Poppins unless overridden.
function setDefaultFontFamily(Component: unknown, fontFamily: string) {
  const candidate = Component as { defaultProps?: { style?: unknown } };
  const existing = candidate.defaultProps || {};
  candidate.defaultProps = {
    ...existing,
    style: [existing.style, { fontFamily }],
  };
}

try {
  setDefaultFontFamily(Text, FONT.regular);
  setDefaultFontFamily(TextInput, FONT.regular);
} catch {
  // ignore — styles fall back to the explicit family on shared components
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    [FONT.regular]: require('../assets/fonts/Poppins_400Regular.ttf'),
    [FONT.medium]: require('../assets/fonts/Poppins_500Medium.ttf'),
    [FONT.semibold]: require('../assets/fonts/Poppins_600SemiBold.ttf'),
    [FONT.bold]: require('../assets/fonts/Poppins_700Bold.ttf'),
  });

  configureNotificationHandler();
  usePushNotifications();

  const isLoading = useAuthStore((state) => state.isLoading);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );
    return () => subscription.remove();
  }, []);

  if (isLoading || !fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(transporter)" />
          <Stack.Screen name="(employee)" />
          <Stack.Screen name="(owner)" />
          <Stack.Screen name="(admin)" />
        </Stack>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
