import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { COLORS } from '../../src/constants/theme';

const TAB_COLOR_ACTIVE = '#00D4AA';
const TAB_COLOR_INACTIVE = '#9CA3AF';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 18, lineHeight: 22, opacity: focused ? 1 : 0.55 }}>
      {icon}
    </Text>
  );
}

export default function CustomerLayout() {
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
          title: 'Shop',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🛍" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📦" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🛒" focused={focused} />
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
      <Tabs.Screen name="deliveries" options={{ title: 'Deliveries', href: null }} />
      <Tabs.Screen name="delivery-detail" options={{ title: 'Delivery Detail', href: null }} />
      <Tabs.Screen name="wishlist" options={{ title: 'Wishlist', href: null }} />
      <Tabs.Screen name="order-detail" options={{ title: 'Order Detail', href: null }} />
      <Tabs.Screen name="product-detail" options={{ title: 'Product Detail', href: null }} />
      <Tabs.Screen name="checkout" options={{ title: 'Checkout', href: null }} />
    </Tabs>
  );
}
