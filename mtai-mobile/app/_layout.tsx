import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import LoadingScreen from '../src/components/LoadingScreen';

export default function RootLayout() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(transporter)" />
      <Stack.Screen name="(employee)" />
      <Stack.Screen name="(owner)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}
