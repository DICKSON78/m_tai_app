import { Tabs } from 'expo-router';
import { Text } from 'react-native';

const TAB_COLOR_ACTIVE = '#00D4AA';
const TAB_COLOR_INACTIVE = '#9CA3AF';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 18, lineHeight: 22, opacity: focused ? 1 : 0.55 }}>
      {icon}
    </Text>
  );
}

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TAB_COLOR_ACTIVE,
        tabBarInactiveTintColor: TAB_COLOR_INACTIVE,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🧭" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="businesses"
        options={{
          title: 'Businesses',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏢" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👥" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
