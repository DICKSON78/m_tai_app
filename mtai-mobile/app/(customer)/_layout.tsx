import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../src/constants/theme';

const TAB_COLOR_ACTIVE = COLORS.primaryDark;
const TAB_COLOR_INACTIVE = '#9CA3AF';
const TAB_BAR_HEIGHT = 62;

const ACTIVE_MAP: Record<string, string[]> = {
  '/': ['/', '/product-detail', '/wishlist'],
  '/orders': ['/orders', '/order-detail', '/deliveries', '/delivery-detail'],
  '/cart': ['/cart', '/checkout'],
  '/profile': [
    '/profile',
    '/settings',
    '/edit-profile',
    '/change-password',
    '/help-center',
    '/contact-support',
    '/faq',
    '/privacy-policy',
    '/terms',
    '/delete-account',
    '/about',
  ],
};

function TabIcon({
  icon,
  focused,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  focused: boolean;
}) {
  return (
    <MaterialIcons
      name={icon}
      size={22}
      color={focused ? TAB_COLOR_ACTIVE : TAB_COLOR_INACTIVE}
    />
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={[
        {
          fontSize: 11,
          fontFamily: FONTS.medium,
          color: focused ? TAB_COLOR_ACTIVE : TAB_COLOR_INACTIVE,
        },
      ]}
    >
      {label}
    </Text>
  );
}

function useTabBarStyle() {
  const insets = useSafeAreaInsets();
  return {
    height: TAB_BAR_HEIGHT + insets.bottom,
    paddingBottom: Math.max(8, insets.bottom),
    paddingTop: 6,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  };
}

export default function CustomerLayout() {
  const tabBarStyle = useTabBarStyle();
  const pathname = usePathname();

  const isTabActive = (route: string) => {
    const keys = Object.keys(ACTIVE_MAP);
    const current = keys.find((k) => (ACTIVE_MAP[k] ?? []).includes(pathname));
    return current === route;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: TAB_COLOR_ACTIVE,
        tabBarInactiveTintColor: TAB_COLOR_INACTIVE,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: FONTS.medium,
        },
        tabBarStyle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Shop',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="storefront" focused={focused || isTabActive('/')} />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Shop" focused={focused || isTabActive('/')} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="receipt-long" focused={focused || isTabActive('/orders')} />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Orders" focused={focused || isTabActive('/orders')} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="shopping-cart" focused={focused || isTabActive('/cart')} />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Cart" focused={focused || isTabActive('/cart')} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="person-outline" focused={focused || isTabActive('/profile')} />
          ),
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Profile" focused={focused || isTabActive('/profile')} />
          ),
        }}
      />
      <Tabs.Screen name="deliveries" options={{ title: 'Deliveries', href: null }} />
      <Tabs.Screen name="delivery-detail" options={{ title: 'Delivery Detail', href: null }} />
      <Tabs.Screen name="wishlist" options={{ title: 'Wishlist', href: null }} />
      <Tabs.Screen name="order-detail" options={{ title: 'Order Detail', href: null }} />
      <Tabs.Screen name="product-detail" options={{ title: 'Product Detail', href: null }} />
      <Tabs.Screen name="checkout" options={{ title: 'Checkout', href: null }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', href: null }} />
      <Tabs.Screen name="edit-profile" options={{ title: 'Edit Profile', href: null }} />
      <Tabs.Screen name="change-password" options={{ title: 'Change Password', href: null }} />
      <Tabs.Screen name="help-center" options={{ title: 'Help Center', href: null }} />
      <Tabs.Screen name="contact-support" options={{ title: 'Contact Support', href: null }} />
      <Tabs.Screen name="faq" options={{ title: 'FAQ', href: null }} />
      <Tabs.Screen name="privacy-policy" options={{ title: 'Privacy Policy', href: null }} />
      <Tabs.Screen name="terms" options={{ title: 'Terms & Conditions', href: null }} />
      <Tabs.Screen name="delete-account" options={{ title: 'Delete Account', href: null }} />
      <Tabs.Screen name="about" options={{ title: 'About', href: null }} />
    </Tabs>
  );
}
