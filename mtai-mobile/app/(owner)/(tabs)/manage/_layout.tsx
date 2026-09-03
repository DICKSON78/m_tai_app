import { Stack } from 'expo-router';

export default function ManageStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="crm" />
      <Stack.Screen name="finance" />
      <Stack.Screen name="warehouse" />
      <Stack.Screen name="manufacturing" />
      <Stack.Screen name="hr" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="purchases" />
    </Stack>
  );
}
