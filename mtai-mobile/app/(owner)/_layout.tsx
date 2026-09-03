import { Stack } from 'expo-router';

export default function OwnerRootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="order-detail" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="product-detail" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
