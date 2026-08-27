import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../src/store/authStore';
import LoadingScreen from '../src/components/LoadingScreen';
import ErrorBoundary from '../src/components/ErrorBoundary';
import {
  configureNotificationHandler,
  handleNotificationResponse,
} from '../src/utils/notifications';
import usePushNotifications from '../src/hooks/usePushNotifications';

export default function RootLayout() {
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

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
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
  );
}
